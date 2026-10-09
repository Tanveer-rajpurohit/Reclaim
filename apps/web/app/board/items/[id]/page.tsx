import ItemDetail from "../../../../components/board/ItemDetail";
export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ItemDetail id={id} />;
}
