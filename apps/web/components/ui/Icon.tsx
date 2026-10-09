import type { IconProps } from "@/types/ui/type";
const paths = {
  plus: "M12 5v14M5 12h14",
  user: "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4",
  arrow: "M7 17 17 7M7 7h10v10",
  close: "m6 6 12 12M6 18 18 6",
  filters: "M4 6h16M4 12h16M4 18h16M9 3v6m6 0v6m-6 0v6",
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
