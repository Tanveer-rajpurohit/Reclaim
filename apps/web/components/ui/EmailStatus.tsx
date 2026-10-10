export default function EmailStatus({ verified }: { verified?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${verified ? "text-blue" : "text-muted"}`}
    >
      {verified && (
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m3 8 3 3 7-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {verified ? "Email verified" : "Email not verified"}
    </span>
  );
}
