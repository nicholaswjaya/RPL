1. Deskripsi Masalah (Problem Statement)
Saat makan bersama di restoran atau kafe, kelompok mahasiswa atau rekan kerja sering kesulitan dalam membagi tagihan (split bill) dari nota/struk pembayaran fisik. Proses penghitungan manual menimbulkan beberapa masalah nyata:

Kompleksitas Pajak, Service Fee, & Diskon: Restoran umumnya mengenakan pajak (PB1 10%), service charge (5–7%), atau diskon nominal/persentase. Menghitung proporsi beban pajak per item makanan secara manual menggunakan kalkulator HP sangat rumit dan rawan salah hitung.

Perhitungan Makanan Tengah (Sharing): Makanan yang dipesan untuk dimakan bersama (seperti Pizza, Dimsum, atau Nachos) sulit dibagi secara adil jika hanya dikira-kira manual, yang sering menyebabkan perbedaan total tagihan (underpaid/overpaid).

Ketidakpraktisan & Memakan Waktu: Memasukkan belasan nama menu dari nota kertas satu per satu ke dalam catatan obrolan grup memakan waktu lama dan membuat suasana kumpul-kumpul menjadi canggung.

Kurangnya Transparansi: Anggota kelompok sering ragu apakah nominal tagihan yang dibebankan kepadanya sudah benar-benar presisi sesuai dengan apa yang ia makan beserta pajaknya.

2. Profil Target Pengguna (User Profile)
Aplikasi difokuskan pada 2 profil pengguna utama agar sistem realistis untuk dikembangkan dalam 12 pertemuan:

Host / Pembuat Bill (Primary User):

Profil: Mahasiswa atau individu dalam kelompok yang bertugas mengelola pembayaran nota di kasir terlebih dahulu.

Kebutuhan: Menginput data nota secara cepat (via Scan AI atau Input Manual), membagikan item ke teman-teman, dan memperoleh rincian tagihan bersih per orang tanpa pusing menghitung pajak manual.

Anggota Kelompok / Friends (Secondary User):

Profil: Teman-teman yang ikut makan bersama.

Kebutuhan: Memilih menu yang mereka makan (termasuk menu sharing) dan melihat rincian transparan berapa nominal yang harus mereka transfer ke Host.

3. Manfaat Aplikasi (Value Proposition)
Bagi Mahasiswa / Pengguna:

Mempercepat proses hitung patungan dari hitungan menit menjadi hitungan detik.

Menghilangkan rasa canggung atau potensi perselisihan akibat salah hitung tagihan.

Memberikan pembagian harga yang adil (fair) untuk makanan sharing dan proporsi pajak/diskon.

Menyediakan alternatif input fleksibel (Scan AI cepat atau Input Manual anti-gagal).

Bagi Akademik / Pengembang Proyek:

Menghasilkan aplikasi web berbasis teknologi modern (Next.js App Router, TypeScript, Tailwind CSS, dan Google GenAI SDK).

Menerapkan arsitektur resilience pattern (retry loop & fallback) yang tahan terhadap kemacetan API pihak ketiga.

4. Daftar Fitur Inti (Core Features — dikerjakan dalam 12 Pertemuan)
Scan Struk AI Vision (Automatic Scanning):

Pengguna mengunggah foto struk pembayaran.

Backend memproses foto menggunakan Gemini AI Vision untuk mengekstrak daftar menu, harga, quantity, pajak, dan diskon secara otomatis.

Dilengkapi Automatic Retry Loop (hingga 5x percobaan) di latar belakang untuk mengatasi error 503 High Demand dari API AI.

Input Struk Manual & Hitung Pajak Persentase (Fallback Engine):

Form dinamis untuk menambah, mengedit, atau menghapus item menu (Nama, Harga, Qty).

Fitur centang penanda menu Sharing? (makanan tengah).

Kalkulasi otomatis Subtotal dan Pajak (%), serta Service Charge (Rp) dan Diskon (Rp) sebagai nominal tetap.

Pembagian Bill Interaktif (Split Bill Engine):

Input nama-nama anggota kelompok.

Pemilihan menu personal (Single) dengan pelacakan sisa porsi (quantity pool) secara real-time.

Penandaan centang anggota yang ikut makan menu sharing (biaya menu otomatis dibagi rata ke jumlah orang yang mencentang).

Ringkasan Tagihan Proporsional (Bill Summary):

Menghitung faktor pengali (multiplier) pajak & service fee secara proporsional untuk tiap individu.

Kartu ringkasan berisi rincian item + total nominal bersih yang harus dibayar oleh masing-masing orang.

Indikator status apakah seluruh menu struk sudah habis terbagi atau belum.

5. Fitur yang Tidak Dikerjakan (Out of Scope / Non-Goals)
Untuk menjaga agar proyek selesai tepat waktu dalam batas 12 pertemuan, fitur-fitur berikut sengaja dibatasi / tidak dikerjakan:

Sistem Autentikasi / Login User: Tidak ada registrasi akun, akun Google, atau kata sandi. Aplikasi diasumsikan langsung digunakan oleh satu Host (Guest Session).

Integrasi Payment Gateway / Transfer Otomatis: Aplikasi tidak terhubung ke Midtrans, QRIS, GoPay, atau bank. Pembayaran antar-teman tetap dilakukan manual di luar aplikasi.

