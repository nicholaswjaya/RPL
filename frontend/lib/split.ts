interface BillItem {
  price: number;
  qty: number;
}

export function calculateBillTotals(
  items: readonly BillItem[],
  taxRate: number,
  service: number,
  discount: number
) {
  const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);
  const taxAmount = (subtotal * taxRate) / 100;

  return {
    subtotal,
    taxAmount,
    grandTotal: subtotal + taxAmount + service - discount,
  };
}