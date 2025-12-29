# Sistem Absensi PRO (MERN Stack)

Aplikasi Sistem Absensi berbasis Web menggunakan teknologi MERN (MongoDB, Express, React, Node.js).

## 🚀 Fitur Utama
*   **Backend:** Node.js & Express (Secure API).
*   **Frontend:** React.js (Modern Glassmorphism UI).
*   **Database:** MongoDB Atlas (Cloud).
*   **Features:** Interactive Dashboard, Real-time Clock, Employee Management.
*   **One-Command Startup:** Jalankan backend & frontend sekaligus.

## 🔑 Akun Login (Default)
Telah dibuatkan akun Admin otomatis agar kamu bisa langsung test:
*   **Admin:** `admin` / `admin123`
*   **User:** `user` / `user123`

## ⚠️ Syarat Penting (Wajib Dibaca)
Karena Windows tidak bisa membaca folder dengan simbol `&`, kamu **WAJIB** mengubah nama folder project ini.
1.  **GANTI NAMA FOLDER** `SKRIPSI & PKL NOVY` menjadi 👉 **`SKRIPSI_PKL_NOVY`**
2.  Buka VS Code di folder yang baru tersebut.

## 🛠️ Cara Install & Menjalankan

### 1. Install Dependencies
Pastikan kamu berada di folder `Sistem_Absensi` (Root), lalu jalankan:
```bash
npm install
```
*Perintah ini akan menginstall paket untuk Root, Backend, dan Frontend sekaligus.*

### 2. Konfigurasi Database
Pastikan file `backend/.env` sudah berisi koneksi ke MongoDB Atlas kamu:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0...
JWT_SECRET=rahasia
```

### 3. Jalankan Aplikasi
Cukup ketik satu perintah ini di terminal Root:
```bash
npm start
```
*   **Backend** akan jalan di port 5000: `http://localhost:5000`
*   **Frontend** akan jalan di port 3000: `http://localhost:3000` (Browser akan terbuka otomatis).

---

## 📂 Struktur Folder
*   `/backend` - Server API (Node/Express)
*   `/frontend` - Tampilan Web (React)
*   `package.json` (Root) - Pengaturan untuk menjalankan keduanya sekaligus.
