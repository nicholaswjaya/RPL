# Petunjuk Menjalankan BagiDeh

## Persyaratan

- Node.js yang kompatibel dengan Next.js 15
- npm
- API key Google Gemini untuk menggunakan fitur scan struk AI

Fitur input manual dan pembagian tagihan dapat digunakan tanpa API key.

## Persiapan

Buka terminal di folder repository, lalu pasang dependensi:

```powershell
npm install
```

Untuk mengaktifkan scan AI, buat file `.env.local` di folder root repository dan isi dengan API key milik Anda:

```dotenv
GEMINI_API_KEY=isi_dengan_api_key_Gemini_Anda
```

Jangan masukkan API key ke source code atau commit file yang berisi kredensial.

## Menjalankan dalam mode pengembangan

Dari folder root repository:

```powershell
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Pilih **Input Manual** untuk membuat struk tanpa API key, atau **Scan AI Struk** untuk mengunggah foto struk dengan API key yang sudah dikonfigurasi.

## Alur penggunaan utama

1. Masukkan menu, harga, kuantitas, dan tandai menu sharing bila diperlukan; atau unggah foto struk melalui Scan AI.
2. Periksa data struk dan lanjutkan ke pembagian bill.
3. Tambahkan nama anggota, alokasikan menu personal, lalu tandai menu sharing yang dimakan tiap anggota.
4. Periksa status sisa alokasi dan ringkasan tagihan per anggota.
5. Gunakan tombol salin untuk menyalin ringkasan yang dapat dibagikan melalui WhatsApp.

## Pengujian dan build

Jalankan unit test:

```powershell
npm test
```

Jalankan lint:

```powershell
npm run lint
```

Buat build produksi:

```powershell
npm run build
```

Setelah build berhasil, jalankan versi produksi dengan:

```powershell
npm start
```

## Catatan

Aplikasi tidak menyediakan akun/login, gateway pembayaran, database riwayat, ekspor PDF, atau konversi mata uang. Data bill hanya tersimpan sementara selama sesi aplikasi.
