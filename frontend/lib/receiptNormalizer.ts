export interface RawReceiptItem {
  name?: string | null;
  price?: number | string | null;
  qty?: number | string | null;
  isSharing?: boolean | null;
}

export interface RawReceiptPayload {
  items?: RawReceiptItem[] | null;
  tax?: number | string | null;
  taxRate?: number | string | null;
  service?: number | string | null;
  discount?: number | string | null;
}

export interface NormalizedItem {
  name: string;
  price: number;
  qty: number;
  isSharing: boolean;
}

export interface NormalizedBillData {
  items: NormalizedItem[];
  taxRate: number;
  taxAmount: number;
  service: number;
  discount: number;
}

function parseOptionalNumber(
  value: number | string | null | undefined
): number {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return NaN;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
}

export function validateScannedReceipt(data: NormalizedBillData): string | null {
  const hasInvalidItem = data.items.some(
    (item) =>
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      !Number.isFinite(item.qty) ||
      item.qty <= 0
  );

  return hasInvalidItem
    ? "Hasil scan memiliki harga atau kuantitas yang tidak valid. Coba scan ulang atau gunakan input manual."
    : null;
}

export function normalizeReceiptData(payload?: RawReceiptPayload | null): NormalizedBillData {
  if (!payload || typeof payload !== "object") {
    return {
      items: [{ name: "", price: 0, qty: 1, isSharing: false }],
      taxRate: 10,
      taxAmount: 0,
      service: 0,
      discount: 0,
    };
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items: NormalizedItem[] = rawItems
    .map((item, idx) => {
      const name = typeof item?.name === "string" && item.name.trim() !== ""
        ? item.name.trim()
        : `Item Struk ${idx + 1}`;
      const rawPrice = Number(item?.price);
      const price = !isNaN(rawPrice) && rawPrice > 0 ? Math.round(rawPrice) : 0;
      const rawQty = Number(item?.qty);
      const qty = !isNaN(rawQty) && rawQty > 0 ? Math.floor(rawQty) : 1;
      const isSharing = Boolean(item?.isSharing);

      return { name, price, qty, isSharing };
    })
    .filter((item) => item.price >= 0);

  const finalItems = items.length > 0 ? items : [{ name: "", price: 0, qty: 1, isSharing: false }];

  const subtotal = finalItems.reduce((acc, it) => acc + it.price * it.qty, 0);

  const rawTax = parseOptionalNumber(payload.tax);
  const rawTaxRate = parseOptionalNumber(payload.taxRate);

  let taxAmount = 0;
  let taxRate = 0;

  if (!isNaN(rawTaxRate) && rawTaxRate >= 0) {
    taxRate = Math.min(100, rawTaxRate);
    taxAmount = (subtotal * taxRate) / 100;
  } else if (!isNaN(rawTax) && rawTax >= 0) {
    taxAmount = rawTax;
    taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0;
  } else {
    taxRate = 10;
    taxAmount = (subtotal * taxRate) / 100;
  }

  const rawService = parseOptionalNumber(payload.service);
  const service = !isNaN(rawService) && rawService > 0 ? Math.round(rawService) : 0;

  const rawDiscount = parseOptionalNumber(payload.discount);
  const discount = !isNaN(rawDiscount) && rawDiscount > 0 ? Math.round(rawDiscount) : 0;

  return {
    items: finalItems,
    taxRate: Number(taxRate.toFixed(2)),
    taxAmount: Math.round(taxAmount),
    service,
    discount,
  };
}
