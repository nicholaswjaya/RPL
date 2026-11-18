export interface ReceiptItem {
  name: string;
  price: number;
  qty: number;
}

export interface ScannedReceipt {
  items: ReceiptItem[];
  tax: number;
  service: number;
  discount: number;
}

export class ReceiptScanError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function parseReceiptResponse(responseText: string): ScannedReceipt {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new ReceiptScanError("AI tidak mengembalikan format JSON yang sesuai.");
  }

  let parsedData: unknown;
  try {
    parsedData = JSON.parse(jsonMatch[0]);
  } catch {
    throw new ReceiptScanError("AI mengembalikan data struk yang tidak valid.");
  }

  if (
    !isRecord(parsedData) ||
    !Array.isArray(parsedData.items) ||
    parsedData.items.length === 0
  ) {
    throw new ReceiptScanError("Hasil AI tidak memiliki array 'items' yang valid.");
  }

  return {
    items: parsedData.items.map((value) => {
      const item = isRecord(value) ? value : {};
      return {
        name: typeof item.name === "string" && item.name ? item.name : "Item Struk",
        price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
        qty: typeof item.qty === "number" ? item.qty : Number(item.qty) || 1,
      };
    }),
    tax: typeof parsedData.tax === "number" ? parsedData.tax : Number(parsedData.tax) || 0,
    service:
      typeof parsedData.service === "number"
        ? parsedData.service
        : Number(parsedData.service) || 0,
    discount:
      typeof parsedData.discount === "number"
        ? parsedData.discount
        : Number(parsedData.discount) || 0,
  };
}
