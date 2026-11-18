import { describe, expect, it } from "vitest";
import { validateReceiptUpload } from "../../backend/uploadValidation";

describe("validateReceiptUpload", () => {
  it("accepts non-empty image uploads", () => {
    expect(validateReceiptUpload({ type: "image/jpeg", size: 1024 })).toBeNull();
  });

  it("rejects empty images", () => {
    expect(validateReceiptUpload({ type: "image/png", size: 0 })).toBe(
      "File gambar tidak boleh kosong."
    );
  });

  it("rejects non-image uploads", () => {
    expect(validateReceiptUpload({ type: "text/plain", size: 1024 })).toBe(
      "File harus berupa gambar."
    );
  });
});
