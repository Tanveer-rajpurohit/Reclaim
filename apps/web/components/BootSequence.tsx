"use client";
import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";

export default function BootSequence() {
  const surface = useRef<HTMLDivElement>(null);
  const [complete, setComplete] = useState(false);
  const maskId = useId().replace(/:/g, "");

  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || window.scrollY > 96) {
      element.style.display = "none";
      const frame = requestAnimationFrame(() => setComplete(true));
      return () => cancelAnimationFrame(frame);
    }
    const context = gsap.context(() => {
      const fills = element.querySelectorAll<SVGRectElement>(".boot-fill");
      const sequence = gsap.timeline({ onComplete: () => setComplete(true) });
      gsap.set(element, { autoAlpha: 1 });
      sequence.to(
        fills,
        {
          attr: { y: (index) => (index < 2 ? 0 : 16), height: 16 },
          duration: 0.8,
          stagger: 0.12,
          ease: "power2.inOut",
        },
        0.1,
      );
      sequence.fromTo(
        ".boot-caption",
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
        0.35,
      );
      sequence.fromTo(
        ".boot-steps>span",
        { opacity: 0.25, y: 4 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.22, ease: "power2.out" },
        0.65,
      );
      sequence.to(
        ".boot-filled-mark",
        {
          opacity: 0.7,
          duration: 0.2,
          ease: "sine.inOut",
          repeat: 1,
          yoyo: true,
        },
        1.4,
      );
      sequence.call(
        () => {
          element.dataset.revealing = "true";
        },
        [],
        1.65,
      );
      sequence.to(
        ".boot-symbol",
        { scale: 0.94, y: -12, duration: 0.6, ease: "power2.inOut" },
        1.65,
      );
      sequence.to(
        element,
        { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" },
        1.65,
      );
      sequence.fromTo(
        document.querySelectorAll(
          ".hero-title, .hero-copy, .hero-search, .hero-footnote",
        ),
        { y: 16 },
        { y: 0, duration: 0.8, stagger: 0.055, ease: "power3.out" },
        1.75,
      );
    }, element);
    const finish = () => {
      if (reduced.matches) {
        context.revert();
        setComplete(true);
      }
    };
    reduced.addEventListener("change", finish);
    return () => {
      reduced.removeEventListener("change", finish);
      context.revert();
    };
  }, []);

  if (complete) return null;
  return (
    <>
      <noscript>
        <style>
          {
            ".boot-sequence{display:none!important}html::-webkit-scrollbar-track,body::-webkit-scrollbar-track{background:#fff!important}html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb{background:#8098a8!important}"
          }
        </style>
      </noscript>
      <div ref={surface} className="boot-sequence" aria-hidden="true">
        <div className="boot-symbol">
          <svg className="boot-artwork" viewBox="0 0 128 128" fill="none">
            <svg x="32" y="32" width="64" height="64" viewBox="0 0 32 32">
              <defs>
                <clipPath id={`${maskId}-0`}>
                  <rect
                    className="boot-fill"
                    x="0"
                    y="16"
                    width="16"
                    height="0"
                  />
                </clipPath>
                <clipPath id={`${maskId}-1`}>
                  <rect
                    className="boot-fill"
                    x="16"
                    y="16"
                    width="16"
                    height="0"
                  />
                </clipPath>
                <clipPath id={`${maskId}-2`}>
                  <rect
                    className="boot-fill"
                    x="16"
                    y="32"
                    width="16"
                    height="0"
                  />
                </clipPath>
                <clipPath id={`${maskId}-3`}>
                  <rect
                    className="boot-fill"
                    x="0"
                    y="32"
                    width="16"
                    height="0"
                  />
                </clipPath>
              </defs>
              <path
                d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
                fill="currentColor"
                fillRule="evenodd"
                opacity="0.16"
              />
              <g
                className="boot-filled-mark"
                fill="currentColor"
                fillRule="evenodd"
              >
                <path
                  d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
                  clipPath={`url(#${maskId}-0)`}
                />
                <path
                  d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
                  clipPath={`url(#${maskId}-1)`}
                />
                <path
                  d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
                  clipPath={`url(#${maskId}-2)`}
                />
                <path
                  d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
                  clipPath={`url(#${maskId}-3)`}
                />
              </g>
            </svg>
          </svg>
          <div className="boot-caption">
            <span>reclaim</span>
            <small>A NEXT USE FOR EVENT LEFTOVERS</small>
            <div className="boot-steps">
              <span>list</span>
              <span>request</span>
              <span>collect</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
