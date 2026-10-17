import { GoogleGenAI } from "@google/genai";

export interface ReceiptItem {
  name: string;
  price: number;
  qty: number;
}

export interface ScannedReceipt {
  items: ReceiptItem[];
  tax: number;
  serviceRate: number;
  discountRate: number;
}

export class ReceiptScanError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export async function processReceiptImage(
  file: File,
  apiKey: string
): Promise<ScannedReceipt> {
  try {
    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analisis gambar struk ini dan ekstrak datanya ke dalam format JSON murni.
      Format JSON HARUS EXACT seperti ini:
      {
        "items": [
          { "name": "Nama Menu 1", "price": 25000, "qty": 1 }
        ],
        "tax": 0,
        "serviceRate": 0,
        "discountRate": 0
      }
      Aturan:
      1. Properti "items" HARUS berupa Array berisi objek menu.
      2. "tax" adalah nominal rupiah.
      3. "serviceRate" dan "discountRate" adalah persentase dari subtotal menu. Jika struk hanya mencantumkan nominal service atau diskon, hitung persentasenya terhadap subtotal menu.
      4. Jika pajak, service charge, atau diskon tidak ada, beri nilai 0.
      `;

    console.log("[MVP Feature 1] Memproses gambar struk dengan model gemini-3.8-flash...");

    const response = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: [
        { type: "text", text: prompt },
        {
          type: "image",
          mime_type: file.type || "image/jpeg",
          data: base64Image,
        },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
      },
    });

    const responseText = response.output_text || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI tidak mengembalikan format JSON yang sesuai.");
    }

    const parsedData: unknown = JSON.parse(jsonMatch[0]);
    if (!isRecord(parsedData) || !Array.isArray(parsedData.items) || parsedData.items.length === 0) {
      throw new Error("Hasil AI tidak memiliki array 'items' yang valid.");
    }

    const items = parsedData.items.map((value) => {
      const item = isRecord(value) ? value : {};
      return {
        name: typeof item.name === "string" && item.name ? item.name : "Item Struk",
        price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
        qty: typeof item.qty === "number" ? item.qty : Number(item.qty) || 1,
      };
    });
    const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);
    const service = typeof parsedData.service === "number" ? parsedData.service : Number(parsedData.service) || 0;
    const discount = typeof parsedData.discount === "number" ? parsedData.discount : Number(parsedData.discount) || 0;

    const result: ScannedReceipt = {
      items,
      tax: typeof parsedData.tax === "number" ? parsedData.tax : Number(parsedData.tax) || 0,
      serviceRate: typeof parsedData.serviceRate === "number"
        ? parsedData.serviceRate
        : subtotal > 0 ? (service / subtotal) * 100 : 0,
      discountRate: typeof parsedData.discountRate === "number"
        ? parsedData.discountRate
        : subtotal > 0 ? (discount / subtotal) * 100 : 0,
    };

    console.log("[MVP Feature 1] SUKSES memproses struk!");
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[MVP Feature 1 Error]:", message);
    throw new ReceiptScanError(
      `Gagal membaca struk: ${message}`
    );
  }
}