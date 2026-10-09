export default function MaterialsSection() {
  return (
    <section className="material-section" aria-labelledby="materials-title">
      <div className="material-heading">
        <p className="section-kicker">WHAT GETS A NEXT USE</p>
        <h2 id="materials-title">The useful things left in the pile.</h2>
        <p>
          Start with what you can describe, count and hand over. A clear listing
          helps the next person decide before they make the trip.
        </p>
      </div>
      <div className="material-list">
        <article>
          <span>01 / BUILD AGAIN</span>
          <h3>Boards &amp; offcuts</h3>
          <p>
            Plywood, timber and reusable panels. Include dimensions, quantity
            and any damage.
          </p>
        </article>
        <article>
          <span>02 / USE AGAIN</span>
          <h3>Props &amp; decor</h3>
          <p>
            Stage pieces, display stands and pots. Show their condition and what
            comes with them.
          </p>
        </article>
        <article>
          <span>03 / SORT FOR COLLECTION</span>
          <h3>Cardboard &amp; packaging</h3>
          <p>
            Separated batches for local collectors. State the material,
            approximate weight and collection instructions.
          </p>
        </article>
        <article>
          <span>04 / MAKE THE PICKUP CLEAR</span>
          <h3>A locality. A pickup plan.</h3>
          <p>
            Free or priced, every batch needs a clear meeting point and someone
            ready to collect it.
          </p>
        </article>
      </div>
    </section>
  );
}
