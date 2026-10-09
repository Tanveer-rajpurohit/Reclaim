import { Mark } from "./Icons";
export default function HomeFooter() {
  return (
    <footer className="landing-footer" id="contact">
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
  );
}
