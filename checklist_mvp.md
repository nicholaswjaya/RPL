# Checklist MVP BagiDeh

Status di bawah mencatat hasil unit test pada repository ini. Tes unit memvalidasi aturan logika; tes tersebut tidak menggantikan pengujian UI end-to-end atau pengujian langsung terhadap layanan Gemini.

## Fitur MVP

| Checklist | Fitur / kriteria | Pengujian | Status |
|---|---|---|---|
| [x] | Input manual: subtotal, pajak persentase, service, diskon, total akhir, sanitasi nilai, dan total minimum nol | `frontend/__tests__/billCalculation.test.ts` (7 tes) | **PASSED** |
| [x] | Perhitungan kompatibilitas subtotal, pajak, service, dan diskon | `frontend/__tests__/split.test.ts` (2 tes) | **PASSED** |
| [x] | Normalisasi hasil scan: nama pengganti, harga/kuantitas, pajak, service, diskon, serta payload kosong | `frontend/__tests__/receiptNormalizer.test.ts` (7 tes) | **PASSED** |
| [x] | Pool kuantitas menu personal, pengembalian porsi, validasi sisa, dan format ringkasan WhatsApp | `frontend/__tests__/poolValidator.test.ts` (7 tes) | **PASSED** |
| [x] | Pembagian menu sharing berdasarkan jumlah anggota dan penanganan nol eater | `frontend/__tests__/sharingSplitter.test.ts` (6 tes) | **PASSED** |
| [x] | Rincian tagihan per anggota, pembulatan rupiah, dan pemeriksaan keseimbangan total | `frontend/__tests__/personBilling.test.ts` (6 tes) | **PASSED** |
| [x] | Seluruh suite unit test | `npm test` | **PASSED — 6 file, 35 tes** |

## Pemeriksaan tambahan

| Pemeriksaan | Status |
|---|---|
| ESLint | **PASSED** — `npm run lint`, tidak ada warning atau error |
| Build produksi dan pemeriksaan tipe | **PASSED** — `npm run build` |
| Pengujian UI end-to-end di browser | Belum dilakukan |
| Pengujian scan dengan API Gemini aktif dan foto struk nyata | Belum dilakukan; unit test hanya menguji normalisasi hasil scan |

## Catatan cakupan

- Indikator loading, pesan kesalahan, validasi form, dan interaksi clipboard merupakan bagian dari alur UI, tetapi tidak dicakup oleh suite unit test yang ada.
- Hasil scan bergantung pada konfigurasi `GEMINI_API_KEY` dan layanan eksternal; keberhasilan unit test tidak menjamin ketersediaan layanan tersebut.
- Login, pembayaran otomatis, penyimpanan riwayat/database, ekspor PDF, dan konversi mata uang termasuk di luar cakupan MVP.
