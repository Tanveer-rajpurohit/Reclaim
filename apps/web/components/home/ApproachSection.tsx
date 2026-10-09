import Link from "next/link";
export default function ApproachSection() {
  return (
    <section className="approach" id="approach">
      <h2>
        Left after your event?
        <br />
        Give it a next use.
      </h2>
      <p>Offer the batch. Find someone who needs it. Arrange a handover.</p>
      <Link className="reclaim-button approach-entry" href="/login">
        Enter Reclaim <span aria-hidden="true">↗</span>
      </Link>
    </section>
  );
}
