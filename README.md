# 🐱 KICAU MANIA - Hand Gesture AI

Aplikasi web interaktif bertenaga AI yang mendeteksi gerakan tangan menggunakan **MediaPipe** untuk memicu stiker kucing animasi dan musik secara real-time.

## ✨ Fitur
- 🖐️ **Deteksi Tangan**: Menggunakan MediaPipe Hands Landmarker.
- 🎨 **Efek Green Screen**: Memproses video kucing green screen secara real-time di Canvas.
- 🎵 **Audio Interaktif**: Musik otomatis berputar saat tangan terdeteksi.
- 📱 **Responsive Design**: Tampilan modern dan premium yang menyesuaikan ukuran layar.
- 🚀 **Siap Deploy**: Dioptimalkan untuk GitHub Pages.

## 🛠️ Teknologi yang Digunakan
- HTML5 & CSS3 (Vanilla)
- JavaScript (ES6 Modules)
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- Canvas API (untuk pemrosesan Chroma Key/Green Screen)

## 🚀 Cara Menjalankan Secara Lokal
1. Pastikan Anda memiliki Python terinstal.
2. Buka terminal di folder proyek.
3. Jalankan server lokal:
   ```bash
   python -m http.server 8080
   ```
4. Buka browser dan akses `http://localhost:8080`.

## 📦 Cara Deploy ke GitHub Pages
1. Buat repository baru di GitHub.
2. Jalankan perintah berikut di folder proyek:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Kicau Mania AI"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git
   git push -u origin main
   ```
3. Di GitHub, buka **Settings > Pages**.
4. Pilih branch **main** dan folder **/(root)**, lalu klik **Save**.
5. Tunggu beberapa menit, dan situs Anda akan aktif!

---
Dibuat dengan ❤️ untuk komunitas Kicau Mania.
