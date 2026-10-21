export interface PoolItem {
  index: number;
  name: string;
  price: number;
  qty: number;
  isSharing: boolean;
}

export interface UnassignedSummary {
  isFullyAllocated: boolean;
  unassignedSingleCount: number;
  unassignedItems: { name: string; remainingQty: number }[];
  unassignedSharingIndices: number[];
}

export function initializeSinglePool(items: readonly { qty: number; isSharing: boolean }[]): Record<number, number> {
  const pool: Record<number, number> = {};
  items.forEach((item, index) => {
    if (!item.isSharing) {
      pool[index] = Math.max(0, item.qty);
    }
  });
  return pool;
}

export function restoreItemsToPool(
  currentPool: Record<number, number>,
  assignedItems: readonly { itemIndex: number; qty: number }[]
): Record<number, number> {
  const updated = { ...currentPool };
  for (const item of assignedItems) {
    updated[item.itemIndex] = (updated[item.itemIndex] || 0) + Math.max(0, item.qty);
  }
  return updated;
}

export function validateAllocationPool(
  items: readonly { name: string; qty: number; isSharing: boolean }[],
  remainingSinglePool: Record<number, number>,
  eatersCounts: Record<number, number>
): UnassignedSummary {
  const unassignedItems: { name: string; remainingQty: number }[] = [];
  const unassignedSharingIndices: number[] = [];
  let unassignedSingleCount = 0;

  items.forEach((item, index) => {
    if (!item.isSharing) {
      const remaining = remainingSinglePool[index] ?? 0;
      if (remaining > 0) {
        unassignedSingleCount += remaining;
        unassignedItems.push({ name: item.name, remainingQty: remaining });
      }
    } else {
      const eaters = eatersCounts[index] || 0;
      if (eaters === 0) {
        unassignedSharingIndices.push(index);
      }
    }
  });

  const isFullyAllocated = unassignedSingleCount === 0 && unassignedSharingIndices.length === 0;

  return {
    isFullyAllocated,
    unassignedSingleCount,
    unassignedItems,
    unassignedSharingIndices,
  };
}

export interface WhatsAppPersonData {
  name: string;
  totalWithTax: number;
  assignedItems: { name: string; qty: number; price: number }[];
  sharingItemsNames: { name: string; eaters: number; cost: number }[];
}

export function formatWhatsAppSummary(
  people: readonly WhatsAppPersonData[],
  grandTotal: number
): string {
  const lines: string[] = [
    "*Rincian Pembagian Tagihan (BagiDeh)*",
    "----------------------------------------",
  ];

  if (people.length === 0) {
    lines.push("Belum ada anggota yang ditambahkan.");
  } else {
    people.forEach((p) => {
      lines.push(`*${p.name}*`);

      p.assignedItems.forEach((item) => {
        lines.push(`   - ${item.name} (${item.qty}x): Rp ${(item.price * item.qty).toLocaleString("id-ID")}`);
      });

      p.sharingItemsNames.forEach((s) => {
        lines.push(`   - ${s.name} (Sharing 1/${s.eaters}): Rp ${Math.round(s.cost).toLocaleString("id-ID")}`);
      });

      lines.push(`   *Total ${p.name}*: Rp ${p.totalWithTax.toLocaleString("id-ID")}`);
      lines.push("");
    });
  }

  lines.push("----------------------------------------");
  lines.push(`*Total Keseluruhan Bill*: Rp ${grandTotal.toLocaleString("id-ID")}`);
  lines.push("*Sudah termasuk pajak & biaya layanan proporsional.*");
  lines.push("Yuk segera bayar patungannya ya!");

  return lines.join("\n");
}
