import { describe, expect, it } from "vitest";
import {
  MAX_RECEIPT_IMAGE_SIZE_BYTES,
  validateReceiptUpload,
} from "../../backend/uploadValidation";

describe("validateReceiptUpload", () => {
  it("accepts non-empty image uploads", () => {
    expect(validateReceiptUpload({ type: "image/jpeg", size: 1024 })).toBeNull();
  });

  it("rejects empty images", () => {
    expect(validateReceiptUpload({ type: "image/png", size: 0 })).toEqual(
      { message: "File gambar tidak boleh kosong.", status: 400 }
    );
  });

  it("rejects non-image uploads", () => {
    expect(validateReceiptUpload({ type: "text/plain", size: 1024 })).toEqual(
      { message: "File harus berupa gambar.", status: 400 }
    );
  });

  it("accepts images at the size limit and rejects larger files", () => {
    expect(
      validateReceiptUpload({
        type: "image/jpeg",
        size: MAX_RECEIPT_IMAGE_SIZE_BYTES,
      })
    ).toBeNull();
    expect(
      validateReceiptUpload({
        type: "image/jpeg",
        size: MAX_RECEIPT_IMAGE_SIZE_BYTES + 1,
      })
    ).toEqual({
      message: "Ukuran gambar maksimal 4 MB.",
      status: 413,
    });
  });
});
