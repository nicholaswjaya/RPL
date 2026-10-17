import { describe, expect, it } from "vitest";
import { calculateBillTotals } from "../lib/split";

describe("calculateBillTotals", () => {
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
});