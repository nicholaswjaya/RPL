export interface AssignedItem {
  itemIndex: number;
  name: string;
  price: number;
  qty: number;
}

export interface PersonBillInput {
  name: string;
  assignedItems: AssignedItem[];
  sharingItems: number[];
}

export interface CalculatedPersonBill {
  name: string;
  singleSubtotal: number;
  sharingSubtotal: number;
  rawSubtotal: number;
  totalWithTax: number;
}

export function reconcilePersonBillTotals<T extends CalculatedPersonBill>(
  bills: readonly T[],
  multiplier: number,
  grandTotal: number
): T[] {
  const roundedDownTotals = bills.map((bill) =>
    Math.floor(bill.rawSubtotal * multiplier)
  );
  const remainingRupiah =
    Math.round(grandTotal) -
    roundedDownTotals.reduce((sum, total) => sum + total, 0);
  const remainderOrder = bills
    .map((bill, index) => ({
      index,
      fraction: bill.rawSubtotal * multiplier - roundedDownTotals[index],
    }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const extraRupiahRecipients = new Set(
    remainderOrder.slice(0, remainingRupiah).map(({ index }) => index)
  );

  return bills.map((bill, index) => ({
    ...bill,
    totalWithTax:
      roundedDownTotals[index] + (extraRupiahRecipients.has(index) ? 1 : 0),
  }));
}

export function calculateSingleItemsSubtotal(assignedItems: readonly AssignedItem[]): number {
  return assignedItems.reduce((acc, item) => {
    const price = Math.max(0, item.price || 0);
    const qty = Math.max(0, item.qty || 0);
    return acc + price * qty;
  }, 0);
}

export function calculateIndividualBill(
  singleSubtotal: number,
  sharingSubtotal: number,
  multiplier: number
): { rawSubtotal: number; totalWithTax: number } {
  const safeMultiplier = multiplier > 0 ? multiplier : 1;
  const rawSubtotal = Math.max(0, singleSubtotal) + Math.max(0, sharingSubtotal);
  const totalWithTax = Math.round(rawSubtotal * safeMultiplier);

  return {
    rawSubtotal,
    totalWithTax,
  };
}

export function calculateAllPeopleBills(
  people: readonly PersonBillInput[],
  allItems: readonly { price: number; qty: number; isSharing: boolean }[],
  eatersCounts: Record<number, number>,
  multiplier: number
): CalculatedPersonBill[] {
  return people.map((person) => {
    const singleSubtotal = calculateSingleItemsSubtotal(person.assignedItems);

    let sharingSubtotal = 0;
    for (const itemIndex of person.sharingItems) {
      const item = allItems[itemIndex];
      if (!item) continue;
      const eaters = eatersCounts[itemIndex] || 0;
      if (eaters > 0) {
        sharingSubtotal += (item.price * item.qty) / eaters;
      }
    }

    const { rawSubtotal, totalWithTax } = calculateIndividualBill(
      singleSubtotal,
      sharingSubtotal,
      multiplier
    );

    return {
      name: person.name,
      singleSubtotal,
      sharingSubtotal,
      rawSubtotal,
      totalWithTax,
    };
  });
}

export function verifyBillSumBalance(
  calculatedBills: readonly CalculatedPersonBill[],
  grandTotal: number
): { sumOfBills: number; difference: number; isBalanced: boolean } {
  const sumOfBills = calculatedBills.reduce((acc, b) => acc + b.totalWithTax, 0);
  const difference = sumOfBills - grandTotal;
  // Due to Math.round per individual, difference should be within 1-2 Rp per person at most
  const maxAcceptableDiff = Math.max(1, calculatedBills.length);
  const isBalanced = Math.abs(difference) <= maxAcceptableDiff;

  return {
    sumOfBills,
    difference,
    isBalanced,
  };
}
