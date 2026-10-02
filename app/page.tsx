"use client";

import { useState } from "react";
import ManualInputForm, { BillData } from "../components/ManualInputForm";
import SplitBillSection from "../components/SplitBillSection";

export default function Home() {
  const [mode, setMode] = useState<"ai" | "manual">("manual");
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  // Menerima data bill yang siap dibagi (baik dari AI maupun Manual)
  const handleDataReady = (data: BillData) => {
    setBillData(data);
  };

  // Proses Scan Struk Menggunakan AI
  const handleAIScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Pilih foto struk terlebih dahulu!");
      return;
    }

    setLoadingAI(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      // Validasi respons JSON dari server
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server error (${res.status}). Pastikan file app/api/scan/route.ts sudah benar.`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal scan struk");

      const items = data.items || [];
      const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.qty, 0);
      const taxAmount = typeof data.tax === "number" ? data.tax : 0;
      const taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0;

      handleDataReady({
        items,
        taxRate,
        taxAmount,
        service: data.service || 0,
        discount: data.discount || 0,
      });
    } catch (err: any) {
      alert(err.message || "Gagal memproses AI");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-extrabold text-center text-blue-600 mb-6">Patungin App</h1>

      {!billData ? (
        <>
          {/* Navigasi Toggle Scan AI / Input Manual */}
          <div className="max-w-md mx-auto mb-6 flex bg-gray-200 p-1 rounded-xl">
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                mode === "manual" ? "bg-white shadow text-blue-600" : "text-gray-600"
              }`}
            >
              Input Manual
            </button>
            <button
              onClick={() => setMode("ai")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                mode === "ai" ? "bg-white shadow text-blue-600" : "text-gray-600"
              }`}
            >
              Scan AI
            </button>
          </div>

          {/* Form Input Manual */}
          {mode === "manual" && <ManualInputForm onSubmit={handleDataReady} />}

          {/* Form Upload Scan AI */}
          {mode === "ai" && (
            <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 text-center">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Scan Struk Pakai AI</h2>
              <form onSubmit={handleAIScan} className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  type="submit"
                  disabled={loadingAI}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loadingAI ? "Sedang Menganalisis Struk..." : "Mulai Scan"}
                </button>
              </form>
            </div>
          )}
        </>
      ) : (
        /* Halaman Pembagian Bill per Orang */
        <SplitBillSection billData={billData} onReset={() => setBillData(null)} />
      )}
    </main>
  );
}