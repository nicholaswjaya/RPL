"use client";

import { useState } from "react";
import ManualInputForm, { BillData } from "../components/ManualInputForm";
import SplitBillSection from "../components/SplitBillSection";
import { normalizeReceiptData, RawReceiptPayload } from "../lib/receiptNormalizer";

export default function Home() {
  const [mode, setMode] = useState<"ai" | "manual">("manual");
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Menerima data bill yang siap dibagi (baik dari AI maupun Manual)
  const handleDataReady = (data: BillData) => {
    setBillData(data);
    setScanError(null);
  };

  // Proses Scan Struk Menggunakan AI
  const handleAIScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setScanError("Pilih foto struk terlebih dahulu!");
      return;
    }

    setLoadingAI(true);
    setScanError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          `Server error (${res.status}). Pastikan endpoint /api/scan berfungsi dengan baik.`
        );
      }

      const data: RawReceiptPayload & { error?: string } = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses struk dengan AI.");
      }

      // Normalisasi payload AI menjadi BillData yang valid
      const normalized = normalizeReceiptData(data);
      handleDataReady(normalized);
    } catch (err: unknown) {
      setScanError(err instanceof Error ? err.message : "Gagal memproses AI.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-600 tracking-tight">
          BagiDeh
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Kalkulator & Pemisah Tagihan Struk Otomatis (Split Bill Cepat & Adil)
        </p>
      </div>

      {!billData ? (
        <>
          {/* Navigasi Toggle Scan AI / Input Manual */}
          <div className="max-w-md mx-auto mb-6 flex bg-gray-200 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => {
                setMode("manual");
                setScanError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                mode === "manual" ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ✍️ Input Manual
            </button>
            <button
              onClick={() => {
                setMode("ai");
                setScanError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                mode === "ai" ? "bg-white shadow text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📸 Scan AI Struk
            </button>
          </div>

          {/* Form Input Manual */}
          {mode === "manual" && (
            <ManualInputForm initialData={billData} onSubmit={handleDataReady} />
          )}

          {/* Form Upload Scan AI */}
          {mode === "ai" && (
            <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                📷
              </div>
              <h2 className="text-xl font-bold mb-1 text-gray-800">Scan Struk Pakai AI</h2>
              <p className="text-xs text-gray-500 mb-4">
                Unggah foto struk restoran/kafe Anda, AI akan mengekstrak menu, harga, dan pajak otomatis.
              </p>

              {scanError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 text-left">
                  ⚠️ {scanError}
                </div>
              )}

              <form onSubmit={handleAIScan} className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setScanError(null);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />

                <button
                  type="submit"
                  disabled={loadingAI}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingAI ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Sedang Menganalisis Struk...</span>
                    </>
                  ) : (
                    <span>Mulai Scan Struk</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </>
      ) : (
        /* Halaman Pembagian Bill per Orang */
        <SplitBillSection
          billData={billData}
          onReset={() => {
            setMode("manual");
            setBillData(null);
          }}
        />
      )}
    </main>
  );
}