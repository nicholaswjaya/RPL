import { NextResponse } from "next/server";
import { processReceiptImage, ReceiptScanError } from "../../../../backend/scan";
import { validateReceiptUpload } from "../../../../backend/uploadValidation";

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
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Tidak ada file gambar yang diunggah" },
        { status: 400 }
      );
    }

    const uploadError = validateReceiptUpload(file);
    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: uploadError.status }
      );
    }

    return NextResponse.json(await processReceiptImage(file, apiKey));
  } catch (error: unknown) {
    const status = error instanceof ReceiptScanError ? 503 : 500;
    console.error("[API /api/scan] request failed", {
      status,
      code: status === 503 ? "RECEIPT_SCAN_FAILED" : "INTERNAL_ERROR",
    });
    return NextResponse.json(
      {
        error: error instanceof ReceiptScanError
          ? error.message
          : "Terjadi kesalahan pada sistem backend.",
      },
      { status }
    );
  }
}