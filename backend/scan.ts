import { GoogleGenAI } from "@google/genai";
import {
  parseReceiptResponse,
  ReceiptScanError,
  ScannedReceipt,
} from "./receiptResponse";

export { ReceiptScanError } from "./receiptResponse";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    let responseText: string;

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
      responseText = response.text || "";
    } catch (error: unknown) {
      console.warn("[ReceiptScan] attempt failed", {
        attempt,
        maxRetries,
        model: currentModel,
      });

      if (attempt < maxRetries) {
        console.log("Menunggu 1.5 detik lalu retry otomatis...");
        await delay(1500);
      }
      continue;
    }

    const result = parseReceiptResponse(responseText);
    console.log(`[Percobaan ${attempt}] SUKSES memproses struk!`);
    return result;
  }

  throw new ReceiptScanError(
    "Gagal membaca struk setelah beberapa kali percobaan. Silakan coba upload ulang."
  );
}
