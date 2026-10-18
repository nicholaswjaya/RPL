import { describe, expect, it } from "vitest";
import {
  calculateSingleItemsSubtotal,
  calculateIndividualBill,
  calculateAllPeopleBills,
  verifyBillSumBalance,
} from "../lib/personBilling";

describe("personBilling - Aturan Bisnis Rincian Tagihan Bersih Per Individu", () => {
  it("menghitung subtotal menu personal (single) seorang anggota", () => {
    const assignedItems = [
      { itemIndex: 0, name: "Nasi Goreng Spesial", price: 35000, qty: 1 },
      { itemIndex: 1, name: "Es Teh Manis", price: 8000, qty: 2 },
    ];

    const subtotal = calculateSingleItemsSubtotal(assignedItems);
    expect(subtotal).toBe(51000); // 35.000 + 16.000
  });

  it("menerapkan proporsi multiplier pajak & biaya layanan secara adil ke tagihan individu", () => {
    const singleSubtotal = 50000;
    const sharingSubtotal = 25000;
    // Multiplier 1.10 (pajak 10%)
    const multiplier = 1.1;

    const { rawSubtotal, totalWithTax } = calculateIndividualBill(
      singleSubtotal,
      sharingSubtotal,
      multiplier
    );

    expect(rawSubtotal).toBe(75000);
    // 75.000 * 1.10 = 82.500
    expect(totalWithTax).toBe(82500);
  });

  it("membulatkan tagihan akhir individu ke nominal rupiah bulat terdekat", () => {
    // 33.333,33 * 1.10 = 36.666,663 -> dibulatkan ke 36.667
    const { totalWithTax } = calculateIndividualBill(0, 33333.33, 1.1);
    expect(totalWithTax).toBe(36667);
  });

  it("mengalkulasi rincian lengkap untuk kelompok anggota (multi-person)", () => {
    const allItems = [
      { price: 30000, qty: 1, isSharing: false }, // 0: Nasi Goreng
      { price: 10000, qty: 2, isSharing: false }, // 1: Es Teh
      { price: 90000, qty: 1, isSharing: true },  // 2: Pizza Sharing
    ];

    const eatersCounts = { 2: 2 }; // Pizza dimakan 2 orang (45k per orang)
    const multiplier = 1.1; // Pajak 10%

    const people = [
      {
        name: "Budi",
        assignedItems: [{ itemIndex: 0, name: "Nasi Goreng", price: 30000, qty: 1 }],
        sharingItems: [2], // Budi ikut pizza
      },
      {
        name: "Ani",
        assignedItems: [{ itemIndex: 1, name: "Es Teh", price: 10000, qty: 2 }],
        sharingItems: [2], // Ani ikut pizza
      },
    ];

    const results = calculateAllPeopleBills(people, allItems, eatersCounts, multiplier);

    expect(results).toHaveLength(2);

    // Budi: 30k + 45k = 75k -> 75k * 1.1 = 82.500
    expect(results[0].name).toBe("Budi");
    expect(results[0].rawSubtotal).toBe(75000);
    expect(results[0].totalWithTax).toBe(82500);

    // Ani: 20k + 45k = 65k -> 65k * 1.1 = 71.500
    expect(results[1].name).toBe("Ani");
    expect(results[1].rawSubtotal).toBe(65000);
    expect(results[1].totalWithTax).toBe(71500);
  });

  it("memverifikasi keseimbangan total patungan (sum of bills) terhadap grand total struk", () => {
    const calculatedBills = [
      { name: "Budi", singleSubtotal: 30000, sharingSubtotal: 45000, rawSubtotal: 75000, totalWithTax: 82500 },
      { name: "Ani", singleSubtotal: 20000, sharingSubtotal: 45000, rawSubtotal: 65000, totalWithTax: 71500 },
    ];
    const grandTotal = 154000; // 82.500 + 71.500 = 154.000

    const balance = verifyBillSumBalance(calculatedBills, grandTotal);

    expect(balance.sumOfBills).toBe(154000);
    expect(balance.difference).toBe(0);
    expect(balance.isBalanced).toBe(true);
  });

  it("menangani anggota yang hanya makan menu sharing tanpa menu personal", () => {
    const { rawSubtotal, totalWithTax } = calculateIndividualBill(0, 50000, 1.1);
    expect(rawSubtotal).toBe(50000);
    expect(totalWithTax).toBe(55000);
  });
});
