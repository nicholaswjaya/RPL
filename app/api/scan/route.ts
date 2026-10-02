import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Helper delay agar server memberikan jeda antar-percobaan
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dikonfigurasi di .env.local" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Tidak ada file gambar yang diunggah" },
        { status: 400 }
      );
    }

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

    const candidateModels = ["gemini-2.5-flash", "gemini-1.5-flash"];
    const MAX_RETRIES = 5; // Coba maksimal 5 kali secara diam-diam
    let validResult = null;

    // LOOP UTAMA: Terus coba sampai dapet output JSON + items yang valid
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      // Berganti model tiap percobaan agar lebih fleksibel
      const currentModel = candidateModels[(attempt - 1) % candidateModels.length];
      
      try {
        console.log(`[Percobaan ${attempt}/${MAX_RETRIES}] Mengirim ke AI (${currentModel})...`);

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

        // Tembak regex untuk mengambil payload JSON murni saja
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("AI tidak mengembalikan format JSON yang sesuai.");
        }

        const parsedData: unknown = JSON.parse(jsonMatch[0]);

        // Validasi struktur data: HARUS punya array items
        if (
          !parsedData ||
          typeof parsedData !== "object" ||
          !Array.isArray((parsedData as { items?: unknown }).items) ||
          (parsedData as { items: unknown[] }).items.length === 0
        ) {
          throw new Error("Hasil AI tidak memiliki array 'items' yang valid.");
        }

        const receipt = parsedData as {
          items: unknown[];
          tax?: unknown;
          service?: unknown;
          discount?: unknown;
        };

        // Kalau sampai sini, artinya DATA VALID & SUKSES!
        validResult = {
          items: receipt.items.map((value) => {
            const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
            return {
              name: typeof item.name === "string" && item.name ? item.name : "Item Struk",
              price: typeof item.price === "number" ? item.price : 0,
              qty: typeof item.qty === "number" ? item.qty : 1,
            };
          }),
          tax: typeof receipt.tax === "number" ? receipt.tax : 0,
          service: typeof receipt.service === "number" ? receipt.service : 0,
          discount: typeof receipt.discount === "number" ? receipt.discount : 0,
        };

        console.log(`[Percobaan ${attempt}] SUKSES memproses struk!`);
        break; // Keluar dari loop percobaan karena sudah sukses

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[Percobaan ${attempt} Gagal]: ${message}`);

        // Jika belum mencapai batas maksimum, tunggu 1.5 detik lalu coba lagi
        if (attempt < MAX_RETRIES) {
          console.log("Menunggu 1.5 detik lalu retry otomatis...");
          await delay(1500);
        }
      }
    }

    // Jika setelah 5x mencoba masih gagal total
    if (!validResult) {
      return NextResponse.json(
        { error: "Gagal membaca struk setelah beberapa kali percobaan. Silakan coba upload ulang." },
        { status: 503 }
      );
    }

    // Kirim hasil valid ke frontend
    return NextResponse.json(validResult);

  } catch (error: unknown) {
    console.error("Critical error backend:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan pada sistem backend." },
      { status: 500 }
    );
  }
}