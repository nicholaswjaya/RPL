"use client";

import React, { useState } from "react";

export interface Item {
  name: string;
  price: number;
  qty: number;
  isSharing: boolean; // Flag menu sharing
}

export interface BillData {
  items: Item[];
  taxRate: number;
  taxAmount: number;
  service: number;
  discount: number;
}

interface Props {
  onSubmit: (data: BillData) => void;
}

export default function ManualInputForm({ onSubmit }: Props) {
  const [items, setItems] = useState<Item[]>([
    { name: "", price: 0, qty: 1, isSharing: false },
  ]);
  const [taxRate, setTaxRate] = useState<number>(10);
  const [service, setService] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  const addItem = () => {
    setItems([...items, { name: "", price: 0, qty: 1, isSharing: false }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = <K extends keyof Item>(index: number, field: K, value: Item[K]) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount + service - discount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((item) => !item.name.trim() || item.price <= 0)) {
      alert("Mohon isi nama menu dan harga dengan benar!");
      return;
    }
    onSubmit({ items, taxRate, taxAmount, service, discount });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Input Struk Manual</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Daftar Menu</label>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center flex-wrap sm:flex-nowrap p-2 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="text"
                placeholder="Nama Menu"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                required
                className="flex-1 min-w-[120px] p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Harga"
                value={item.price || ""}
                onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                required
                min="0"
                className="w-24 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.qty || ""}
                onChange={(e) => updateItem(index, "qty", Number(e.target.value))}
                required
                min="1"
                className="w-14 p-2 border border-gray-300 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Checkbox Sharing */}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-2 rounded-lg cursor-pointer border border-blue-200 select-none">
                <input
                  type="checkbox"
                  checked={item.isSharing}
                  onChange={(e) => updateItem(index, "isSharing", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                Sharing?
              </label>

              <div className="w-24 text-right font-medium text-sm text-gray-700">
                Rp {(item.price * item.qty).toLocaleString("id-ID")}
              </div>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1 text-red-500 hover:text-red-700 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="w-full py-2 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 transition"
        >
          + Tambah Menu
        </button>

        {/* Biaya Tambahan */}
        <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Pajak (%)</label>
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              placeholder="10"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Service (Rp)</label>
            <input
              type="number"
              value={service || ""}
              onChange={(e) => setService(Number(e.target.value))}
              placeholder="0"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Diskon (Rp)</label>
            <input
              type="number"
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="0"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Pajak ({taxRate}%):</span>
            <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between font-bold text-base text-gray-800 pt-2 border-t">
            <span>Total Akhir:</span>
            <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Lanjut ke Pembagian Bill
        </button>
      </form>
    </div>
  );
}