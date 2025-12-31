import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'id';

interface Translation {
    [key: string]: {
        en: string;
        id: string;
    };
}

const translations: Translation = {
    // Auth & Navigation
    'app.title': { en: 'ATTENDANCE SYSTEM PRO', id: 'SISTEM ABSENSI PRO' },
    'nav.dashboard': { en: 'Dashboard', id: 'Dashboard' },
    'nav.attendance': { en: 'Attendance', id: 'Absensi' },
    'nav.employees': { en: 'Employees', id: 'Karyawan' },
    'nav.shifts': { en: 'Shifts', id: 'Shift' },
    'nav.leaves': { en: 'Leaves', id: 'Cuti' },
    'nav.logout': { en: 'Logout', id: 'Keluar' },
    'nav.loggedInAs': { en: 'Logged in as', id: 'Masuk sebagai' },
    'nav.language': { en: 'Language', id: 'Bahasa' },

    // Login
    'login.title': { en: 'Welcome Back', id: 'Selamat Datang' },
    'login.subtitle': { en: 'Modern Attendance System', id: 'Sistem Absensi Modern' },
    'login.username': { en: 'Username', id: 'Nama Pengguna' },
    'login.password': { en: 'Password', id: 'Kata Sandi' },
    'login.btn': { en: 'Sign In', id: 'Masuk' },
    'login.failed': { en: 'Invalid credentials', id: 'Login gagal' },

    // Dashboard - Admin
    'dashboard.overview': { en: 'Dashboard Overview', id: 'Ringkasan Dashboard' },
    'dashboard.monitoring': { en: 'Real-time attendance monitoring', id: 'Pemantauan absensi real-time' },
    'dashboard.totalEmployees': { en: 'Total Employees', id: 'Total Karyawan' },
    'dashboard.avgPerformance': { en: 'Avg Performance', id: 'Rata-rata Kinerja' },
    'dashboard.promotionReady': { en: 'Promotion Ready', id: 'Siap Promosi' },
    'dashboard.activeStatus': { en: 'Active Status', id: 'Status Aktif' },
    'dashboard.weeklyAttendance': { en: 'Weekly Attendance', id: 'Absensi Mingguan' },
    'dashboard.employeeStatus': { en: 'Employee Status', id: 'Status Karyawan' },
    'dashboard.attendanceRate': { en: 'Attendance Rate', id: 'Tingkat Kehadiran' },

    // Dashboard - User
    'dashboard.welcome': { en: 'Welcome', id: 'Selamat Datang' },
    'dashboard.userSubtitle': { en: 'Keep track of your performance and attendance', id: 'Pantau kinerja dan kehadiran Anda' },
    'dashboard.readyCheckIn': { en: 'Ready to Check In?', id: 'Siap Absen Masuk?' },
    'dashboard.markAttendance': { en: 'Make sure to mark your attendance for today.', id: 'Pastikan untuk mencatat absensi Anda hari ini.' },
    'dashboard.goToAttendance': { en: 'Go to Attendance', id: 'Ke Halaman Absensi' },
    'dashboard.needLeave': { en: 'Need a Leave?', id: 'Butuh Cuti?' },
    'dashboard.submitLeave': { en: 'Submit your leave request easily from here.', id: 'Ajukan cuti dengan mudah dari sini.' },
    'dashboard.requestLeave': { en: 'Request Leave', id: 'Ajukan Cuti' },

    // Attendance
    'attendance.faceVerification': { en: 'Face Verification', id: 'Verifikasi Wajah' },
    'attendance.record': { en: 'Record Attendance', id: 'Catat Absensi' },
    'attendance.employeeId': { en: 'Enter Your Employee ID', id: 'Masukkan ID Karyawan' },
    'attendance.checkIn': { en: 'CHECK IN', id: 'MASUK' },
    'attendance.checkOut': { en: 'CHECK OUT', id: 'KELUAR' },
    'attendance.success': { en: 'Successfully Recorded', id: 'Berhasil Dicatat' },
    'attendance.locationDenied': { en: 'Location permission denied. Please allow location access.', id: 'Izin lokasi ditolak. Silakan aktifkan akses lokasi.' },
    'attendance.outsideOffice': { en: 'You are outside the office area', id: 'Anda di luar area kantor' },
    'attendance.pleaseEnterEmployeeId': { en: 'Please enter Employee ID', id: 'Silakan masukkan ID Karyawan' },
    'attendance.pleaseCapturePhoto': { en: 'Please capture your face photo first', id: 'Silakan ambil foto wajah terlebih dahulu' },
    'attendance.browserNoLocation': { en: 'Your browser does not support location access', id: 'Browser Anda tidak mendukung akses lokasi' },
    'attendance.failed': { en: 'Attendance failed', id: 'Absensi gagal' },
    'attendance.recentActivity': { en: 'Recent Activity', id: 'Aktivitas Terbaru' },
    'attendance.onTime': { en: 'On Time', id: 'Tepat Waktu' },

    // Employees
    'employees.title': { en: 'Employee Management', id: 'Manajemen Karyawan' },
    'employees.subtitle': { en: 'Manage your workforce efficiently', id: 'Kelola karyawan dengan efisien' },
    'employees.search': { en: 'Search employee...', id: 'Cari karyawan...' },
    'employees.addNew': { en: 'Add New', id: 'Tambah Baru' },
    'employees.addTitle': { en: 'Add New Employee', id: 'Tambah Karyawan Baru' },
    'employees.employeeIdPlaceholder': { en: 'Employee ID (e.g., EMP001)', id: 'ID Karyawan (cth: EMP001)' },
    'employees.fullName': { en: 'Full Name', id: 'Nama Lengkap' },
    'employees.position': { en: 'Position', id: 'Jabatan' },
    'employees.email': { en: 'Email', id: 'Email' },
    'employees.phone': { en: 'Phone', id: 'Telepon' },
    'employees.department': { en: 'Department', id: 'Departemen' },
    'employees.salary': { en: 'Salary', id: 'Gaji' },
    'employees.status': { en: 'Status', id: 'Status' },
    'employees.contract': { en: 'Contract', id: 'Kontrak' },
    'employees.permanent': { en: 'Permanent', id: 'Tetap' },
    'employees.addEmployee': { en: 'Add Employee', id: 'Tambah Karyawan' },
    'employees.failedToAdd': { en: 'Failed to add employee', id: 'Gagal menambahkan karyawan' },
    'employees.present': { en: 'Present', id: 'Hadir' },
    'employees.performance': { en: 'Performance', id: 'Kinerja' },

    // Days of week
    'days.mon': { en: 'Mon', id: 'Sen' },
    'days.tue': { en: 'Tue', id: 'Sel' },
    'days.wed': { en: 'Wed', id: 'Rab' },
    'days.thu': { en: 'Thu', id: 'Kam' },
    'days.fri': { en: 'Fri', id: 'Jum' },
    'days.sat': { en: 'Sat', id: 'Sab' },
    'days.sun': { en: 'Sun', id: 'Min' },

    // Common
    'common.loading': { en: 'Loading...', id: 'Memuat...' },
    'common.loadingDashboard': { en: 'Loading Dashboard...', id: 'Memuat Dashboard...' },
    'common.save': { en: 'Save', id: 'Simpan' },
    'common.cancel': { en: 'Cancel', id: 'Batal' },
    'common.delete': { en: 'Delete', id: 'Hapus' },
    'common.edit': { en: 'Edit', id: 'Ubah' },
    'common.active': { en: 'Active', id: 'Aktif' },
    'common.inactive': { en: 'Inactive', id: 'Tidak Aktif' },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('id'); // Default to Indonesian

    const t = (key: string): string => {
        return translations[key]?.[language] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};
