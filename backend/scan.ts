import { GoogleGenAI } from "@google/genai";

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export async function processReceiptImage(
  file: File,
  apiKey: string
): Promise<ScannedReceipt> {
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
      "service": 0,
      "discount": 0
    }
    Aturan:
    1. Properti "items" HARUS berupa Array berisi objek menu.
    2. Jika pajak/service/diskon tidak ada, beri nilai 0.
    3. HANYA kembalikan teks JSON murni tanpa penjelasan atau markdown.
    `;

  const candidateModels = [
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
  ];
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const currentModel = candidateModels[(attempt - 1) % candidateModels.length];

    try {
      console.log(`[Percobaan ${attempt}/${maxRetries}] Mengirim ke AI (${currentModel})...`);

      const response = await ai.models.generateContent({
        model: currentModel,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type || "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI tidak mengembalikan format JSON yang sesuai.");
      }

      const parsedData: unknown = JSON.parse(jsonMatch[0]);
      if (!isRecord(parsedData) || !Array.isArray(parsedData.items) || parsedData.items.length === 0) {
        throw new Error("Hasil AI tidak memiliki array 'items' yang valid.");
      }

      const result: ScannedReceipt = {
        items: parsedData.items.map((value) => {
          const item = isRecord(value) ? value : {};
          return {
            name: typeof item.name === "string" && item.name ? item.name : "Item Struk",
            price: typeof item.price === "number" ? item.price : Number(item.price) || 0,
            qty: typeof item.qty === "number" ? item.qty : Number(item.qty) || 1,
          };
        }),
        tax: typeof parsedData.tax === "number" ? parsedData.tax : Number(parsedData.tax) || 0,
        service: typeof parsedData.service === "number" ? parsedData.service : Number(parsedData.service) || 0,
        discount: typeof parsedData.discount === "number" ? parsedData.discount : Number(parsedData.discount) || 0,
      };

      console.log(`[Percobaan ${attempt}] SUKSES memproses struk!`);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Percobaan ${attempt} Gagal]: ${message}`);

      if (attempt < maxRetries) {
        console.log("Menunggu 1.5 detik lalu retry otomatis...");
        await delay(1500);
      }
    }
  }

  throw new ReceiptScanError(
    "Gagal membaca struk setelah beberapa kali percobaan. Silakan coba upload ulang."
  );
}
