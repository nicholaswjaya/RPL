"use client";

import React, { useState } from "react";
import { BillData } from "./ManualInputForm";
import { countEatersPerItem, calculatePersonSharingSubtotal } from "../lib/sharingSplitter";
import { calculateSingleItemsSubtotal, calculateIndividualBill, verifyBillSumBalance } from "../lib/personBilling";
import {
  initializeSinglePool,
  restoreItemsToPool,
  validateAllocationPool,
  formatWhatsAppSummary,
  WhatsAppPersonData,
} from "../lib/poolValidator";

interface PersonAssignment {
  name: string;
  assignedItems: {
    itemIndex: number;
    name: string;
    price: number;
    qty: number;
  }[];
  sharingItems: number[];
}

interface Props {
  billData: BillData;
  onReset: () => void;
}

export default function SplitBillSection({ billData, onReset }: Props) {
  // Filter menu Single dan Sharing
  const singleItemsPool = billData.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.isSharing);

  const sharingItemsPool = billData.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.isSharing);

  // Pool pelacakan sisa kuantitas menu single
  const [remainingSingleItems, setRemainingSingleItems] = useState<Record<number, number>>(
    () => initializeSinglePool(billData.items)
  );

  const [people, setPeople] = useState<PersonAssignment[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentSingleCart, setCurrentSingleCart] = useState<Record<number, number>>({});
  const [currentSharingCart, setCurrentSharingCart] = useState<Record<number, boolean>>({});
  const [copiedToast, setCopiedToast] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Hitung multiplier Pajak/Service/Diskon
  const rawSubtotal = billData.items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const taxAmount = typeof billData.taxAmount === "number"
    ? billData.taxAmount
    : (rawSubtotal * (billData.taxRate || 0)) / 100;
  const netTotal = Math.max(0, rawSubtotal + taxAmount + billData.service - billData.discount);
  const multiplier = rawSubtotal > 0 ? netTotal / rawSubtotal : 1;

  // Peta jumlah eater menu sharing
  const eatersCounts = countEatersPerItem(people);

  // Validasi sisa alokasi item
  const poolValidation = validateAllocationPool(billData.items, remainingSingleItems, eatersCounts);

  // Handler Menu Single (+ / - Qty)
  const handleSingleCart = (itemIndex: number, delta: number) => {
    const currentInCart = currentSingleCart[itemIndex] || 0;
    const remainingQty = remainingSingleItems[itemIndex] ?? 0;
    if (delta > 0 && remainingQty <= 0) return;
    if (delta < 0 && currentInCart <= 0) return;

    const newCartQty = currentInCart + delta;
    const updatedCart = { ...currentSingleCart };
    if (newCartQty <= 0) delete updatedCart[itemIndex];
    else updatedCart[itemIndex] = newCartQty;

    setCurrentSingleCart(updatedCart);
    setRemainingSingleItems((prev) => ({
      ...prev,
      [itemIndex]: Math.max(0, (prev[itemIndex] ?? 0) - delta),
    }));
    setInputError(null);
  };

  // Handler Checkbox Menu Sharing
  const handleToggleSharing = (itemIndex: number) => {
    setCurrentSharingCart((prev) => ({
      ...prev,
      [itemIndex]: !prev[itemIndex],
    }));
    setInputError(null);
  };

  // Simpan Anggota
  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentName.trim()) {
      setInputError("Masukkan nama orang terlebih dahulu!");
      return;
    }

    const assignedSingle = Object.entries(currentSingleCart).map(([itemIndexStr, qty]) => {
      const index = Number(itemIndexStr);
      const originalItem = billData.items[index];
      return {
        itemIndex: index,
        name: originalItem ? originalItem.name : `Item #${index + 1}`,
        price: originalItem ? originalItem.price : 0,
        qty,
      };
    });

    const assignedSharing = Object.keys(currentSharingCart)
      .map(Number)
      .filter((itemIndex) => currentSharingCart[itemIndex]);

    if (assignedSingle.length === 0 && assignedSharing.length === 0) {
      setInputError("Pilih minimal 1 menu (Single atau Sharing) untuk orang ini!");
      return;
    }

    setPeople([
      ...people,
      {
        name: currentName.trim(),
        assignedItems: assignedSingle,
        sharingItems: assignedSharing,
      },
    ]);

    // Reset Form Input User
    setCurrentName("");
    setCurrentSingleCart({});
    setCurrentSharingCart({});
    setInputError(null);
  };

  // Hapus Anggota
  const handleRemovePerson = (personIndex: number) => {
    const person = people[personIndex];
    if (!person) return;

    setRemainingSingleItems((prev) => restoreItemsToPool(prev, person.assignedItems));
    setPeople(people.filter((_, idx) => idx !== personIndex));
  };

  // Hitung rincian untuk tiap orang
  const calculatedPeople = people.map((person) => {
    const singleSubtotal = calculateSingleItemsSubtotal(person.assignedItems);
    const sharingSubtotal = calculatePersonSharingSubtotal(
      person.sharingItems,
      billData.items,
      eatersCounts
    );
    const { rawSubtotal: personRawSubtotal, totalWithTax } = calculateIndividualBill(
      singleSubtotal,
      sharingSubtotal,
      multiplier
    );

    return {
      person,
      singleSubtotal,
      sharingSubtotal,
      rawSubtotal: personRawSubtotal,
      totalWithTax,
    };
  });

  const balanceCheck = verifyBillSumBalance(
    calculatedPeople.map((cp) => ({
      name: cp.person.name,
      singleSubtotal: cp.singleSubtotal,
      sharingSubtotal: cp.sharingSubtotal,
      rawSubtotal: cp.rawSubtotal,
      totalWithTax: cp.totalWithTax,
    })),
    netTotal
  );

  // Salin Rincian ke WhatsApp
  const handleCopyWhatsApp = async () => {
    const whatsAppData: WhatsAppPersonData[] = calculatedPeople.map((cp) => ({
      name: cp.person.name,
      totalWithTax: cp.totalWithTax,
      assignedItems: cp.person.assignedItems.map((ai) => ({
        name: ai.name,
        qty: ai.qty,
        price: ai.price,
      })),
      sharingItemsNames: cp.person.sharingItems.map((idx) => {
        const item = billData.items[idx];
        const eaters = eatersCounts[idx] || 1;
        const cost = item ? (item.price * item.qty) / eaters : 0;
        return {
          name: item ? item.name : `Menu #${idx + 1}`,
          eaters,
          cost,
        };
      }),
    }));

    const message = formatWhatsAppSummary(whatsAppData, netTotal);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch {
      alert("Gagal menyalin teks ke clipboard. Silakan salin manual.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status Alert Badge Keterbagian Item */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between transition ${
          poolValidation.isFullyAllocated
            ? "bg-green-50 border-green-300 text-green-900"
            : "bg-amber-50 border-amber-300 text-amber-900"
        }`}
      >
        <div className="text-sm">
          {poolValidation.isFullyAllocated ? (
            <div>
              <div>
                <p className="font-bold">Semua menu struk sudah habis terbagi rata!</p>
                <p className="text-xs text-green-700">
                  Seluruh item personal dan sharing telah dialokasikan ke anggota.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div>
                <p className="font-bold">Perhatian: Masih ada menu yang belum selesai dibagi!</p>
                {poolValidation.unassignedItems.length > 0 && (
                  <p className="text-xs text-amber-800 mt-0.5">
                    Sisa porsi:{" "}
                    {poolValidation.unassignedItems
                      .map((it) => `${it.name} (${it.remainingQty}x)`)
                      .join(", ")}
                  </p>
                )}
                {poolValidation.unassignedSharingIndices.length > 0 && (
                  <p className="text-xs text-amber-800 mt-0.5">
                    Menu sharing belum ada yang makan:{" "}
                    {poolValidation.unassignedSharingIndices
                      .map((idx) => billData.items[idx]?.name || `Item #${idx + 1}`)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            poolValidation.isFullyAllocated
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-amber-100 text-amber-800 border-amber-300"
          }`}
        >
          {poolValidation.isFullyAllocated ? "Selesai (0 Sisa)" : "Belum Selesai"}
        </span>
      </div>

      {/* Form Tambah Anggota */}
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Pembagian Bill</h2>
            <p className="text-xs text-gray-500">Pilih menu untuk tiap teman yang ikut patungan</p>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            ← Edit Struk
          </button>
        </div>

        {inputError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex justify-between items-center">
            <span>{inputError}</span>
            <button
              onClick={() => setInputError(null)}
              className="font-bold text-red-500 hover:text-red-700 ml-2"
            >
              Tutup
            </button>
          </div>
        )}

        <form onSubmit={handleAddPerson} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nama Anggota / Teman
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi, Ani, Dedi..."
              value={currentName}
              onChange={(e) => {
                setCurrentName(e.target.value);
                setInputError(null);
              }}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Menu Single (Personal) */}
          {singleItemsPool.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-700">
                  Pilih Menu Personal (Single):
                </label>
                <span className="text-[11px] text-gray-500">Gunakan (+) / (-) untuk alokasi porsi</span>
              </div>
              <div className="space-y-2">
                {singleItemsPool.map(({ item, index }) => {
                  const inCart = currentSingleCart[index] || 0;
                  const remainingQty = remainingSingleItems[index] ?? 0;
                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border text-sm"
                    >
                      <div>
                        <span className="font-semibold text-gray-800">{item.name}</span>
                        <span className="text-xs text-gray-500 block">
                          Rp {item.price.toLocaleString("id-ID")} | Sisa Pool:{" "}
                          <strong className={remainingQty > 0 ? "text-blue-600" : "text-gray-400"}>
                            {remainingQty} porsi
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSingleCart(index, -1)}
                          disabled={inCart <= 0}
                          className="w-8 h-8 bg-red-100 text-red-600 font-bold rounded-lg disabled:opacity-30 hover:bg-red-200 transition"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-gray-800">{inCart}</span>
                        <button
                          type="button"
                          onClick={() => handleSingleCart(index, 1)}
                          disabled={remainingQty <= 0}
                          className="w-8 h-8 bg-green-100 text-green-700 font-bold rounded-lg disabled:opacity-30 hover:bg-green-200 transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Menu Sharing */}
          {sharingItemsPool.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-blue-700">
                  Centang Jika Ikut Makan Menu Sharing:
                </label>
                <span className="text-[11px] text-blue-600">Biaya otomatis dibagi rata</span>
              </div>
              <div className="space-y-2">
                {sharingItemsPool.map(({ item, index }) => {
                  const isChecked = Boolean(currentSharingCart[index]);
                  const totalSharingPrice = item.price * item.qty;
                  const currentEaters = eatersCounts[index] || 0;

                  return (
                    <label
                      key={index}
                      className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition text-sm ${
                        isChecked
                          ? "bg-blue-50 border-blue-400 font-semibold"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSharing(index)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-gray-800">{item.name}</span>
                          <span className="text-xs text-gray-500 block">
                            Total: Rp {totalSharingPrice.toLocaleString("id-ID")} ({item.qty}x)
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-full border border-blue-200">
                        {currentEaters} orang ikut
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-blue-700 transition text-sm"
          >
            + Simpan Pesanan Anggota
          </button>
        </form>
      </div>

      {/* Rincian Tagihan Per Orang */}
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Rincian Pembagian Tagihan</h3>
            <p className="text-xs text-gray-500">
              Total bill: Rp {netTotal.toLocaleString("id-ID")} • Multiplier pajak: {multiplier.toFixed(4)}x
            </p>
          </div>
          {people.length > 0 && (
            <button
              onClick={handleCopyWhatsApp}
              className="px-3 py-1.5 bg-green-600 text-white font-semibold text-xs rounded-lg hover:bg-green-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <span>{copiedToast ? "Tersalin!" : "Salin ke WhatsApp"}</span>
            </button>
          )}
        </div>

        {copiedToast && (
          <div className="p-2.5 bg-green-100 border border-green-300 rounded-lg text-xs text-green-800 text-center font-medium">
            Format teks WhatsApp berhasil disalin ke clipboard! Siap di-paste ke grup chat.
          </div>
        )}

        {people.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Belum ada anggota yang ditambahkan. Masukkan nama dan pilih menu di atas!
          </p>
        ) : (
          <div className="space-y-4">
            {calculatedPeople.map((cp, idx) => (
              <div
                key={idx}
                className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2 transition hover:shadow-sm"
              >
                <div className="flex justify-between items-center border-b border-blue-200 pb-1.5">
                  <span className="font-bold text-blue-950 text-base">{cp.person.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-blue-600 text-base">
                      Rp {cp.totalWithTax.toLocaleString("id-ID")}
                    </span>
                    <button
                      onClick={() => handleRemovePerson(idx)}
                      className="text-red-500 text-xs font-semibold hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* List Item Single */}
                <div className="space-y-1">
                  {cp.person.assignedItems.map((i) => (
                    <div key={i.itemIndex} className="flex justify-between text-xs text-gray-600">
                      <span>{i.name} ({i.qty}x)</span>
                      <span>Rp {(i.price * i.qty).toLocaleString("id-ID")}</span>
                    </div>
                  ))}

                  {/* List Item Sharing */}
                  {cp.person.sharingItems.map((itemIndex) => {
                    const item = billData.items[itemIndex];
                    const eaters = eatersCounts[itemIndex] || 1;
                    const cost = item ? (item.price * item.qty) / eaters : 0;
                    return (
                      <div
                        key={`s-${itemIndex}`}
                        className="flex justify-between text-xs text-blue-900 bg-blue-100/60 px-2 py-1 rounded"
                      >
                        <span>{item?.name} (Sharing 1/{eaters} orang)</span>
                        <span>Rp {Math.round(cost).toLocaleString("id-ID")}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[11px] text-gray-400 italic pt-1 border-t border-blue-100">
                  <span>Subtotal: Rp {Math.round(cp.rawSubtotal).toLocaleString("id-ID")}</span>
                  <span>*Termasuk pajak & biaya layanan proporsional</span>
                </div>
              </div>
            ))}

            {/* Total Balance Summary Footer */}
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 flex justify-between items-center border">
              <span>Total Terhitung Seluruh Anggota:</span>
              <span className="font-bold text-gray-800">
                Rp {balanceCheck.sumOfBills.toLocaleString("id-ID")}
                {balanceCheck.difference !== 0 && (
                  <span className="text-[10px] text-gray-400 ml-1">
                    (selisih pembulatan: {balanceCheck.difference > 0 ? "+" : ""}{balanceCheck.difference} Rp)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}