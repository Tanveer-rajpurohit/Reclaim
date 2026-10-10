"use client";
import type {
  MarketplaceStore,
  State,
  Command,
} from "@/types/marketplace/type";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

const empty: State = {
  version: 1,
  people: [],
  events: [],
  items: [],
  deals: [],
  notices: [],
  saved: [],
};
interface Snapshot {
  state: State;
  currentUserId: string | null;
  contacts: MarketplaceStore["contacts"];
  email: string | null;
  verified: boolean;
}
const Context = createContext<MarketplaceStore | null>(null);
export function BoardProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    state: empty,
    currentUserId: null,
    contacts: {},
    email: null,
    verified: false,
  });
  const latest = useRef(snapshot);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const generation = useRef(0);
  const retries = useRef(new Map<string, string>());
  const refresh = useCallback(async () => {
    const ticket = ++generation.current;
    const next = await api<Snapshot>("/api/board");
    if (ticket !== generation.current) return;
    latest.current = next;
    setSnapshot(next);
    setReady(true);
    setNow(Date.now());
  }, []);
  useEffect(() => {
    let active = true;
    const load = () => {
      if (!active || busy.current) return;
      void refresh().catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load the board.",
          );
          setReady(true);
        }
      });
    };
    load();
    const timer = window.setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [refresh]);
  async function run(command: Command) {
    if (busy.current) return false;
    if (!latest.current.currentUserId) {
      setError("Sign in to make changes.");
      return false;
    }
    busy.current = true;
    setPending(true);
    setError("");
    generation.current++;
    let path: string;
    let method = "POST";
    let body: unknown = {};
    let revision: number | undefined;
    const state = latest.current.state;
    if (command.type === "publish") {
      path = "/api/events";
      const { eventAt, ...event } = command.event;
      body = {
        event: {
          ...event,
          eventDate: new Date(eventAt + 330 * 60000).toISOString().slice(0, 10),
        },
        items: command.items,
        safe: command.safe,
      };
    } else if (command.type === "profile") {
      path = "/api/me";
      method = "PATCH";
      const { name, phone, area, buyerType, interests } = command.profile;
      body = { name, phone, area, buyerType, interests };
    } else if (command.type === "read") {
      path = "/api/me/notifications/read";
      method = "PATCH";
      body = command.noticeId ? { noticeId: command.noticeId } : {};
    } else if (command.type === "save") {
      path = `/api/me/saved/${command.itemId}`;
      method = state.saved.includes(command.itemId) ? "DELETE" : "PUT";
    } else if ("itemId" in command) {
      path = `/api/items/${command.itemId}`;
      revision = state.items.find((i) => i.id === command.itemId)?.revision;
      if (command.type === "request") {
        path += "/requests";
        body = { pickupAt: command.pickupAt, note: command.note };
        revision = undefined;
      } else if (command.type === "withdraw") path += "/withdraw";
      else if (command.type === "edit") {
        method = "PATCH";
        body = { name: command.name, price: command.price };
      } else {
        path += "/photos";
        method = "PATCH";
        body = { image: command.image, images: command.images };
      }
    } else {
      const deal = state.deals.find((d) => d.id === command.dealId);
      revision = deal?.revision;
      const item = state.items.find((i) => i.id === deal?.itemId);
      const seller =
        state.events.find((e) => e.id === item?.eventId)?.ownerId ===
        latest.current.currentUserId;
      const action =
        command.type === "confirm"
          ? seller
            ? "complete"
            : "acknowledge"
          : command.type;
      path = `/api/deals/${command.dealId}/${action}`;
      body = { reason: command.reason || "" };
    }
    const fingerprint = JSON.stringify({ path, method, body, revision });
    const key = retries.current.get(fingerprint) || crypto.randomUUID();
    retries.current.set(fingerprint, key);
    try {
      await api(path, {
        method,
        body: ["PUT", "DELETE"].includes(method)
          ? undefined
          : JSON.stringify(body),
        headers: {
          "Idempotency-Key": key,
          ...(revision ? { "If-Match": String(revision) } : {}),
        },
      });
      retries.current.delete(fingerprint);
      try {
        await refresh();
      } catch {
        setError(
          "Your change was saved. Refresh the page to load the latest details.",
        );
      }
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your change could not be saved.",
      );
      void refresh().catch(() => undefined);
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <Context.Provider
      value={{
        ...snapshot,
        ready,
        now,
        error,
        pending,
        clearError: () => setError(""),
        run,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useBoard() {
  const value = useContext(Context);
  if (!value) throw new Error("BoardProvider is required.");
  return value;
}
