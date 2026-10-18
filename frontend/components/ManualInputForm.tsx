"use client";

import React, { useState } from "react";
import { calculateBillTotals, sanitizeCurrency, sanitizePercentage } from "../lib/billCalculation";

export interface Item {
  name: string;
  price: number;
  qty: number;
  isSharing: boolean;
}

export interface BillData {
  items: Item[];
  taxRate: number;
  taxAmount: number;
  service: number;
  discount: number;
}

interface Props {
  initialData?: BillData | null;
  onSubmit: (data: BillData) => void;
}

export default function ManualInputForm({ initialData, onSubmit }: Props) {
  const [items, setItems] = useState<Item[]>(() => {
    if (initialData?.items && initialData.items.length > 0) {
      return initialData.items;
    }
    return [{ name: "", price: 0, qty: 1, isSharing: false }];
  });

  const [taxRate, setTaxRate] = useState<number>(() => initialData?.taxRate ?? 10);
  const [service, setService] = useState<number>(() => initialData?.service ?? 0);
  const [discount, setDiscount] = useState<number>(() => initialData?.discount ?? 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);
  };

  const { subtotal, taxAmount, grandTotal } = calculateBillTotals(
    items,
    taxRate,
    service,
    discount
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.some((item) => !item.name.trim())) {
      setErrorMessage("Semua menu harus memiliki nama!");
      return;
    }

    if (items.some((item) => item.price <= 0)) {
      setErrorMessage("Harga menu harus lebih besar dari Rp 0!");
      return;
    }

    if (items.some((item) => item.qty <= 0)) {
      setErrorMessage("Jumlah kuantitas (Qty) minimal 1!");
      return;
    }

    setErrorMessage(null);
    onSubmit({
      items,
      taxRate: sanitizePercentage(taxRate),
      taxAmount,
      service: sanitizeCurrency(service),
      discount: sanitizeCurrency(discount),
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h2 className="text-xl font-bold text-gray-800">Input Struk Manual</h2>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
          {items.length} Menu Terdaftar
        </span>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 font-bold hover:text-red-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Daftar Menu</label>
          {items.map((item, index) => (
            <div
              key={index}
              className="flex gap-2 items-center flex-wrap sm:flex-nowrap p-2 bg-gray-50 rounded-lg border border-gray-200"
            >
              <input
                type="text"
                placeholder="Nama Menu (cth: Nasi Goreng)"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                required
                className="flex-1 min-w-[140px] p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Harga (Rp)"
                value={item.price || ""}
                onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                required
                min="0"
                className="w-28 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.qty || ""}
                onChange={(e) => updateItem(index, "qty", Number(e.target.value))}
                required
                min="1"
                className="w-16 p-2 border border-gray-300 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Checkbox Sharing */}
              <label
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-lg cursor-pointer border select-none transition ${
                  item.isSharing
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.isSharing}
                  onChange={(e) => updateItem(index, "isSharing", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                Sharing?
              </label>

              <div className="w-28 text-right font-medium text-sm text-gray-700">
                Rp {(Math.max(0, item.price) * Math.max(1, item.qty)).toLocaleString("id-ID")}
              </div>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1 text-red-500 hover:text-red-700 font-bold"
                  title="Hapus baris menu"
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
          className="w-full py-2.5 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 transition"
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
              max="100"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg space-y-1.5 text-sm border border-gray-200">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal Menu:</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Pajak ({taxRate}%):</span>
            <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
          </div>
          {service > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Biaya Layanan (Service):</span>
              <span>Rp {service.toLocaleString("id-ID")}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Diskon / Potongan:</span>
              <span>- Rp {discount.toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-gray-800 pt-2 border-t border-gray-200">
            <span>Total Akhir (Grand Total):</span>
            <span className="text-blue-600">Rp {grandTotal.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Lanjut ke Pembagian Bill →
        </button>
      </form>
    </div>
  );
}