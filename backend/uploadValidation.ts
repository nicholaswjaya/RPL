export function validateReceiptUpload(
  file: Pick<File, "type" | "size">
): string | null {
  if (file.size === 0) {
    return "File gambar tidak boleh kosong.";
  }

  if (!file.type.toLowerCase().startsWith("image/")) {
    return "File harus berupa gambar.";
  }

  return null;
}
