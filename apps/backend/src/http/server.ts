import { createServer, type IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { handle } from "./router.ts";

type Handler = typeof handle;

function toRequest(incoming: IncomingMessage) {
  const headers = new Headers();
  for (let i = 0; i < incoming.rawHeaders.length; i += 2)
    headers.append(incoming.rawHeaders[i]!, incoming.rawHeaders[i + 1]!);
  const controller = new AbortController();
  incoming.once("aborted", () => controller.abort());
  const init: RequestInit & { duplex?: "half" } = {
    method: incoming.method,
    headers,
    signal: controller.signal,
  };
  if (incoming.method !== "GET" && incoming.method !== "HEAD") {
    init.body = Readable.toWeb(incoming) as ReadableStream<Uint8Array>;
    init.duplex = "half";
  }
  return new Request(new URL(incoming.url || "/", "http://backend"), init);
}

export function createApiServer(handler: Handler = handle) {
  return createServer(async (incoming, outgoing) => {
    try {
      const request = toRequest(incoming);
      const pathname = new URL(request.url).pathname;
      const response = pathname.startsWith("/api/")
        ? await handler(request, pathname.slice(5).split("/"))
        : Response.json(
            { error: { code: "NOT_FOUND", message: "Route not found." } },
            { status: 404 },
          );
      outgoing.statusCode = response.status;
      response.headers.forEach((value, key) => {
        if (key !== "set-cookie") outgoing.setHeader(key, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length) outgoing.setHeader("set-cookie", cookies);
      outgoing.setHeader("X-Content-Type-Options", "nosniff");
      if (incoming.method === "HEAD" || !response.body) outgoing.end();
      else {
        const stream = response.body as Parameters<typeof Readable.fromWeb>[0];
        await pipeline(Readable.fromWeb(stream), outgoing);
      }
    } catch (error) {
      if (incoming.aborted || outgoing.destroyed) return;
      console.error(
        "HTTP transport failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      if (outgoing.headersSent) outgoing.destroy();
      else {
        outgoing.writeHead(500, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        outgoing.end(
          JSON.stringify({
            error: {
              code: "INTERNAL",
              message: "The service could not complete this request.",
            },
          }),
        );
      }
    }
  });
}
