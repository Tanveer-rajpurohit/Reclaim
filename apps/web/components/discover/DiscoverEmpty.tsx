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
        title="No items match this search."
        text="Try another search or clear your filters to see all available materials."
        label="Clear search and filters"
        onAction={clear}
      />
    );
  if (savedOnly)
    return (
      <Empty
        title="Nothing saved here yet."
        text="Tap Save on an item while browsing. You can find it here later."
        href="/dashboard"
        label="Explore materials"
      />
    );
  if (hasOwnMaterials)
    return (
      <Empty
        title="No items from other sellers yet."
        text="Find your items in Your listings. Check back here for items from other sellers."
        href="/dashboard/listings"
        label="View your listings"
      />
    );
  return (
    <Empty
      title="No items available yet."
      text="Items appear here when someone lists them. Have things you no longer need? Sell them or give them away."
      href="/dashboard/listings/new"
      label="Sell or give away"
    />
  );
}
