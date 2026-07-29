# Alkitab Interlinear AYT Modern (v2.0)

Situs web Alkitab Interlinear Indonesia modern berbasis React, Vite, dan Tailwind CSS. Aplikasi ini menampilkan teks **Ibrani BHS** (*Biblia Hebraica Stuttgartensia*) bervokal lengkap untuk Perjanjian Lama, teks **Yunani WH** (*Westcott-Hort*) beraksen lengkap untuk Perjanjian Baru, nomor Strong's, serta analisis morfologi dan tata bahasa dalam Bahasa Indonesia.

---

### ✨ Fitur Utama

- **📖 Teks Asli Lengkap & Presisi**:
  - **Perjanjian Lama**: Teks Ibrani BHS lengkap dengan penanda vokal (*nikud*) dan tanda baca (*cantillation*). Teks RTL (*Right-to-Left*).
  - **Perjanjian Baru**: Teks Yunani WH lengkap dengan aksen dan tanda nafas.
- **🇮🇩 Analisis Morfologi Bahasa Indonesia**:
  - Penjelasan tata bahasa dan morfologi yang telah diterjemahkan ke dalam Bahasa Indonesia (misal: *Verba Presens Aktif Indikatif*, *Nomina Genitif Tunggal*).
- **📚 Kamus Strong's & Pencarian**:
  - Pencarian cepat berdasarkan nama kitab, referensi ayat (contoh: `Yoh 3:16`, `Kej 1:1`), atau nomor Strong's (contoh: `G976`, `H7225`).
  - Pencarian nomor Strong's menampilkan kartu definisi kamus lengkap (*lemma*, transliterasi, pengucapan, terjemahan KJV, dan definisi) serta daftar kemunculan ayat.
- **🔀 Tiga Mode Tampilan Interlinear**:
  1. **Klasik**: Teks bahasa asli (Ibrani/Yunani) di atas, terjemahan AYT Indonesia di bawah.
  2. **Terbalik**: Terjemahan AYT Indonesia di atas, teks bahasa asli di bawah dalam urutan LTR Bahasa Indonesia.
  3. **Pararel (Bilinear)**: Kalimat utuh AYT diikuti dengan teks bahasa asli yang dapat diklik per kata.
- **📱 Responsif & Tema Gelap/Terang**:
  - Tampilan *mobile-first* dengan bar navigasi *Command Dock* melayang.
  - Dukungan tema Gelap (*Dark Mode*) dan Terang (*Light Mode*) yang konsisten.
  - Tombol **Salin Detail** kata yang kompatibel dengan perangkat seluler (*mobile fallback*).

---

### 🛠️ Teknologi yang Digunakan

* **Frontend**: React 18, Vite 5, Tailwind CSS
* **Ikon**: Lucide React
* **Font**: *Noto Serif Hebrew*, *Gentium Plus*, *Plus Jakarta Sans*
* **Dataset**: Dataset Interlinear AYT Yayasan Lembaga SABDA (YLSA)

---

### 🚀 Cara Menjalankan Secara Lokal

1. **Clone repository & masuk ke direktori**:
   ```bash
   git clone https://github.com/USERNAME/ayt-interlinear.git
   cd ayt-interlinear
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` (atau port yang ditampilkan di terminal) di browser Anda.

4. **Build untuk produksi**:
   ```bash
   npm run build
   ```

---

### 🌐 Cara Deploy ke GitHub Pages

Aplikasi ini telah dikonfigurasi untuk kompatibilitas GitHub Pages (`base: './'`).

1. **Jalankan build**:
   ```bash
   npm run build
   ```

2. **Commit & Push ke GitHub**:
   ```bash
   git add .
   git commit -m "Deploy AYT Interlinear Modern"
   git push origin main
   ```

3. **Aktifkan GitHub Pages**:
   - Buka repositori Anda di GitHub ➔ **Settings** ➔ **Pages**.
   - Pada **Source**, pilih **Deploy from a branch**.
   - Pilih branch `main` dan folder `/ (root)` atau `/dist`, lalu simpan.

---

### 📜 Lisensi & Hak Cipta

Proyek ini menggunakan model lisensi ganda:

1. **Kode Sumber Web (Software/Code)**: **MIT License** — Bebas digunakan, dipelajari, dan dikembangkan.
2. **Teks Alkitab & Data Interlinear (Data/Content)**: **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.
   - **Teks AYT & Data Korelasi Interlinear**: © Yayasan Lembaga SABDA (YLSA) — [ayt.co](https://ayt.co) / [ylsa.org](https://ylsa.org).
   - **Teks Ibrani BHS**: Public Domain / Open Scriptures Hebrew Bible.
   - **Teks Yunani WH**: Public Domain / Macula Greek.

Lihat file [LICENSE](./LICENSE) untuk detail lisensi selengkapnya.
