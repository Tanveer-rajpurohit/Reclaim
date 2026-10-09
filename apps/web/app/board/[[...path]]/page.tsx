import { redirect } from "next/navigation";
import type { LegacyDashboardRouteProps } from "@/types/marketplace/type";
export default async function LegacyBoard({
  params,
  searchParams,
}: LegacyDashboardRouteProps) {
  const { path = [] } = await params;
  const values = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const suffix = query.toString();
  redirect(
    "/dashboard" +
      (path.length ? "/" + path.map(encodeURIComponent).join("/") : "") +
      (suffix ? "?" + suffix : ""),
  );
}
