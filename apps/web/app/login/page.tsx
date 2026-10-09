import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Your next material handover starts with Reclaim. Offer event leftovers or find a batch for your next project.",
};

export default function LoginPage() {
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
          <p className="section-kicker">YOUR NEXT HANDOVER</p>
          <h1 id="login-title">
            Good materials.
            <br />
            Another beginning.
          </h1>
          <p className="login-description">
            Sign in to offer what’s left, find what you need and keep track of
            your pickups.
          </p>
          <div className="login-notice" id="login-availability">
            <strong>We’re getting Reclaim ready.</strong>
            <p>
              Sign-in is coming soon. For now, explore how a material handover
              will work.
            </p>
          </div>
          <fieldset
            className="login-fields"
            disabled
            aria-describedby="login-availability"
          >
            <legend className="sr-only">Sign-in preview</legend>
            <label htmlFor="login-email">
              Email
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label htmlFor="login-password">
              Password
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
              />
            </label>
            <button className="reclaim-button" type="button">
              Sign-in coming soon
            </button>
          </fieldset>
          <Link className="login-explore" href="/#building">
            See how Reclaim works <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="login-footer">
          <span>© 2026 Reclaim</span>
          <Link href="/">Back to home</Link>
        </div>
      </section>
      <aside className="login-preview" aria-labelledby="preview-title">
        <div className="login-preview-heading">
          <p className="section-kicker">FROM THE FEST TO THE NEXT PROJECT</p>
          <h2 id="preview-title">
            Left after one event.
            <br />
            Needed for another.
          </h2>
          <p>
            A useful batch, a clear pickup window and someone ready to collect
            it.
          </p>
        </div>
        <div className="handover-preview">
          <article className="material-preview-card">
            <div className="preview-card-top">
              <span>EXAMPLE LISTING</span>
              <span>FOR REUSE</span>
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
                <dt>Collect</dt>
                <dd>Saturday, 2–5 PM</dd>
              </div>
            </dl>
          </article>
          <article className="pickup-preview-card">
            <span className="pickup-check" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="section-kicker">REQUEST ACCEPTED</p>
              <h3>A stage for the next club event.</h3>
              <p>
                Pickup agreed. Both people confirm once the boards change hands.
              </p>
            </div>
          </article>
        </div>
        <div className="login-preview-footer">
          <p className="section-kicker">THE HANDOVER, IN THREE STEPS</p>
          <ol>
            <li>List the batch</li>
            <li>Accept a request</li>
            <li>Confirm pickup</li>
          </ol>
          <small>Illustrative preview · Reclaim is in development</small>
        </div>
      </aside>
    </main>
  );
}
