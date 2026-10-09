import type { BrandMarkProps } from "@/types/ui/type";
export default function BrandMark({
  size = 24,
  className = "",
}: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
