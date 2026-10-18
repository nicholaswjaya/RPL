import { describe, expect, it } from "vitest";
import {
  initializeSinglePool,
  restoreItemsToPool,
  validateAllocationPool,
  formatWhatsAppSummary,
} from "../lib/poolValidator";

describe("poolValidator - Aturan Bisnis Pelacakan Sisa Porsi & Validasi Keterbagian", () => {
  it("menginisialisasi pool porsi untuk menu single dan mengabaikan menu sharing", () => {
    const items = [
      { name: "Ayam Bakar", qty: 3, isSharing: false },
      { name: "Pizza Meat", qty: 1, isSharing: true },
      { name: "Es Jeruk", qty: 2, isSharing: false },
    ];

    const pool = initializeSinglePool(items);

    expect(pool[0]).toBe(3); // Ayam Bakar
    expect(pool[1]).toBeUndefined(); // Pizza Sharing tidak dilacak di single pool
    expect(pool[2]).toBe(2); // Es Jeruk
  });

  it("mendeteksi sisa menu personal yang belum teralokasi dan melaporkan namanya", () => {
    const items = [
      { name: "Nasi Goreng", qty: 2, isSharing: false },
      { name: "Es Teh", qty: 2, isSharing: false },
    ];
    // Masih ada sisa 1 Nasi Goreng
    const remainingPool = { 0: 1, 1: 0 };
    const eatersCounts = {};

    const validation = validateAllocationPool(items, remainingPool, eatersCounts);

    expect(validation.isFullyAllocated).toBe(false);
    expect(validation.unassignedSingleCount).toBe(1);
    expect(validation.unassignedItems).toHaveLength(1);
    expect(validation.unassignedItems[0]).toEqual({
      name: "Nasi Goreng",
      remainingQty: 1,
    });
  });

  it("mendeteksi menu sharing yang belum dipilih oleh siapapun (0 eaters)", () => {
    const items = [
      { name: "Ayam Goreng", qty: 1, isSharing: false },
      { name: "Pizza Large", qty: 1, isSharing: true }, // Index 1
    ];
    const remainingPool = { 0: 0 }; // Menu single habis
    const eatersCounts = { 1: 0 };  // Pizza belum ada yang makan

    const validation = validateAllocationPool(items, remainingPool, eatersCounts);

    expect(validation.isFullyAllocated).toBe(false);
    expect(validation.unassignedSharingIndices).toContain(1);
  });

  it("menyatakan keterbagian 100% tervalidasi saat semua porsi habis terbagi", () => {
    const items = [
      { name: "Burger", qty: 2, isSharing: false },
      { name: "Kentang Sharing", qty: 1, isSharing: true },
    ];
    const remainingPool = { 0: 0 }; // Burger sisa 0
    const eatersCounts = { 1: 2 };  // Kentang dimakan 2 orang

    const validation = validateAllocationPool(items, remainingPool, eatersCounts);

    expect(validation.isFullyAllocated).toBe(true);
    expect(validation.unassignedSingleCount).toBe(0);
    expect(validation.unassignedItems).toHaveLength(0);
    expect(validation.unassignedSharingIndices).toHaveLength(0);
  });

  it("mengembalikan kuantitas item ke pool saat anggota dihapus dari sesi", () => {
    const initialPool = { 0: 1, 1: 0 };
    const assignedItems = [
      { itemIndex: 0, qty: 1 },
      { itemIndex: 1, qty: 2 },
    ];

    const restoredPool = restoreItemsToPool(initialPool, assignedItems);

    expect(restoredPool[0]).toBe(2); // 1 + 1
    expect(restoredPool[1]).toBe(2); // 0 + 2
  });

  it("membuat format teks ringkasan WhatsApp yang rapi dan informatif", () => {
    const peopleData = [
      {
        name: "Budi",
        totalWithTax: 45000,
        assignedItems: [{ name: "Nasi Goreng", qty: 1, price: 30000 }],
        sharingItemsNames: [{ name: "Pizza", eaters: 3, cost: 15000 }],
      },
    ];
    const grandTotal = 45000;

    const message = formatWhatsAppSummary(peopleData, grandTotal);

    expect(message).toContain("🧾 *Rincian Pembagian Tagihan (Patungin)*");
    expect(message).toContain("👤 *Budi*: Rp 45.000");
    expect(message).toContain("Nasi Goreng (1x): Rp 30.000");
    expect(message).toContain("🍕 Pizza (Sharing 1/3): Rp 15.000");
    expect(message).toContain("💰 *Grand Total*: Rp 45.000");
  });
});
