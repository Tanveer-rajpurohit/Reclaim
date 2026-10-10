"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AuthActionScreen({
  mode,
}: {
  mode: "verify" | "forgot" | "reset";
}) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setTimeout(
      () =>
        setToken(
          new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
        ),
      0,
    );
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ message: string }>(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          mode === "forgot"
            ? { email: form.get("email") }
            : mode === "reset"
              ? { token, password: form.get("password") }
              : { token },
        ),
      });
      setMessage(result.message);
      setDone(true);
      if (mode !== "forgot")
        window.history.replaceState(null, "", window.location.pathname);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-shell">
      <section className="login-main" aria-labelledby="auth-action-title">
        <Link className="brand login-brand" href="/">
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
              ? "Confirm this email address to start listing and collecting materials."
              : mode === "forgot"
                ? "We’ll email you a link to choose a new password."
                : "Use at least 10 characters. Updating your password signs out existing sessions."}
          </p>
          {!done && (
            <form className="login-fields" onSubmit={submit}>
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
                disabled={busy || (mode !== "forgot" && !token)}
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
          {message && (
            <p role="status" className="auth-message">
              {message}
            </p>
          )}
          <Link href="/login" className="login-explore">
            Back to sign in ↗
          </Link>
          {mode !== "forgot" && !done && (
            <Link href="/forgot-password" className="login-explore">
              Request a password reset
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
