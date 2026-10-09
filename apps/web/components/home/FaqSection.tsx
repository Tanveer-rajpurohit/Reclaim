export default function FaqSection() {
  return (
    <section className="reclaim-questions" aria-labelledby="questions-title">
      <div>
        <p className="section-kicker">BEFORE THE HANDOVER</p>
        <h2 id="questions-title">A few practical details.</h2>
        <p>Less guessing. Fewer wasted trips.</p>
      </div>
      <div className="question-list">
        <details open>
          <summary>Who is Reclaim for?</summary>
          <p>
            Event organisers and student clubs with leftover materials, and
            clubs, makers or local collectors looking for them. You can offer a
            batch or request one you need.
          </p>
        </details>
        <details>
          <summary>Do I have to give materials away?</summary>
          <p>
            No. A listing can be free or priced. Any payment is agreed directly
            between the two people, outside Reclaim.
          </p>
        </details>
        <details>
          <summary>How does collection work?</summary>
          <p>
            The listing shows the locality and collection details. Send a
            request first; once the organiser accepts, contact details are
            shared so you can arrange pickup or agree on delivery directly.
          </p>
        </details>
        <details>
          <summary>What does a completed deal mean?</summary>
          <p>
            The seller marks the handover complete. Both people keep a material
            transfer. It does not verify recycling or measure avoided emissions;
            any material weight estimate is labelled as an estimate.
          </p>
        </details>
        <details>
          <summary>Does a photo publish a listing automatically?</summary>
          <p>
            No. Snap-to-List is planned to suggest draft items from a photo. The
            organiser checks the material, condition, quantity and offer before
            publishing, or creates the listing manually.
          </p>
        </details>
      </div>
    </section>
  );
}
