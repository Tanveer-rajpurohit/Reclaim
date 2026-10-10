"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Toast from "@/components/ui/Toast";
import BrandMark from "@/components/ui/BrandMark";

export default function AuthActionScreen({
  mode,
}: {
  mode: "verify" | "forgot" | "reset";
}) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");
  const [resending, setResending] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const auth = useAuth();
  useEffect(() => {
    const timer = setTimeout(() => {
      setToken(
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
      );
      const params = new URLSearchParams(window.location.search);
      setNow(Date.now());
      setEmail(params.get("email") || "");
      if (mode === "verify" && params.get("sent") === "1") {
        setMessage(
          "Check your email for your six-digit code. It expires in 10 minutes.",
        );
        setResendAt(Date.now() + 60000);
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?email=${encodeURIComponent(params.get("email") || "")}`,
        );
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [mode]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await auth.mutateAsync(
        mode === "forgot"
          ? { action: "forgot", email: String(form.get("email") || "") }
          : mode === "reset"
            ? {
                action: "reset",
                token,
                password: String(form.get("password") || ""),
              }
            : { action: "verify", email, code: String(form.get("code") || "") },
      );
      setTone("success");
      setMessage(result.message || "Your account has been updated.");
      setDone(true);
      if (mode !== "forgot")
        window.history.replaceState(null, "", window.location.pathname);
    } catch (cause) {
      setTone("error");
      setMessage(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-shell !grid-cols-1">
      <section
        className="login-main !justify-start !gap-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-labelledby="auth-action-title"
      >
        <Link className="brand login-brand" href="/">
          <BrandMark />
          reclaim
        </Link>
        <div className="login-content">
          <p className="section-kicker">YOUR ACCOUNT</p>
          <h1 id="auth-action-title">
            {mode === "verify"
              ? "Verify your email."
              : mode === "forgot"
                ? "Reset your password."
                : "Choose a new password."}
          </h1>
          <p className="login-description">
            {mode === "verify"
              ? "Enter the six-digit code from your email. Codes expire after 10 minutes."
              : mode === "forgot"
                ? "We’ll email you a link to choose a new password."
                : "Use at least 10 characters. Updating your password signs out existing sessions."}
          </p>
          {!done && (
            <form className="login-fields" onSubmit={submit}>
              {mode === "verify" && (
                <>
                  <p className="text-sm text-muted">
                    Email verification pending
                  </p>
                  <label htmlFor="verify-email">
                    Email
                    <input
                      id="verify-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      maxLength={254}
                      required
                    />
                  </label>
                  <label htmlFor="verify-code">
                    Verification code
                    <input
                      id="verify-code"
                      name="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      minLength={6}
                      maxLength={6}
                      placeholder="000000"
                      className="font-mono tracking-[0.3em]"
                      required
                    />
                  </label>
                </>
              )}
              {mode === "forgot" && (
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                  />
                </label>
              )}
              {mode === "reset" && (
                <label>
                  New password
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={10}
                    maxLength={128}
                    required
                  />
                </label>
              )}
              <button
                type="submit"
                className="reclaim-button"
                disabled={busy || resending || (mode === "reset" && !token)}
              >
                {busy
                  ? "Please wait…"
                  : mode === "verify"
                    ? "Verify email"
                    : mode === "forgot"
                      ? "Send reset link"
                      : "Update password"}
              </button>
            </form>
          )}
          {mode === "verify" && !done && (
            <button
              type="button"
              className="login-explore !flex w-fit disabled:cursor-not-allowed disabled:text-muted"
              disabled={busy || resending || !email || now < resendAt}
              onClick={async () => {
                setResending(true);
                try {
                  await auth.mutateAsync({ action: "resend", email });
                  setTone("success");
                  setMessage(
                    "If this email needs verification, a new code is on its way. Use the latest code.",
                  );
                  setResendAt(Date.now() + 60000);
                } catch (cause) {
                  setTone("error");
                  setMessage(
                    cause instanceof Error
                      ? cause.message
                      : "Could not send a new code.",
                  );
                } finally {
                  setResending(false);
                }
              }}
            >
              {resending
                ? "Sending code…"
                : now < resendAt
                  ? `Resend code in ${Math.ceil((resendAt - now) / 1000)}s`
                  : "Send a new code"}
            </button>
          )}
          {done && (
            <p className="mt-6 rounded-lg border border-line bg-[var(--blue-faint)] p-4 text-sm">
              {mode === "verify"
                ? "Email verified. Your account is ready. Sign in to continue."
                : mode === "reset"
                  ? "Password updated. Sign in with your new password."
                  : "Check your email for the password reset link."}
            </p>
          )}
          <Link href="/login" className="login-explore !flex w-fit">
            Back to sign in ↗
          </Link>
          {mode === "reset" && !done && (
            <Link href="/forgot-password" className="login-explore">
              Request a password reset
            </Link>
          )}
        </div>
      </section>
      <Toast message={message} tone={tone} onDismiss={() => setMessage("")} />
    </main>
  );
}
