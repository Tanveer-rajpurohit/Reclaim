export default function InterfacesSection() {
  return (
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
            Separate reusable items from sorted material intended for recycling.
          </dd>
        </div>
        <div>
          <dt>
            <span>02</span>Free or priced
          </dt>
          <dd>
            Offer items for free or agree on a price. Payment happens outside
            the app.
          </dd>
        </div>
        <div>
          <dt>
            <span>03</span>A pickup proposal
          </dt>
          <dd>
            Show the locality and event date. The buyer proposes a pickup time
            for the seller to review.
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
  );
}
