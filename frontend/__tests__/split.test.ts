import { describe, expect, it } from "vitest";
import { calculateBillTotals } from "../lib/split";

describe("calculateBillTotals", () => {
  it("menghitung subtotal, pajak, service, diskon, dan total akhir", () => {
    const totals = calculateBillTotals(
      [
        { price: 10000, qty: 2 },
        { price: 15000, qty: 1 },
      ],
      10,
      2500,
      1000
    );

    expect(totals).toEqual({
      subtotal: 35000,
      taxAmount: 3500,
      grandTotal: 40000,
    });
  });
});