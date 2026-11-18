export const MAX_RECEIPT_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

export interface ReceiptUploadValidationError {
  message: string;
  status: 400 | 413;
}

export function validateReceiptUpload(
  file: Pick<File, "type" | "size">
): ReceiptUploadValidationError | null {
  if (file.size === 0) {
    return { message: "File gambar tidak boleh kosong.", status: 400 };
  }

  if (!file.type.toLowerCase().startsWith("image/")) {
    return { message: "File harus berupa gambar.", status: 400 };
  }

  if (file.size > MAX_RECEIPT_IMAGE_SIZE_BYTES) {
    return {
      message: "Ukuran gambar maksimal 4 MB.",
      status: 413,
    };
  }

  return null;
}
