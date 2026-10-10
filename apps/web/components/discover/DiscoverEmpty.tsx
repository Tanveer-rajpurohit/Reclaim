import { Empty } from "@/components/materials/Cards";

export default function DiscoverEmpty({
  savedOnly,
  hasMaterials,
  clear,
  hasOwnMaterials,
}: {
  savedOnly: boolean;
  hasMaterials: boolean;
  clear: () => void;
  hasOwnMaterials: boolean;
}) {
  if (hasMaterials)
    return (
      <Empty
        title="No batches match this search."
        text="Try another search or clear your filters to see all available materials."
        label="Clear search and filters"
        onAction={clear}
      />
    );
  if (savedOnly)
    return (
      <Empty
        title="Nothing saved here yet."
        text="Save materials as you browse. Your saved batches will appear here."
        href="/dashboard"
        label="Explore materials"
      />
    );
  if (hasOwnMaterials)
    return (
      <Empty
        title="No other batches available yet."
        text="Your materials are in Your listings. Check back for batches from other sellers."
        href="/dashboard/listings"
        label="View your listings"
      />
    );
  return (
    <Empty
      title="No batches available yet."
      text="Materials appear here when someone offers a batch. Have something left from an event? Give it a next use."
      href="/dashboard/listings/new"
      label="List materials"
    />
  );
}
