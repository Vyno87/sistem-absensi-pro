# 🚀 Roadmap Menuju Sistem Absensi 2026 (Fitur Canggih)

Selamat! Tahap 1 (Modernisasi UI & Online Deployment) sudah selesai.
Sekarang pondasi kamu sudah kuat: MERN Stack + Glassmorphism + Vercel Deployment.

Berikut adalah langkah selanjutnya untuk mencapai tujuan "Advanced Features" kamu:

## 1. Integrasi PWA (Progressive Web App)
**Tujuan:** Agar aplikasi bisa diinstall di HP seperti aplikasi native Android/iOS.
*   [ ] Mengaktifkan Service Workers di React.
*   [ ] Membuat `manifest.json` (Logo, Nama App, Warna Tema).
*   [ ] Test install di HP.

## 2. Fitur Biometrik & Geolocation
**Tujuan:** Absensi anti-titip absen.
*   [ ] **Geolocation:** Saat klik "Check In", browser wajib meminta izin lokasi (GPS). Jika di luar radius kantor -> Tolak.
*   [ ] **Face Recognition (Simulasi):** Menggunakan kamera HP untuk memotret wajah saat absen, lalu disimpan ke server. (Bisa menggunakan `react-webcam`).

## 3. Fitur Admin Lanjutan
**Tujuan:** Kontrol penuh.
*   [ ] **Rekap Laporan:** Export data absensi ke Excel/PDF.
*   [ ] **Manajemen Shift:** Mengatur jam kerja yang berbeda-beda.
*   [ ] **Approval Cuti:** Karyawan request cuti -> Admin approve/reject.

## 4. Keamanan Tingkat Lanjut
*   [ ] **CORS Strict:** Membatasi agar API hanya bisa diakses dari domain frontend kamu saja (sekarang masih open public untuk debugging).
*   [ ] **Rate Limiting:** Mencegah serangan spam ke API.

---

**Saran Saya:**
Fokus ke **Nomor 1 (PWA)** dan **Nomor 2 (Geo/Biometrik)** dulu, karena itu yang paling terlihat "Wah" untuk skripsi/presentasi.

*File ini disimpan di: `Roadmap_2026.md`*
