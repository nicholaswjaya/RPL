interface BillItem {
  price: number;
  qty: number;
}

export function roundRateUpToTenth(rate: number) {
  if (!Number.isFinite(rate)) return 0;
  const boundedRate = Math.min(Math.max(rate, 0), 100);
  if (boundedRate === 0) return 0;
  return Math.ceil(boundedRate * 10 - 1e-10) / 10;
}

export function limitPercentageInput(rate: number) {
  if (!Number.isFinite(rate)) return 0;
  return Math.min(Math.max(rate, 0), 100);
}

export function sanitizePercentageInput(value: string) {
  const normalized = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const separatorIndex = normalized.indexOf(",");

  if (separatorIndex < 0) {
    const integerPart = normalized.slice(0, 3);
    return Number(integerPart) > 100 ? "100" : integerPart;
  }

  const integerPart = normalized.slice(0, separatorIndex).slice(0, 3);
  const decimalPart = normalized.slice(separatorIndex + 1).replace(/,/g, "").slice(0, 1);
  const sanitized = `${integerPart},${decimalPart}`;
  return Number(sanitized.replace(",", ".")) > 100 ? "100" : sanitized;
}

export function parsePercentageInput(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? limitPercentageInput(parsed) : 0;
}

export function formatPercentageRate(rate: number) {
  return roundRateUpToTenth(rate).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function calculateBillTotals(
  items: readonly BillItem[],
  taxRate: number,
  serviceRate: number,
  discountRate: number
) {
  const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);
  const roundedTaxRate = roundRateUpToTenth(taxRate);
  const roundedServiceRate = roundRateUpToTenth(serviceRate);
  const roundedDiscountRate = roundRateUpToTenth(discountRate);
  const taxAmount = (subtotal * roundedTaxRate) / 100;
  const serviceAmount = Math.round((subtotal * roundedServiceRate) / 100);
  const discountAmount = Math.round((subtotal * roundedDiscountRate) / 100);

  return {
    subtotal,
    taxAmount,
    serviceAmount,
    discountAmount,
    grandTotal: subtotal + taxAmount + serviceAmount - discountAmount,
  };
}