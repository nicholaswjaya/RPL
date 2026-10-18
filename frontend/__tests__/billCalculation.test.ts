import { describe, expect, it } from "vitest";
import {
  calculateBillTotals,
  sanitizeCurrency,
  sanitizePercentage,
} from "../lib/billCalculation";

describe("billCalculation - Aturan Bisnis Kalkulasi Tagihan & Pajak", () => {
  it("menghitung subtotal secara akurat dari daftar item dan kuantitas", () => {
    const items = [
      { price: 25000, qty: 2 }, // 50.000
      { price: 15000, qty: 3 }, // 45.000
      { price: 5000, qty: 1 },  // 5.000
    ];
    const result = calculateBillTotals(items, 0, 0, 0);

    expect(result.subtotal).toBe(100000);
    expect(result.taxAmount).toBe(0);
    expect(result.grandTotal).toBe(100000);
    expect(result.multiplier).toBe(1);
  });

  it("menghitung nominal pajak (taxAmount) berdasarkan persentase taxRate", () => {
    const items = [{ price: 50000, qty: 2 }]; // subtotal 100.000
    const result10 = calculateBillTotals(items, 10, 0, 0);
    expect(result10.taxAmount).toBe(10000);
    expect(result10.grandTotal).toBe(110000);

    const result11 = calculateBillTotals(items, 11, 0, 0); // PPN 11%
    expect(result11.taxAmount).toBe(11000);
    expect(result11.grandTotal).toBe(111000);
  });

  it("mengalkulasi total akhir dengan biaya layanan (service) dan potongan diskon", () => {
    const items = [{ price: 100000, qty: 1 }]; // subtotal 100.000
    // Pajak 10% (10.000), service 5.000, diskon 15.000
    const result = calculateBillTotals(items, 10, 5000, 15000);

    expect(result.subtotal).toBe(100000);
    expect(result.taxAmount).toBe(10000);
    expect(result.grandTotal).toBe(100000); // 100k + 10k + 5k - 15k = 100k
    expect(result.multiplier).toBe(1);
  });

  it("menghitung effective multiplier proporsional (GrandTotal / Subtotal)", () => {
    const items = [{ price: 200000, qty: 1 }]; // subtotal 200.000
    // Pajak 10% (20.000), service 10.000 -> Grand Total = 230.000
    const result = calculateBillTotals(items, 10, 10000, 0);

    expect(result.grandTotal).toBe(230000);
    expect(result.multiplier).toBeCloseTo(1.15, 4); // 230.000 / 200.000 = 1.15
  });

  it("mencegah grand total bernilai negatif saat diskon melebihi tagihan", () => {
    const items = [{ price: 20000, qty: 1 }];
    const result = calculateBillTotals(items, 10, 0, 50000); // Diskon 50k > tagihan 22k

    expect(result.grandTotal).toBe(0);
    expect(result.multiplier).toBe(0);
  });

  it("membersihkan dan membatasi input persentase dan nominal uang", () => {
    expect(sanitizePercentage(-5)).toBe(0);
    expect(sanitizePercentage(150)).toBe(100);
    expect(sanitizePercentage(10)).toBe(10);
    expect(sanitizePercentage(NaN)).toBe(0);

    expect(sanitizeCurrency(-1000)).toBe(0);
    expect(sanitizeCurrency(1500.8)).toBe(1501);
    expect(sanitizeCurrency(NaN)).toBe(0);
  });

  it("menangani keranjang kosong tanpa menyebabkan pembagian dengan nol (division by zero)", () => {
    const result = calculateBillTotals([], 10, 0, 0);

    expect(result.subtotal).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.grandTotal).toBe(0);
    expect(result.multiplier).toBe(1);
  });
});
