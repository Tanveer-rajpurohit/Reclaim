import Deals from "../../../components/board/Deals";
export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ side?: string }>;
}) {
  const { side } = await searchParams;
  return <Deals initialSide={side} />;
}
