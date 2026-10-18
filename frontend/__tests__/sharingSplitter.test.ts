import { describe, expect, it } from "vitest";
import {
  calculateSharingCostPerPerson,
  countEatersPerItem,
  calculatePersonSharingSubtotal,
} from "../lib/sharingSplitter";

describe("sharingSplitter - Aturan Bisnis Pembagian Menu Sharing (Makanan Tengah)", () => {
  it("membagi biaya menu sharing secara merata berdasarkan jumlah orang yang makan", () => {
    // Pizza Rp 200.000 (1x) dimakan 4 orang -> Rp 50.000 / orang
    const costPerPerson = calculateSharingCostPerPerson(200000, 1, 4);
    expect(costPerPerson).toBe(50000);
  });

  it("menghitung pembagian porsi jamak (qty > 1) dengan akurat", () => {
    // Dimsum Rp 30.000 x 2 porsi = Rp 60.000 dimakan 3 orang -> Rp 20.000 / orang
    const costPerPerson = calculateSharingCostPerPerson(30000, 2, 3);
    expect(costPerPerson).toBe(20000);
  });

  it("menangani kasus 0 orang yang makan tanpa menyebabkan Infinity atau NaN", () => {
    const costPerPerson = calculateSharingCostPerPerson(150000, 1, 0);
    expect(costPerPerson).toBe(0);
    expect(Number.isFinite(costPerPerson)).toBe(true);
  });

  it("menghitung jumlah eater aktif untuk setiap menu sharing dari daftar partisipan", () => {
    const people = [
      { sharingItems: [0, 1] }, // Orang 1 makan menu index 0 & 1
      { sharingItems: [0] },    // Orang 2 makan menu index 0
      { sharingItems: [1] },    // Orang 3 makan menu index 1
      { sharingItems: [] },     // Orang 4 tidak ikut menu sharing
    ];

    const eaters = countEatersPerItem(people);

    expect(eaters[0]).toBe(2); // Menu 0 dimakan 2 orang
    expect(eaters[1]).toBe(2); // Menu 1 dimakan 2 orang
    expect(eaters[2]).toBeUndefined();
  });

  it("mengalkulasi akumulasi subtotal sharing seorang anggota yang ikut lebih dari 1 menu", () => {
    const itemsPool = [
      { name: "Pizza Meat Lovers", price: 120000, qty: 1 }, // index 0 (dimakan 3 orang -> 40k)
      { name: "Nachos Grande", price: 60000, qty: 1 },      // index 1 (dimakan 2 orang -> 30k)
      { name: "French Fries", price: 25000, qty: 1 },       // index 2 (tidak dipilih orang ini)
    ];

    const eatersCounts = {
      0: 3,
      1: 2,
      2: 1,
    };

    // Budi ikut makan menu 0 dan menu 1
    const budiSharingSubtotal = calculatePersonSharingSubtotal([0, 1], itemsPool, eatersCounts);

    // 40.000 + 30.000 = 70.000
    expect(budiSharingSubtotal).toBe(70000);
  });

  it("menangani pembagian desimal ganjil (seperti Rp 100.000 dibagi 3 orang)", () => {
    const cost = calculateSharingCostPerPerson(100000, 1, 3);
    expect(cost).toBeCloseTo(33333.33, 2);
  });
});
