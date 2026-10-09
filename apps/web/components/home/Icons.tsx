export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-mark ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
export function CornerIcon({ type }: { type: "page" | "action" | "replay" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      aria-hidden="true"
    >
      {type === "page" ? (
        <>
          <rect
            x="5"
            y="3"
            width="14"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <path
            d="M8 8h8M8 12h8M8 16h5"
            stroke="currentColor"
            strokeWidth="1.25"
          />
        </>
      ) : type === "action" ? (
        <>
          <path
            d="m5 4 13 8-6 2-2 6L5 4Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M3 10a9 9 0 1 1 2.6 8.4M3 5v5h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
