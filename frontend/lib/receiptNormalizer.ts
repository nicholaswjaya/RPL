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

  const rawTax = Number(payload.tax);
  const rawTaxRate = Number(payload.taxRate);

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

  const rawService = Number(payload.service);
  const service = !isNaN(rawService) && rawService > 0 ? Math.round(rawService) : 0;

  const rawDiscount = Number(payload.discount);
  const discount = !isNaN(rawDiscount) && rawDiscount > 0 ? Math.round(rawDiscount) : 0;

  return {
    items: finalItems,
    taxRate: Number(taxRate.toFixed(2)),
    taxAmount: Math.round(taxAmount),
    service,
    discount,
  };
}
