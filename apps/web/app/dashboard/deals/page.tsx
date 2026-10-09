import Deals from "@/components/handovers/Deals";
export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>;
}) {
  const { side } = await searchParams;
  return <Deals key={side} initialSide={side} />;
}
