"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyCommand,
  demoId,
  seedState,
  type Command,
  type State,
} from "../../lib/reclaim";

const key = "reclaim-board-v1";
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
function decode(raw: string): State {
  const value: unknown = JSON.parse(raw);
  const sample = seedState(0);
  // Validate all persisted field types before the data can reach UI or transitions.
  function shape(v: unknown, template: unknown): boolean {
    if (Array.isArray(template))
      return (
        Array.isArray(v) &&
        v.length <= 200 &&
        v.every((x) =>
          template.length === 0 ? typeof x === "string" : shape(x, template[0]),
        )
      );
    if (record(template))
      return (
        record(v) && Object.entries(template).every(([k, t]) => shape(v[k], t))
      );
    return (
      typeof v === typeof template &&
      (typeof v !== "number" || Number.isFinite(v))
    );
  }
  if (!shape(value, sample) || !record(value) || value.version !== 1)
    throw new Error("Saved demo is invalid.");
  const state = value as unknown as State;
  if (
    !state.items.every(
      (i) =>
        i.images === undefined ||
        (Array.isArray(i.images) &&
          i.images.length <= 4 &&
          i.images.every(
            (photo) =>
              typeof photo === "string" &&
              (photo === "demo" ||
                /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
                  photo,
                )),
          )),
    )
  )
    throw new Error("Saved gallery is invalid.");
  if (
    !state.people.some((p) => p.id === demoId) ||
    !state.items.every(
      (i) =>
        state.events.some((e) => e.id === i.eventId) &&
        (i.image === "demo" ||
          /^data:image\/(jpeg|png|webp);base64,/.test(i.image)),
    ) ||
    !state.deals.every(
      (d) =>
        state.items.some((i) => i.id === d.itemId) &&
        state.people.some((p) => p.id === d.buyerId),
    )
  )
    throw new Error("Saved demo references are invalid.");
  return state;
}
interface Store {
  state: State;
  ready: boolean;
  now: number;
  error: string;
  clearError: () => void;
  run: (command: Command, actor?: string) => boolean;
  reset: () => void;
}
const Context = createContext<Store | null>(null);
export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => seedState());
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const saved = decode(raw);
          current.current = saved;
          setState(saved);
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? `Couldn’t restore this browser’s demo: ${cause.message} Use Reset demo in Profile.`
            : "Couldn’t restore the local demo.",
        );
      }
      setReady(true);
    });
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);
  function write(next: State) {
    localStorage.setItem(key, JSON.stringify(next));
    current.current = next;
    setState(next);
    setNow(Date.now());
    setError("");
  }
  function run(command: Command, actor = demoId) {
    try {
      write(applyCommand(current.current, actor, command));
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The change could not be saved. Try again.",
      );
      return false;
    }
  }
  function reset() {
    try {
      write(seedState());
    } catch {
      setError(
        "Browser storage is unavailable. Allow local storage to use this demo.",
      );
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        ready,
        now,
        error,
        clearError: () => setError(""),
        run,
        reset,
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
