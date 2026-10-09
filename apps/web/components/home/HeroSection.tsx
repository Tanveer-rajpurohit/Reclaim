import NoiseField from "@/components/NoiseField";
import Dock from "@/components/Dock";
import { Mark } from "./Icons";
export default function HeroSection() {
  return (
    <section className="hero" id="idea">
      <NoiseField />
      <div className="hero-content">
        <h1 className="hero-title">
          A next use
          <br />
          for what’s left.
        </h1>
        <p className="hero-copy">
          Find boards, props and materials left after events.
          <br />
          Offer yours. Request a batch. Arrange a pickup.
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
  );
}
