import type { State } from "../types/marketplace/type";
import type { CompletedHandover } from "../types/people/type";
export function participantHistory(
  state: State,
  personId: string,
): CompletedHandover[] {
  return state.deals
    .flatMap((deal) => {
      if (deal.status !== "Done") return [];
      const item = state.items.find((item) => item.id === deal.itemId);
      const event = state.events.find((event) => event.id === item?.eventId);
      if (
        !item ||
        !event ||
        (deal.buyerId !== personId && event.ownerId !== personId)
      )
        return [];
      return [
        {
          deal,
          item,
          event,
          role:
            event.ownerId === personId
              ? ("offered" as const)
              : ("collected" as const),
        },
      ];
    })
    .sort((a, b) => b.deal.updatedAt - a.deal.updatedAt);
}
export function activeListingsFor(state: State, personId: string) {
  return state.items.filter(
    (item) =>
      !["Done", "Withdrawn"].includes(item.state) &&
      state.events.some(
        (event) => event.id === item.eventId && event.ownerId === personId,
      ),
  );
}
