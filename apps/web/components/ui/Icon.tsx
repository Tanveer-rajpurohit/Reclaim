import type { IconProps } from "@/types/ui/type";
const paths = {
  plus: "M12 5v14M5 12h14",
  user: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4",
  arrow: "M7 17 17 7M7 7h10v10",
  close: "m6 6 12 12M6 18 18 6",
  filters: "M4 6h16M4 12h16M4 18h16M9 3v6m6 0v6m-6 0v6",
  eye: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  "eye-off":
    "m3 3 18 18M10.6 5.1 12 5c7 0 10 7 10 7a19 19 0 0 1-3 4M6.2 6.2A19 19 0 0 0 2 12s3 7 10 7a12 12 0 0 0 5.8-1.8M9.9 9.9a3 3 0 0 0 4.2 4.2",
} as const;
export default function Icon({ name, size = 18, className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
