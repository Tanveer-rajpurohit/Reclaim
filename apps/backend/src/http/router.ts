import { z } from "zod";
import { csrf } from "../middleware/csrf.ts";
import { body } from "../middleware/request-body.ts";
import { AppError, notFound } from "../shared/errors.ts";
import {
  identity,
  requireIdentity,
  register,
  login,
  logout,
  sessionCookie,
  consumeAuthToken,
  sendAuthLink,
  rateLimit,
} from "../modules/auth/service.ts";
import {
  board,
  itemDetail,
  listItems,
  publicProfile,
  mutate,
  publish,
  manageItem,
  requestItem,
  transitionDeal,
  updateProfile,
  saveItem,
  readNotices,
  type DealAction,
} from "../modules/marketplace/service.ts";
import { id, parse } from "../shared/validation.ts";
import { uploadPhoto, readPhoto } from "../modules/photos/service.ts";
import { prisma, query } from "../db/client.ts";

function json(
  value: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
      ...headers,
    },
  });
}
export async function handle(request: Request, path: string[]) {
  try {
    const method = request.method;
    const route = path.join("/");
    csrf(request);
    if (route === "health" && method === "GET") {
      await query(prisma(), "SELECT 1");
      return json({ ok: true });
    }
    if (path[0] === "auth") {
      if (method === "POST") {
        const input = await body(request);
        if (route === "auth/register") return json(await register(input), 201);
        if (route === "auth/login") {
          const result = await login(input);
          return json({ ok: true }, 200, {
            "Set-Cookie": sessionCookie(result.token),
          });
        }
        if (route === "auth/logout") {
          await logout(request);
          return json({ ok: true }, 200, {
            "Set-Cookie": sessionCookie("", true),
          });
        }
        if (route === "auth/verify")
          return json(await consumeAuthToken(input, "verify"));
        if (route === "auth/reset")
          return json(await consumeAuthToken(input, "reset"));
        if (route === "auth/resend")
          return json(await sendAuthLink(input, "verify"));
        if (route === "auth/forgot")
          return json(await sendAuthLink(input, "reset"));
      }
      if (route === "auth/session" && method === "GET")
        return json({ user: await identity(request) });
      notFound();
    }
    const actor = await identity(request);
    if (route === "board" && method === "GET") return json(await board(actor));
    if (route === "items" && method === "GET")
      return json(await listItems(new URL(request.url).searchParams));
    if (path[0] === "items" && path.length === 2 && method === "GET")
      return json(await itemDetail(parse(id, path[1]), actor));
    if (path[0] === "users" && path.length === 2 && method === "GET")
      return json(await publicProfile(parse(id, path[1])));
    if (path[0] === "photos" && path.length === 2 && method === "GET") {
      const image = await readPhoto(parse(id, path[1]), actor);
      return new Response(new Uint8Array(image), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          Vary: "Cookie",
        },
      });
    }
    const user = requireIdentity(actor);
    if (route === "uploads" && method === "POST")
      return json(await uploadPhoto(request, user), 201);
    if (method === "GET") {
      const data = await board(user);
      if (route === "me")
        return json({
          person: data.state.people.find((p) => p.id === user.id),
          email: user.email,
          verified: user.verified,
        });
      if (route === "me/notifications")
        return json({ notifications: data.state.notices });
      if (route === "me/saved")
        return json({
          items: data.state.items.filter((i) =>
            data.state.saved.includes(i.id),
          ),
        });
      if (route === "deals") {
        const side = new URL(request.url).searchParams.get("side");
        return json({
          deals: data.state.deals.filter((d) =>
            side === "buying"
              ? d.buyerId === user.id
              : side === "selling"
                ? d.buyerId !== user.id
                : true,
          ),
        });
      }
      if (path[0] === "deals" && path.length === 2) {
        const deal = data.state.deals.find((d) => d.id === parse(id, path[1]));
        if (!deal) notFound();
        return json({ deal, contact: data.contacts[deal.id] || null });
      }
      if (route === "me/handovers" || route === "me/impact") {
        const done = data.state.deals.filter((d) => d.status === "Done");
        const records = done.map((deal) => ({
          deal,
          item: data.state.items.find((i) => i.id === deal.itemId)!,
        }));
        if (route === "me/handovers") return json({ records });
        const offered = done.filter((d) => d.buyerId !== user.id).length;
        return json({
          listings: done.length,
          offered,
          collected: done.length - offered,
          estimatedKg: records
            .filter((r) => r.item.unit === "kg")
            .reduce((sum, r) => sum + r.item.quantity, 0),
        });
      }
      notFound();
    }
    await rateLimit(`mutations:${user.id}`, 300, 60);
    const input =
      method === "DELETE" || method === "PUT" ? {} : await body(request);
    const key = request.headers.get("idempotency-key") || "";
    const revisionHeader = request.headers.get("if-match");
    const revision =
      revisionHeader === null
        ? undefined
        : parse(z.coerce.number().int().positive(), revisionHeader);
    const result = await mutate(
      user,
      key,
      `${method}:${route}`,
      { input, revision },
      async (db) => {
        if (route === "events" && method === "POST")
          return publish(db, user, input);
        if (route === "me" && method === "PATCH")
          return updateProfile(db, user, input);
        if (route === "me/notifications/read" && method === "PATCH") {
          const parsed = parse(
            z.object({ noticeId: id.optional() }).strict(),
            input,
          );
          return readNotices(db, user, parsed.noticeId);
        }
        if (
          path[0] === "me" &&
          path[1] === "saved" &&
          path.length === 3 &&
          ["PUT", "DELETE"].includes(method)
        )
          return saveItem(db, user, parse(id, path[2]), method === "PUT");
        if (path[0] === "items") {
          const itemId = parse(id, path[1]);
          if (path.length === 2 && method === "PATCH")
            return manageItem(db, user, itemId, "edit", input, revision);
          if (path.length === 3 && path[2] === "photos" && method === "PATCH")
            return manageItem(db, user, itemId, "photos", input, revision);
          if (path.length === 3 && path[2] === "withdraw" && method === "POST")
            return manageItem(db, user, itemId, "withdraw", input, revision);
          if (path.length === 3 && path[2] === "requests" && method === "POST")
            return requestItem(db, user, itemId, input);
        }
        if (path[0] === "deals" && path.length === 3 && method === "POST") {
          const action = parse(
            z.enum(["accept", "decline", "cancel", "acknowledge", "complete"]),
            path[2],
          ) as DealAction;
          return transitionDeal(
            db,
            user,
            parse(id, path[1]),
            action,
            input,
            revision,
          );
        }
        notFound();
      },
    );
    return json(
      result,
      route === "events" || path[2] === "requests" ? 201 : 200,
    );
  } catch (error) {
    if (error instanceof AppError)
      return json(
        {
          error: {
            code: error.code,
            message: error.message,
            fields: error.fields,
          },
        },
        error.status,
        error.status === 429 ? { "Retry-After": "60" } : {},
      );
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      ["23505", "40001", "40P01"].includes(String(error.code))
    )
      return json(
        {
          error: {
            code: "CONFLICT",
            message: "This record changed. Refresh and try again.",
          },
        },
        409,
      );
    console.error(
      "Backend request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return json(
      {
        error: {
          code: "INTERNAL",
          message:
            "The service could not complete this request. Please try again.",
        },
      },
      500,
    );
  }
}
