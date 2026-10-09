import DealDetail from "../../../../components/board/DealDetail";
export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DealDetail id={id} />;
}
