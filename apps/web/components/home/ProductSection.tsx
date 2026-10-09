import { CornerIcon } from "./Icons";
export default function ProductSection() {
  return (
    <section className="product" id="building">
      <div className="product-heading">
        <span className="section-kicker">RECLAIM / THE HANDOVER FLOW</span>
        <span className="section-kicker">PROTOTYPE IN DEVELOPMENT</span>
      </div>
      <div className="product-intro">
        <h2>
          Meet Reclaim.
          <br />
          From leftovers to handovers.
        </h2>
        <p>
          List materials for free or at an asking price. A photo helps draft the
          listings; the organiser checks each one. A buyer sends a request, the
          organiser accepts, and they arrange collection directly. The seller
          marks the handover complete; both keep the record.
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
            One handover.
            <br />
            Two records.
          </h2>
          <p>
            Count completed handovers.
            <br />
            Keep a record of the exchange.
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
                <time dateTime="11:20">11:20</time>
              </li>
              <li>
                <span className="timeline-node" />
                <div>
                  <strong>Organiser accepted pickup</strong>
                  <small>DEAL / ACCEPTED</small>
                </div>
                <time dateTime="11:35">11:35</time>
              </li>
              <li>
                <span className="timeline-node current" />
                <div>
                  <strong>Seller completed the handover</strong>
                  <small>DEAL / DONE</small>
                </div>
                <time dateTime="16:10">16:10</time>
              </li>
            </ol>
          </div>
          <span className="demo-caption">EXAMPLE HANDOVER / TIMES IN IST</span>
        </article>
      </div>
    </section>
  );
}
