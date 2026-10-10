"use client";

import Link from "next/link";
import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { APIError } from "@/lib/api/fetch";
import { safeReturnPath } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";
import Icon from "@/components/ui/Icon";
import Toast from "@/components/ui/Toast";

export default function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const auth = useAuth();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setUnverified(false);
    const data = new FormData(event.currentTarget);
    try {
      const credentials = {
        email: String(data.get("email") || ""),
        password: String(data.get("password") || ""),
      };
      await auth.mutateAsync(
        registering
          ? {
              action: "register",
              ...credentials,
              name: String(data.get("name") || ""),
            }
          : { action: "login", ...credentials },
      );
      if (registering)
        router.push(
          `/verify-email?email=${encodeURIComponent(credentials.email)}&sent=1`,
        );
      else {
        router.push(
          safeReturnPath(
            new URLSearchParams(window.location.search).get("next"),
          ),
        );
        router.refresh();
      }
    } catch (cause) {
      setTone("error");
      setMessage(cause instanceof Error ? cause.message : "Sign in failed.");
      setUnverified(
        cause instanceof APIError && cause.code === "EMAIL_UNVERIFIED",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-main" aria-labelledby="login-title">
        <Link className="brand login-brand" href="/" aria-label="Reclaim home">
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </svg>
          <span>reclaim</span>
        </Link>
        <div className="login-content">
          <p className="section-kicker">
            {registering ? "A NEXT USE STARTS HERE" : "WELCOME BACK"}
          </p>
          <h1 id="login-title">
            {registering ? "Make room for" : "Your next handover"}
            <br />
            {registering ? "another use." : "starts here."}
          </h1>
          <p className="login-description">
            {registering
              ? "Offer leftover materials or find a batch for your next project."
              : "Sign in to your listings, requests and upcoming pickups."}
          </p>
          <form
            ref={form}
            className="login-fields"
            onSubmit={submit}
            key={mode}
          >
            {registering && (
              <label htmlFor="auth-name">
                Name
                <input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  required
                  maxLength={100}
                />
              </label>
            )}
            <label htmlFor="auth-email">
              Email
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={254}
              />
            </label>
            <div className="grid gap-2 text-sm">
              <label htmlFor="auth-password">
                <span id="auth-password-label">Password</span>
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  aria-labelledby="auth-password-label"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  className="!pr-14"
                  autoComplete={
                    registering ? "new-password" : "current-password"
                  }
                  placeholder={
                    registering ? "Create a password" : "Enter your password"
                  }
                  required
                  minLength={registering ? 10 : undefined}
                  maxLength={128}
                  aria-describedby={registering ? "password-hint" : undefined}
                />
                <button
                  type="button"
                  aria-label={
                    passwordVisible ? "Hide password" : "Show password"
                  }
                  aria-controls="auth-password"
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  className="absolute right-1 top-1 grid size-10 place-items-center rounded-md text-muted hover:bg-[var(--blue-faint)] hover:text-blue focus-visible:outline-2 focus-visible:outline-blue"
                >
                  <Icon name={passwordVisible ? "eye-off" : "eye"} size={20} />
                </button>
              </div>
              {registering && (
                <span className="password-hint" id="password-hint">
                  At least 10 characters.
                </span>
              )}
            </div>
            <button className="reclaim-button" type="submit" disabled={busy}>
              {busy
                ? registering
                  ? "Creating account…"
                  : "Signing in…"
                : registering
                  ? "Create account"
                  : "Sign in"}
              <svg
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 10h12m-5-5 5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
          {unverified && (
            <button
              className="login-explore"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await auth.mutateAsync({
                    action: "resend",
                    email: String(
                      new FormData(form.current!).get("email") || "",
                    ),
                  });
                  setMessage(
                    result.message ||
                      "Check your email for a verification code.",
                  );
                  setTone("success");
                  router.push(
                    `/verify-email?email=${encodeURIComponent(String(new FormData(form.current!).get("email") || ""))}&sent=1`,
                  );
                } catch (cause) {
                  setTone("error");
                  setMessage(
                    cause instanceof Error
                      ? cause.message
                      : "Could not send the link.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Send a verification code
            </button>
          )}
          {!registering && (
            <Link className="login-explore" href="/forgot-password">
              Forgot your password?
            </Link>
          )}
          <p className="auth-switch">
            {registering ? "Already have an account?" : "New to Reclaim?"}{" "}
            <Link href={registering ? "/login" : "/register"}>
              {registering ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <Link className="login-explore" href="/dashboard">
            Explore the material board <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="login-footer">
          <span>© 2026 Reclaim</span>
          <Link href="/">Back to home</Link>
        </div>
      </section>
      <aside className="login-preview" aria-labelledby="preview-title">
        <div className="login-preview-heading">
          <p className="section-kicker">ONE EVENT. ANOTHER BEGINNING.</p>
          <h2 id="preview-title">
            Still useful.
            <br />
            Ready for what’s next.
          </h2>
          <p>
            Materials from a campus fest.
            <br />A new stage for the next student club.
          </p>
        </div>
        <div className="handover-preview">
          <article className="material-preview-card">
            <div className="preview-card-top">
              <span>Available for reuse</span>
              <span>01 / 04</span>
            </div>
            <div className="board-art" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="preview-item-heading">
              <h3>Plywood boards</h3>
              <span>Free</span>
            </div>
            <p>4 boards · Good condition</p>
            <dl>
              <div>
                <dt>From</dt>
                <dd>Campus fest cleanup</dd>
              </div>
              <div>
                <dt>Pickup</dt>
                <dd>Saturday, 2–5 PM</dd>
              </div>
            </dl>
          </article>
          <article className="pickup-preview-card">
            <span className="pickup-check" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                <path
                  d="m5 10 3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="section-kicker">REQUEST ACCEPTED</p>
              <h3>A stage for the next club event.</h3>
              <p>Pickup arranged. A new use is one handover away.</p>
            </div>
          </article>
        </div>
        <div className="login-preview-footer">
          <p>List. Request. Hand over.</p>
          <small>Example handover · Reclaim is in development</small>
        </div>
      </aside>
      <Toast message={message} tone={tone} onDismiss={() => setMessage("")} />
    </main>
  );
}
