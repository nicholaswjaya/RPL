import { describe, expect, it } from "vitest";
import {
  calculateBillTotals,
  formatPercentageRate,
  limitPercentageInput,
  parsePercentageInput,
  roundRateUpToTenth,
  sanitizePercentageInput,
} from "../lib/split";

describe("calculateBillTotals", () => {
  it("membulatkan persentase selalu ke atas ke satu angka desimal", () => {
    expect(roundRateUpToTenth(10.23)).toBe(10.3);
    expect(roundRateUpToTenth(10.2)).toBe(10.2);
    expect(roundRateUpToTenth(100.23)).toBe(100.3);
    expect(roundRateUpToTenth(1000)).toBe(999.9);
    expect(roundRateUpToTenth(-1)).toBe(0);
    expect(roundRateUpToTenth(Number.NaN)).toBe(0);
  });

  it("membatasi input persentase ke rentang yang didukung", () => {
    expect(limitPercentageInput(100.5)).toBe(100.5);
    expect(limitPercentageInput(1000)).toBe(999.9);
    expect(limitPercentageInput(-0.5)).toBe(0);
    expect(limitPercentageInput(23.4)).toBe(23.4);
  });

  it("membatasi teks input ke tiga digit dan satu desimal", () => {
    expect(sanitizePercentageInput("100,1")).toBe("100,1");
    expect(sanitizePercentageInput("1234,56")).toBe("123,5");
    expect(sanitizePercentageInput("10.23")).toBe("10,2");
    expect(parsePercentageInput("100,1")).toBe(100.1);
    expect(formatPercentageRate(100.1)).toBe("100,1");
  });

  it("menghitung service charge dan diskon berdasarkan persentase subtotal", () => {
    const totals = calculateBillTotals(
      [
        { price: 10000, qty: 2 },
        { price: 15000, qty: 1 },
      ],
      10,
      10,
      5
    );

    expect(totals).toEqual({
      subtotal: 35000,
      taxAmount: 3500,
      serviceAmount: 3500,
      discountAmount: 1750,
      grandTotal: 40250,
    });
  });

  it("menggunakan persentase yang sudah dibulatkan untuk menghitung nominal", () => {
    const totals = calculateBillTotals([{ price: 100, qty: 1 }], 10.23, 10.23, 10.23);

    expect(totals).toEqual({
      subtotal: 100,
      taxAmount: 10.3,
      serviceAmount: 10,
      discountAmount: 10,
      grandTotal: 110.3,
    });
  });
});