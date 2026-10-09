"use client";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";

const entries = [
  {
    title: "What is Reclaim?",
    detail: "A next use for materials left after events",
    id: "idea",
    keywords: "reuse marketplace leftovers event idea",
  },
  {
    title: "Why build it?",
    detail: "Useful materials need someone who wants them",
    id: "problem",
    keywords: "waste organisers clubs collectors problem",
  },
  {
    title: "How Reclaim works",
    detail: "Photo, review, request and handover",
    id: "building",
    keywords: "photo listing snap buy free get this handover",
  },
  {
    title: "The exchange rules",
    detail: "Reuse, prices, pickup windows and private contact",
    id: "interfaces",
    keywords: "reuse recycle free price pickup privacy rules",
  },
  {
    title: "Example journeys",
    detail: "Boards for a club, cardboard for a collector",
    id: "workflows",
    keywords: "wood cardboard collect stage example journey",
  },
  {
    title: "What we count",
    detail: "Confirmed handovers, with labelled weight estimates",
    id: "approach",
    keywords: "impact metrics weight estimate done confirmation",
  },
  {
    title: "The project",
    detail: "Environmental Hacks / Waste and Energy",
    id: "contact",
    keywords: "team project hackathon aws",
  },
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Dock() {
  const lenis = useLenis();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const results = entries.filter((entry) =>
    (entry.title + " " + entry.detail + " " + entry.keywords)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const open = () => {
    if (dialog.current?.open) return;
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setQuery("");
    setActive(0);
    dialog.current?.showModal();
    input.current?.focus();
  };
  const close = () => {
    dialog.current?.close();
    (previousFocus.current ?? trigger.current)?.focus();
  };
  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.code === "Slash" || event.key === "/")
      ) {
        event.preventDefault();
        if (dialog.current?.open) {
          dialog.current.close();
          previousFocus.current?.focus();
        } else {
          previousFocus.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
          setQuery("");
          setActive(0);
          dialog.current?.showModal();
          input.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, []);
  const go = (id: string) => {
    close();
    const target = document.getElementById(id);
    if (!target) return;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (lenis) {
      lenis.start();
      lenis.scrollTo(target, {
        offset: -96,
        immediate: reduced,
        duration: 1.1,
        easing: (value) => 1 - Math.pow(1 - value, 3),
      });
    } else target.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  };
  return (
    <>
      <button
        ref={trigger}
        className="hero-search"
        onClick={open}
        aria-haspopup="dialog"
        aria-label="Search Reclaim"
      >
        <SearchIcon />
        <span>What would you like to know?</span>
        <kbd>
          <span>ctrl</span>
          <span>/</span>
        </kbd>
        <span className="search-open-icon">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 18V6m-5 5 5-5 5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <dialog
        ref={dialog}
        className="spotlight"
        aria-label="Search Reclaim"
        onCancel={() => previousFocus.current?.focus()}
        onClick={(event) => {
          if (event.target === dialog.current) {
            const rect = dialog.current.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              close();
          }
        }}
      >
        <div className="spotlight-input">
          <SearchIcon />
          <input
            ref={input}
            value={query}
            placeholder="Search Reclaim"
            aria-label="Search page content"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((value) =>
                  Math.min(value + 1, Math.max(0, results.length - 1)),
                );
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((value) => Math.max(value - 1, 0));
              }
              if (event.key === "Enter" && results[active]) {
                event.preventDefault();
                go(results[active].id);
              }
            }}
          />
          <button
            className="escape-key"
            onClick={close}
            aria-label="Close search"
          >
            esc
          </button>
        </div>
        <div className="spotlight-category">ON THIS PAGE</div>
        <div className="search-results" aria-live="polite">
          {results.length ? (
            results.map((entry, index) => (
              <button
                key={entry.id}
                className={index === active ? "selected" : ""}
                onFocus={() => setActive(index)}
                onClick={() => go(entry.id)}
              >
                <span className="result-symbol">⌘</span>
                <span>
                  {entry.title}
                  <small>{entry.detail}</small>
                </span>
                <span className="return-symbol">↵</span>
              </button>
            ))
          ) : (
            <p className="empty-search">
              No matches. Try “pickup”, “photo”, or “reuse”.
            </p>
          )}
        </div>
        <div className="spotlight-footer">
          <span>
            ↑ ↓ to navigate <span>↵ to open</span>
          </span>
          <span>RECLAIM</span>
        </div>
      </dialog>
    </>
  );
}
