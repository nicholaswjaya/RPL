export interface BillItem {
  price: number;
  qty: number;
}

export interface BillTotalsResult {
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  multiplier: number;
}

export function sanitizePercentage(value: number): number {
  if (isNaN(value) || value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function sanitizeCurrency(value: number): number {
  if (isNaN(value) || value < 0) return 0;
  return Math.round(value);
}

export function calculateBillTotals(
  items: readonly BillItem[],
  taxRate: number,
  service: number,
  discount: number
): BillTotalsResult {
  const safeTaxRate = sanitizePercentage(taxRate);
  const safeService = sanitizeCurrency(service);
  const safeDiscount = sanitizeCurrency(discount);

  const subtotal = items.reduce((total, item) => {
    const itemPrice = Math.max(0, item.price || 0);
    const itemQty = Math.max(0, item.qty || 0);
    return total + itemPrice * itemQty;
  }, 0);

  const taxAmount = (subtotal * safeTaxRate) / 100;
  const rawGrandTotal = subtotal + taxAmount + safeService - safeDiscount;
  const grandTotal = Math.max(0, Math.round(rawGrandTotal));
  const multiplier = subtotal > 0 ? grandTotal / subtotal : 1;

  return {
    subtotal,
    taxAmount,
    grandTotal,
    multiplier,
  };
}
