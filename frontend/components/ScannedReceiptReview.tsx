"use client";

import { useState } from "react";
import { BillData } from "./ManualInputForm";

interface Props {
  billData: BillData;
  onConfirm: (data: BillData) => void;
  onBack: () => void;
}

export default function ScannedReceiptReview({
  billData,
  onConfirm,
  onBack,
}: Props) {
  const subtotal = billData.items.reduce((total, item) => total + item.price * item.qty, 0);
  const [taxRate, setTaxRate] = useState(billData.taxRate);
  const [serviceRate, setServiceRate] = useState(billData.serviceRate);
  const [discountRate, setDiscountRate] = useState(billData.discountRate);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const serviceAmount = Math.round((subtotal * serviceRate) / 100);
  const discountAmount = Math.round((subtotal * discountRate) / 100);
  const grandTotal = subtotal + taxAmount + serviceAmount - discountAmount;

  const handleConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    onConfirm({
      ...billData,
      taxRate,
      taxAmount,
      serviceRate,
      discountRate,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold mb-2 text-gray-800">Periksa Hasil Scan</h2>
      <p className="text-sm text-gray-600 mb-5">
        Pastikan pajak, service charge, dan diskon sudah sesuai struk. Nilainya bisa diedit sebelum lanjut.
      </p>

      <form onSubmit={handleConfirm} className="space-y-5">
        <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal menu:</span>
            <span>Rp {subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div>
            <label htmlFor="scanned-tax-rate" className="block text-sm font-semibold text-gray-700 mb-1">
              Pajak / PPN (%)
            </label>
            <input
              id="scanned-tax-rate"
              type="number"
              min="0"
              step="0.01"
              value={taxRate || ""}
              onChange={(event) => setTaxRate(Number(event.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Nominal pajak:</span>
            <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
          </div>
          <div>
            <label htmlFor="scanned-service-rate" className="block text-sm font-semibold text-gray-700 mb-1">
              Service charge (%)
            </label>
            <input
              id="scanned-service-rate"
              type="number"
              min="0"
              step="0.01"
              value={serviceRate || ""}
              onChange={(event) => setServiceRate(Number(event.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Nominal service charge:</span>
            <span>Rp {serviceAmount.toLocaleString("id-ID")}</span>
          </div>
          <div>
            <label htmlFor="scanned-discount-rate" className="block text-sm font-semibold text-gray-700 mb-1">
              Diskon (%)
            </label>
            <input
              id="scanned-discount-rate"
              type="number"
              min="0"
              step="0.01"
              value={discountRate || ""}
              onChange={(event) => setDiscountRate(Number(event.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Nominal diskon:</span>
            <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between font-bold text-base text-gray-800 pt-2 border-t">
            <span>Total akhir:</span>
            <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Kembali
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Lanjut ke Pembagian Bill
          </button>
        </div>
      </form>
    </div>
  );
}
