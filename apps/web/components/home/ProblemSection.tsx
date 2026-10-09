import { CornerIcon } from "./Icons";
export default function ProblemSection() {
  return (
    <section className="thinking" id="problem">
      <p className="section-kicker">WHY WE’RE BUILDING</p>
      <h2>
        An event lasts a few days.
        <br />
        Its materials can go <em>further.</em>
      </h2>
      <p className="thinking-copy">
        Boards, props, pots and sorted cardboard often remain after a fest or
        cleanup. Organisers need the space cleared. Clubs, makers and collectors
        may need those same materials. Reclaim gives them a place to find each
        other and arrange a handover.
      </p>
      <div
        className="notification-stack"
        aria-label="The leftover materials problem"
      >
        <div className="notification notification-back" aria-hidden="true" />
        <div className="notification notification-middle" aria-hidden="true" />
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
  );
}
