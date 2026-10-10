import { apiFetch } from "./fetch";

export type AuthRequest =
  | { action: "login"; email: string; password: string }
  | { action: "register"; email: string; password: string; name: string }
  | { action: "forgot" | "resend"; email: string }
  | { action: "verify"; email: string; code: string }
  | { action: "reset"; token: string; password: string }
  | { action: "logout" };

export function authenticate({ action, ...body }: AuthRequest) {
  return apiFetch<{ message?: string }>(`/api/auth/${action}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function loginHref(path: string) {
  return `/login?next=${encodeURIComponent(path)}`;
}

export function safeReturnPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return "/dashboard";
  try {
    const url = new URL(value, "https://reclaim.invalid");
    return url.origin === "https://reclaim.invalid" &&
      (url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/"))
      ? `${url.pathname}${url.search}${url.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
