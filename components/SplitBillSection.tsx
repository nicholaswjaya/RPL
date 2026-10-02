"use client";

import React, { useState } from "react";
import { BillData, Item } from "./ManualInputForm";

interface PersonAssignment {
  name: string;
  assignedItems: {
    name: string;
    price: number;
    qty: number;
  }[];
  sharingItems: string[]; // Daftar nama item sharing yang dimakan
}

interface Props {
  billData: BillData;
  onReset: () => void;
}

export default function SplitBillSection({ billData, onReset }: Props) {
  // Filter menu Single dan Sharing
  const singleItemsPool = billData.items.filter((i) => !i.isSharing);
  const sharingItemsPool = billData.items.filter((i) => i.isSharing);

  // Remaining Qty khusus menu Single
  const [remainingSingleItems, setRemainingSingleItems] = useState<Item[]>(
    singleItemsPool.map((item) => ({ ...item }))
  );

  const [people, setPeople] = useState<PersonAssignment[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [currentSingleCart, setCurrentSingleCart] = useState<{ [itemName: string]: number }>({});
  const [currentSharingCart, setCurrentSharingCart] = useState<{ [itemName: string]: boolean }>({});

  // Hitung multiplier Pajak/Service/Diskon
  const rawSubtotal = billData.items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const taxAmount = billData.taxAmount || (rawSubtotal * (billData.taxRate || 0)) / 100;
  const netTotal = rawSubtotal + taxAmount + billData.service - billData.discount;
  const multiplier = rawSubtotal > 0 ? netTotal / rawSubtotal : 1;

  // Handler Menu Single (+ / - Qty)
  const handleSingleCart = (item: Item, delta: number) => {
    const currentInCart = currentSingleCart[item.name] || 0;
    if (delta > 0 && item.qty <= 0) return;
    if (delta < 0 && currentInCart <= 0) return;

    const newCartQty = currentInCart + delta;
    const updatedCart = { ...currentSingleCart };
    if (newCartQty <= 0) delete updatedCart[item.name];
    else updatedCart[item.name] = newCartQty;

    setCurrentSingleCart(updatedCart);
    setRemainingSingleItems((prev) =>
      prev.map((i) => (i.name === item.name ? { ...i, qty: i.qty - delta } : i))
    );
  };

  // Handler Checkbox Menu Sharing
  const handleToggleSharing = (itemName: string) => {
    setCurrentSharingCart((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  // Simpan Anggota
  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentName.trim()) {
      alert("Masukkan nama orang terlebih dahulu!");
      return;
    }

    const assignedSingle = Object.keys(currentSingleCart).map((itemName) => {
      const originalItem = billData.items.find((i) => i.name === itemName);
      return {
        name: itemName,
        price: originalItem ? originalItem.price : 0,
        qty: currentSingleCart[itemName],
      };
    });

    const assignedSharing = Object.keys(currentSharingCart).filter(
      (itemName) => currentSharingCart[itemName]
    );

    if (assignedSingle.length === 0 && assignedSharing.length === 0) {
      alert("Pilih minimal 1 menu (Single / Sharing) yang dimakan!");
      return;
    }

    setPeople([
      ...people,
      {
        name: currentName,
        assignedItems: assignedSingle,
        sharingItems: assignedSharing,
      },
    ]);

    // Reset Form Input User
    setCurrentName("");
    setCurrentSingleCart({});
    setCurrentSharingCart({});
  };

  // Hapus Anggota
  const handleRemovePerson = (personIndex: number) => {
    const person = people[personIndex];
    setRemainingSingleItems((prev) =>
      prev.map((item) => {
        const returned = person.assignedItems.find((i) => i.name === item.name);
        return returned ? { ...item, qty: item.qty + returned.qty } : item;
      })
    );
    setPeople(people.filter((_, idx) => idx !== personIndex));
  };

  // Hitung Berapa Orang yang Ikut Makan Tiap Menu Sharing
  const getSharingEatersCount = (itemName: string) => {
    return people.filter((p) => p.sharingItems.includes(itemName)).length;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Form Tambah Anggota */}
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800">Pembagian Bill</h2>
          <button onClick={onReset} className="text-xs text-red-500 hover:underline font-semibold">
            ← Edit Struk
          </button>
        </div>

        <form onSubmit={handleAddPerson} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nama Orang / Teman
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi, Ani..."
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Menu Single */}
          {remainingSingleItems.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Pilih Menu Personal (Single):
              </label>
              <div className="space-y-2">
                {remainingSingleItems.map((item) => {
                  const inCart = currentSingleCart[item.name] || 0;
                  return (
                    <div
                      key={item.name}
                      className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border text-sm"
                    >
                      <div>
                        <span className="font-semibold text-gray-800">{item.name}</span>
                        <span className="text-xs text-gray-500 block">
                          Rp {item.price.toLocaleString("id-ID")} | Sisa: {item.qty} porsi
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSingleCart(item, -1)}
                          disabled={inCart <= 0}
                          className="w-7 h-7 bg-red-100 text-red-600 font-bold rounded disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold">{inCart}</span>
                        <button
                          type="button"
                          onClick={() => handleSingleCart(item, 1)}
                          disabled={item.qty <= 0}
                          className="w-7 h-7 bg-green-100 text-green-600 font-bold rounded disabled:opacity-30"
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
              <label className="block text-xs font-semibold text-blue-700 mb-2">
                Centang Jika Orang Ini Ikut Makan Menu Sharing:
              </label>
              <div className="space-y-2">
                {sharingItemsPool.map((item) => {
                  const isChecked = !!currentSharingCart[item.name];
                  const totalSharingPrice = item.price * item.qty;
                  const currentEaters = getSharingEatersCount(item.name);

                  return (
                    <label
                      key={item.name}
                      className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition text-sm ${
                        isChecked
                          ? "bg-blue-50 border-blue-400 font-semibold"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSharing(item.name)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <span className="text-gray-800">{item.name}</span>
                          <span className="text-xs text-gray-500 block">
                            Total: Rp {totalSharingPrice.toLocaleString("id-ID")} ({item.qty}x)
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {currentEaters} orang ikut makan
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg shadow hover:bg-blue-700 transition text-sm"
          >
            + Simpan Pesanan Orang Ini
          </button>
        </form>
      </div>

      {/* Rincian Tagihan Per Orang */}
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">
          Rincian Pembagian Tagihan
        </h3>

        {people.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Belum ada anggota yang ditambahkan.
          </p>
        ) : (
          <div className="space-y-4">
            {people.map((person, idx) => {
              // 1. Subtotal dari item Single
              const singleSubtotal = person.assignedItems.reduce(
                (acc, i) => acc + i.price * i.qty,
                0
              );

              // 2. Subtotal dari item Sharing (Total Harga Menu / Jumlah Orang yang Makan)
              const sharingSubtotal = person.sharingItems.reduce((acc, itemName) => {
                const item = sharingItemsPool.find((i) => i.name === itemName);
                if (!item) return acc;
                const eatersCount = getSharingEatersCount(itemName);
                const itemTotalPrice = item.price * item.qty;
                return acc + (eatersCount > 0 ? itemTotalPrice / eatersCount : 0);
              }, 0);

              const rawPersonSubtotal = singleSubtotal + sharingSubtotal;
              const personTotalWithTax = Math.round(rawPersonSubtotal * multiplier);

              return (
                <div key={idx} className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex justify-between items-center border-b border-blue-200 pb-1.5">
                    <span className="font-bold text-blue-950">{person.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-blue-600 text-base">
                        Rp {personTotalWithTax.toLocaleString("id-ID")}
                      </span>
                      <button
                        onClick={() => handleRemovePerson(idx)}
                        className="text-red-500 text-xs hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  {/* List Item Single */}
                  <div className="space-y-1">
                    {person.assignedItems.map((i, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between text-xs text-gray-600">
                        <span>{i.name} ({i.qty}x)</span>
                        <span>Rp {(i.price * i.qty).toLocaleString("id-ID")}</span>
                      </div>
                    ))}

                    {/* List Item Sharing */}
                    {person.sharingItems.map((itemName, itemIdx) => {
                      const item = sharingItemsPool.find((i) => i.name === itemName);
                      const eaters = getSharingEatersCount(itemName);
                      const cost = item ? (item.price * item.qty) / eaters : 0;
                      return (
                        <div key={`s-${itemIdx}`} className="flex justify-between text-xs text-blue-800 bg-blue-100/50 p-1 rounded">
                          <span>🍕 {itemName} (Sharing 1/{eaters} orang)</span>
                          <span>Rp {Math.round(cost).toLocaleString("id-ID")}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-gray-400 italic text-right pt-1">
                    *Termasuk pajak & service proporsional
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}