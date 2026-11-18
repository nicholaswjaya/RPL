export interface SharingItemInfo {
  name: string;
  price: number;
  qty: number;
}

export function allocateSharingCosts(
  items: readonly SharingItemInfo[],
  people: readonly { sharingItems: readonly number[] }[]
): Record<number, Record<number, number>> {
  const costsByPerson: Record<number, Record<number, number>> = {};
  people.forEach((_, personIndex) => {
    costsByPerson[personIndex] = {};
  });

  items.forEach((item, itemIndex) => {
    const eaterIndices = people
      .map((person, personIndex) => ({ person, personIndex }))
      .filter(({ person }) => person.sharingItems.includes(itemIndex))
      .map(({ personIndex }) => personIndex);
    if (eaterIndices.length === 0) return;

    const totalCost = Math.round(
      Math.max(0, item.price || 0) * Math.max(0, item.qty || 0)
    );
    const baseCost = Math.floor(totalCost / eaterIndices.length);
    const remainingRupiah = totalCost - baseCost * eaterIndices.length;

    eaterIndices.forEach((personIndex, eaterPosition) => {
      costsByPerson[personIndex][itemIndex] =
        baseCost + (eaterPosition < remainingRupiah ? 1 : 0);
    });
  });

  return costsByPerson;
}

export function calculateSharingCostPerPerson(
  price: number,
  qty: number,
  eatersCount: number
): number {
  if (eatersCount <= 0 || isNaN(eatersCount)) return 0;
  const safePrice = Math.max(0, price || 0);
  const safeQty = Math.max(0, qty || 0);
  const totalItemCost = safePrice * safeQty;
  return totalItemCost / eatersCount;
}

export function countEatersPerItem(
  people: readonly { sharingItems: readonly number[] }[]
): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const person of people) {
    for (const itemIndex of person.sharingItems) {
      counts[itemIndex] = (counts[itemIndex] || 0) + 1;
    }
  }
  return counts;
}

export function calculatePersonSharingSubtotal(
  sharingItemsIndices: readonly number[],
  itemsPool: readonly SharingItemInfo[],
  eatersCounts: Record<number, number>
): number {
  let subtotal = 0;
  for (const itemIndex of sharingItemsIndices) {
    const item = itemsPool[itemIndex];
    if (!item) continue;
    const eaters = eatersCounts[itemIndex] || 0;
    subtotal += calculateSharingCostPerPerson(item.price, item.qty, eaters);
  }
  return subtotal;
}
