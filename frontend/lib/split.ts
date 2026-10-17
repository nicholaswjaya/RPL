interface BillItem {
  price: number;
  qty: number;
}

export function calculateBillTotals(
  items: readonly BillItem[],
  taxRate: number,
  serviceRate: number,
  discountRate: number
) {
  const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const serviceAmount = Math.round((subtotal * serviceRate) / 100);
  const discountAmount = Math.round((subtotal * discountRate) / 100);

  return {
    subtotal,
    taxAmount,
    serviceAmount,
    discountAmount,
    grandTotal: subtotal + taxAmount + serviceAmount - discountAmount,
  };
}