import { calculateBillTotals as calcTotals, BillItem } from "./billCalculation";

export function calculateBillTotals(
  items: readonly BillItem[],
  taxRate: number,
  service: number,
  discount: number
) {
  const { subtotal, taxAmount, grandTotal } = calcTotals(items, taxRate, service, discount);
  return {
    subtotal,
    taxAmount,
    grandTotal,
  };
}

export type { BillItem };