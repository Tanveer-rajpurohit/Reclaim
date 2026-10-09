import NoiseField from "../components/NoiseField";
import Dock from "../components/Dock";
import MicroMotion from "../components/MicroMotion";
import BootSequence from "../components/BootSequence";

function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-mark ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
function CornerIcon({ type }: { type: "page" | "action" | "replay" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      aria-hidden="true"
    >
      {type === "page" ? (
        <>
          <rect
            x="5"
            y="3"
            width="14"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <path
            d="M8 8h8M8 12h8M8 16h5"
            stroke="currentColor"
            strokeWidth="1.25"
          />
        </>
      ) : type === "action" ? (
        <>
          <path
            d="m5 4 13 8-6 2-2 6L5 4Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M3 10a9 9 0 1 1 2.6 8.4M3 5v5h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <BootSequence />
      <a className="skip-link" href="#idea">
        Skip to content
      </a>
      <header className="site-header">
        <a href="#idea" className="brand" aria-label="Reclaim home">
          <span>reclaim</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#building">
            HOW IT WORKS <span>+</span>
          </a>
          <a href="#problem">WHY RECLAIM</a>
          <a href="#contact">THE IDEA</a>
        </nav>
        <a
          href="#idea"
          className="header-mark"
          aria-label="Back to Reclaim home"
        >
          <Mark />
        </a>
      </header>
      <main>
        <section className="hero" id="idea">
          <NoiseField />
          <div className="hero-content">
            <h1 className="hero-title">
              A next use
              <br />
              for what’s left.
            </h1>
            <p className="hero-copy">
              The event is over. The materials still have a use.
              <br />
              Connect what’s left with someone who needs it.
            </p>
            <Dock />
            <p className="hero-footnote">
              For event organisers, student clubs and local collectors.
            </p>
            <div className="hero-signature">
              <Mark />
              <span>
                THE EVENT ENDS.
                <br />
                THE MATERIALS GO ON.
              </span>
            </div>
          </div>
          <div className="hero-baseline">
            <a href="#problem">
              <span className="scroll-cue-label">SCROLL TO EXPLORE</span>
              <svg
                viewBox="0 0 12 12"
                width="12"
                height="12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 2v8M3 7l3 3 3-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </section>
        <section className="thinking" id="problem">
          <p className="section-kicker">WHY WE’RE BUILDING</p>
          <h2>
            An event lasts a few days.
            <br />
            Its materials can go <em>further.</em>
          </h2>
          <p className="thinking-copy">
            Boards, props, pots and sorted cardboard often remain after a fest
            or cleanup. Organisers need the space cleared. Clubs, makers and
            collectors may need those same materials. Reclaim gives them a place
            to find each other and arrange a handover.
          </p>
          <div
            className="notification-stack"
            aria-label="The leftover materials problem"
          >
            <div
              className="notification notification-back"
              aria-hidden="true"
            />
            <div
              className="notification notification-middle"
              aria-hidden="true"
            />
            <div className="notification notification-front">
              <span className="notification-icon">
                <CornerIcon type="page" />
              </span>
              <div>
                <strong>Still useful. Still left behind.</strong>
                <p>The next person who needs it should know it is available.</p>
              </div>
              <span className="notification-time">THE GAP</span>
            </div>
          </div>
        </section>
        <section className="product" id="building">
          <div className="product-heading">
            <span className="section-kicker">RECLAIM / THE HANDOVER FLOW</span>
            <span className="section-kicker">
              IN DEVELOPMENT / PRODUCT CONCEPT
            </span>
          </div>
          <div className="product-intro">
            <h2>
              Meet Reclaim.
              <br />
              From leftovers to handovers.
            </h2>
            <p>
              List materials for free or at an asking price. A photo helps draft
              the listings; the organiser checks each one. A buyer sends a
              request, the organiser accepts, and they arrange collection
              directly. Both confirm when the handover is done.
            </p>
            <a href="#workflows">
              Explore the handover <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="feature-grid">
            <article className="feature-story story-read">
              <CornerIcon type="page" />
              <h2>
                One photo.
                <br />
                Draft listings.
              </h2>
              <p>
                Photo to draft listings.
                <br />
                Check them before publishing.
              </p>
            </article>
            <article
              className="feature-demo tree-demo"
              aria-label="Illustrative material listing review"
            >
              <div className="mini-browser">
                <div className="mini-toolbar">
                  <span className="mini-traffic">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>event / leftovers</span>
                  <span>⌘</span>
                </div>
                <div className="mini-content">
                  <div className="view-heading">
                    <span className="file-icon">
                      <CornerIcon type="page" />
                    </span>
                    <div>
                      <strong>DTU Fest Cleanup</strong>
                      <small>LISTING REVIEW</small>
                    </div>
                  </div>
                  <div className="tree-line">
                    <span>item</span>
                    <p>Reusable plywood</p>
                  </div>
                  <div className="tree-line">
                    <span>quantity</span>
                    <p>4 boards / good condition</p>
                    <b>01</b>
                  </div>
                  <div className="tree-line">
                    <span>offer</span>
                    <p>Free for collection</p>
                    <b>02</b>
                  </div>
                  <div className="tree-line">
                    <span>item</span>
                    <p>Sorted cardboard</p>
                    <b>03</b>
                  </div>
                  <div className="tree-footer">
                    SELLER CHECKS EVERY ITEM BEFORE PUBLISHING
                  </div>
                </div>
              </div>
              <span className="demo-caption">
                PRODUCT CONCEPT / ILLUSTRATIVE OUTPUT
              </span>
            </article>
            <article className="feature-demo action-demo">
              <div className="action-window">
                <div className="action-title">
                  <CornerIcon type="action" />
                  <span>The next handover</span>
                </div>
                <div className="action-command">
                  <span>request</span>
                  <code>4 boards / Sat, 4 PM</code>
                </div>
                <div className="action-command">
                  <span>accept</span>
                  <code>Reserve for the buyer</code>
                </div>
                <div className="action-result">
                  <span className="checkmark">✓</span>
                  <p>
                    Arrange collection
                    <br />
                    <small>Contact is shared after acceptance.</small>
                  </p>
                </div>
              </div>
              <span className="demo-caption">
                PRODUCT CONCEPT / ILLUSTRATIVE OUTPUT
              </span>
            </article>
            <article className="feature-story story-act">
              <CornerIcon type="action" />
              <h2>
                A request.
                <br />
                Then, pickup.
              </h2>
              <p>
                Free or priced.
                <br />
                The organiser accepts first.
              </p>
            </article>
            <article className="feature-story story-replay">
              <CornerIcon type="replay" />
              <h2>
                Both confirm.
                <br />
                Done.
              </h2>
              <p>
                Count completed handovers.
                <br />
                No claim of verified recycling.
              </p>
            </article>
            <article className="feature-demo replay-demo">
              <div className="replay-window">
                <div className="replay-title">
                  <CornerIcon type="replay" />
                  <span>Handover record</span>
                  <span className="session-number">001</span>
                </div>
                <ol>
                  <li>
                    <span className="timeline-node" />
                    <div>
                      <strong>Buyer requested the boards</strong>
                      <small>DEAL / PENDING</small>
                    </div>
                    <time>00:00</time>
                  </li>
                  <li>
                    <span className="timeline-node" />
                    <div>
                      <strong>Organiser accepted pickup</strong>
                      <small>DEAL / ACCEPTED</small>
                    </div>
                    <time>00:02</time>
                  </li>
                  <li>
                    <span className="timeline-node current" />
                    <div>
                      <strong>Both confirmed the handover</strong>
                      <small>DEAL / DONE</small>
                    </div>
                    <time>00:03</time>
                  </li>
                </ol>
              </div>
              <span className="demo-caption">
                PRODUCT CONCEPT / ILLUSTRATIVE OUTPUT
              </span>
            </article>
          </div>
        </section>
        <section className="agent-access" id="interfaces">
          <div className="access-heading">
            <p className="section-kicker">BUILT AROUND THE HANDOVER</p>
            <h2>Keep the exchange simple.</h2>
            <p>
              The marketplace handles the request and its status. The two people
              handle pickup, optional delivery and any payment.
            </p>
          </div>
          <dl className="interface-list">
            <div>
              <dt>
                <span>01</span>Reuse or recycle
              </dt>
              <dd>
                Separate reusable items from sorted material intended for
                recycling.
              </dd>
            </div>
            <div>
              <dt>
                <span>02</span>Free or priced
              </dt>
              <dd>
                Offer items for free or agree on a price. Payment happens
                outside the app.
              </dd>
            </div>
            <div>
              <dt>
                <span>03</span>A pickup window
              </dt>
              <dd>
                Show the locality, availability and clear-by time before anyone
                requests an item.
              </dd>
            </div>
            <div>
              <dt>
                <span>04</span>Private contact
              </dt>
              <dd>
                Share contact with the other person only after the organiser
                accepts.
              </dd>
            </div>
          </dl>
        </section>
        <section className="workflow-section" id="workflows">
          <p className="section-kicker">WHERE WE’RE STARTING</p>
          <h2>
            From an event
            <br />
            to the next project.
          </h2>
          <div className="workflow-list">
            <article>
              <span>FOR REUSE</span>
              <h3>Boards become a stage.</h3>
              <p>
                A student club finds usable plywood from a fest and requests it
                for its next production.
              </p>
            </article>
            <article>
              <span>FOR COLLECTION</span>
              <h3>Cardboard finds a collector.</h3>
              <p>
                A local collector finds sorted cardboard, agrees on pickup and
                collects the batch.
              </p>
            </article>
          </div>
          <p className="workflow-note">
            These are example journeys. Collection records a transfer; what
            happens to the materials afterward is not verified by Reclaim.
          </p>
        </section>
        <section className="approach" id="approach">
          <Mark />
          <h2>
            First, a handover.
            <br />
            Then, another use.
          </h2>
          <p>
            Reclaim starts with materials left after events.
            <br />
            We’re building the prototype around one complete exchange.
          </p>
          <div className="measurement-row">
            <span>Listings handed over</span>
            <span>Deals completed</span>
            <span>Material weight</span>
            <span>Estimates labelled</span>
          </div>
          <span className="approach-note">
            RECLAIM / IN DEVELOPMENT / WASTE &amp; ENERGY
          </span>
        </section>
      </main>
      <footer id="contact">
        <div className="footer-main">
          <a className="brand footer-brand" href="#idea">
            <Mark />
            <span>reclaim</span>
          </a>
          <p>
            A next use for event leftovers.
            <br />A handover between people.
          </p>
          <div className="founder-details">
            <span>HAVE MATERIALS LEFT AFTER AN EVENT?</span>
            <a href="#building">See how Reclaim works</a>
            <small>Environmental Hacks / Waste &amp; Energy</small>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Reclaim</span>
          <span>RECLAIM / IN DEVELOPMENT</span>
          <a href="#idea">Back to top ↑</a>
        </div>
      </footer>
      <MicroMotion />
    </>
  );
}
