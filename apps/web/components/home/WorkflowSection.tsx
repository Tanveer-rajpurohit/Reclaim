export default function WorkflowSection() {
  return (
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
            A student club finds usable plywood from a fest and requests it for
            its next production.
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
        Example journeys, from an available batch to a confirmed pickup.
      </p>
    </section>
  );
}