Penyimpanan Database Jangka Panjang (Database Persistence): Tidak menggunakan MySQL/PostgreSQL untuk menyimpan riwayat transaksi lampau. Seluruh data disimpan sementara di memori Client State (React State).

Ekspor PDF / Gambar Struk: Hasil ringkasan tidak dibuatkan tombol unduh file PDF, melainkan langsung dibaca di layar HP/Laptop.

Multi-Currency Converter: Aplikasi hanya mendukung mata uang Rupiah (IDR).

6. Kriteria Keberhasilan Aplikasi Sekarang Ini (Success Criteria)
Aplikasi dinyatakan berhasil dan memenuhi target kriteria pengujian pada tahap ini apabila:

Fungsionalitas Scan AI: Berhasil mengunggah gambar struk dan mengekstrak data JSON menu secara akurat, serta tidak terjadi crash di tampilan user ketika API AI mengalami hambatan antrean (berkat retry loop).

Ketepatan Kalkulasi Manual: Form manual mampu menghitung Subtotal, Pajak persentase (%), dan Total Akhir dengan akurasi 100%.

Pemisahan Menu Sharing yang Presisi: Pembagian menu sharing (misal Pizza Rp 200.000 dibagi 3 orang = Rp 66.667/orang) dihitung secara adil dan ditambah proporsi pajak secara pas.

Respon Tampilan (UX & Responsive): Antarmuka responsif digunakan dengan baik di layar ponsel (mobile-friendly) dan desktop tanpa terjadi error Module not found atau Syntax error pada build produksi Next.js.

7. User Story & Acceptance Criteria MVP

1. **Input struk secara manual** — Sebagai host, saya ingin menambah, mengubah, dan menghapus menu beserta harga, kuantitas, dan penanda sharing agar tetap dapat membuat bill ketika scan tidak tersedia.
   - Host dapat menambah dan menghapus baris menu; baris terakhir tidak dapat dihapus.
   - Host harus mengisi nama, harga lebih dari Rp 0, dan kuantitas minimal 1 sebelum bill disimpan.
   - Subtotal, pajak (persentase), service (nominal rupiah), diskon (nominal rupiah), dan total akhir diperbarui dari input; total akhir tidak pernah negatif.
   - Test: `frontend/__tests__/billCalculation.test.ts`.

2. **Scan struk otomatis** — Sebagai host, saya ingin mengunggah foto struk agar menu, harga, kuantitas, pajak, service, dan diskon dapat dibaca otomatis tanpa mengetik ulang.
   - Foto yang dipilih dikirim ke endpoint `/api/scan` dan hasil AI dengan daftar item valid diteruskan ke proses split bill.
   - Hasil scan dinormalisasi: harga dan kuantitas tidak valid dibersihkan, nama kosong diberi nama pengganti, dan nilai biaya yang tidak tersedia menjadi nol.
   - Jika scan gagal atau layanan AI tidak tersedia, pengguna menerima pesan error dan aplikasi tidak berpindah ke hasil bill palsu.
   - Test: `frontend/__tests__/receiptNormalizer.test.ts`; alur layanan AI dijalankan pada build aplikasi.

3. **Alokasi menu personal** — Sebagai host, saya ingin mengalokasikan kuantitas menu personal ke anggota agar porsi setiap orang tercatat dan tidak dialokasikan melebihi pesanan.
   - Sisa kuantitas menu personal dimulai dari kuantitas pada struk dan tidak dapat dikurangi di bawah nol.
   - Host hanya dapat menyimpan anggota dengan nama dan sedikitnya satu menu terpilih.
   - Menghapus anggota mengembalikan porsi menu personalnya ke pool.
   - Test: `frontend/__tests__/poolValidator.test.ts`.

4. **Pembagian menu sharing** — Sebagai host, saya ingin menandai anggota yang ikut makan menu sharing agar biaya menu dibagi berdasarkan jumlah orang yang memilihnya.
   - Biaya sharing per orang adalah harga dikali kuantitas dibagi jumlah eater pada menu tersebut.
   - Menu sharing tanpa eater ditandai belum terbagi; pembagian dengan nol eater tidak menghasilkan `NaN` atau `Infinity`.
   - Test: `frontend/__tests__/sharingSplitter.test.ts`.

5. **Ringkasan tagihan per anggota** — Sebagai host dan anggota, saya ingin melihat rincian tagihan per orang dengan beban pajak, service, dan diskon secara proporsional agar nominal yang dibayar transparan.
   - Setiap orang menanggung subtotal menu personal dan porsi sharing yang dipilih, lalu totalnya dikalikan faktor total bill terhadap subtotal struk.
   - Total per orang dibulatkan ke rupiah terdekat dan aplikasi menampilkan apakah alokasi sudah seimbang dengan total struk.
   - Test: `frontend/__tests__/personBilling.test.ts` dan `frontend/__tests__/billCalculation.test.ts`.

Jalankan seluruh unit test dengan `npm test`. Test berada di `frontend/__tests__/`; saat ini terdapat enam file test untuk aturan kalkulasi, normalisasi struk, alokasi menu, sharing, tagihan anggota, dan fungsi kompatibilitas kalkulasi lama.
