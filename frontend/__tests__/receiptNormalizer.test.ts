import { describe, expect, it } from "vitest";
import { normalizeReceiptData } from "../lib/receiptNormalizer";

describe("receiptNormalizer - Aturan Bisnis Normalisasi Data Hasil Scan AI Struk", () => {
  it("menormalisasi data struk valid yang diekstrak dari AI Vision", () => {
    const rawPayload = {
      items: [
        { name: "Ayam Penyet", price: 28000, qty: 2 },
        { name: "Es Jeruk", price: 7000, qty: 1 },
      ],
      tax: 6300,
      service: 2000,
      discount: 5000,
    };

    const normalized = normalizeReceiptData(rawPayload);

    expect(normalized.items).toHaveLength(2);
    expect(normalized.items[0]).toEqual({
      name: "Ayam Penyet",
      price: 28000,
      qty: 2,
      isSharing: false,
    });
    expect(normalized.taxAmount).toBe(6300);
    // Subtotal = 56.000 + 7.000 = 63.000, Tax = 6.300 -> TaxRate = 10%
    expect(normalized.taxRate).toBe(10);
    expect(normalized.service).toBe(2000);
    expect(normalized.discount).toBe(5000);
  });

  it("menghitung taxRate secara otomatis jika hanya taxAmount yang diberikan oleh AI", () => {
    const rawPayload = {
      items: [{ name: "Steak Wagyu", price: 200000, qty: 1 }],
      tax: 22000, // 22.000 dari 200.000 = 11%
    };

    const normalized = normalizeReceiptData(rawPayload);

    expect(normalized.taxRate).toBe(11);
    expect(normalized.taxAmount).toBe(22000);
  });

  it("menghitung taxAmount secara otomatis jika AI hanya menyediakan taxRate persentase", () => {
    const rawPayload = {
      items: [{ name: "Kopi Latte", price: 40000, qty: 2 }], // 80.000
      taxRate: 10,
    };

    const normalized = normalizeReceiptData(rawPayload);

    expect(normalized.taxRate).toBe(10);
    expect(normalized.taxAmount).toBe(8000);
  });

  it("memberikan fallback nama default jika item tidak memiliki nama dari struk", () => {
    const rawPayload = {
      items: [
        { name: "", price: 15000, qty: 1 },
        { name: "   ", price: 20000, qty: 1 },
      ],
    };

    const normalized = normalizeReceiptData(rawPayload);

    expect(normalized.items[0].name).toBe("Item Struk 1");
    expect(normalized.items[1].name).toBe("Item Struk 2");
  });

  it("melakukan sanitasi harga dan qty dari format string atau bilangan tak valid", () => {
    const rawPayload = {
      items: [
        { name: "Sate Ayam", price: "35000" as unknown as number, qty: "2" as unknown as number },
        { name: "Nasi Putih", price: -5000, qty: 0 },
      ],
    };

    const normalized = normalizeReceiptData(rawPayload);

    expect(normalized.items[0].price).toBe(35000);
    expect(normalized.items[0].qty).toBe(2);
    // Harga negatif di-fallback ke 0, qty 0 di-fallback ke minimum 1
    expect(normalized.items[1].price).toBe(0);
    expect(normalized.items[1].qty).toBe(1);
  });

  it("mengisi nilai default (0) jika pajak, service, atau diskon tidak terdeteksi", () => {
    const rawPayload = {
      items: [{ name: "Bakso", price: 20000, qty: 1 }],
    };

    const normalized = normalizeReceiptData(rawPayload);

    expect(normalized.service).toBe(0);
    expect(normalized.discount).toBe(0);
    expect(normalized.taxRate).toBe(10); // default tax rate fallback
    expect(normalized.taxAmount).toBe(2000);
  });

  it("menangani payload kosong / null / undefined tanpa error sistem", () => {
    const normalizedNull = normalizeReceiptData(null);
    expect(normalizedNull.items).toHaveLength(1);
    expect(normalizedNull.items[0].name).toBe("");
    expect(normalizedNull.taxRate).toBe(10);
  });
});
