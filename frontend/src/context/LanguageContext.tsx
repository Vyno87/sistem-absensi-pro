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

    // Login
    'login.title': { en: 'Welcome Back', id: 'Selamat Datang' },
    'login.subtitle': { en: 'Modern Attendance System', id: 'Sistem Absensi Modern' },
    'login.username': { en: 'Username', id: 'Nama Pengguna' },
    'login.password': { en: 'Password', id: 'Kata Sandi' },
    'login.btn': { en: 'Sign In', id: 'Masuk' },
    'login.failed': { en: 'Invalid credentials', id: 'Login gagal' },

    // Dashboard
    'dashboard.overview': { en: 'Dashboard Overview', id: 'Ringkasan Dashboard' },
    'dashboard.employees': { en: 'Total Employees', id: 'Total Karyawan' },
    'dashboard.present': { en: 'Present Today', id: 'Hadir Hari Ini' },
    'dashboard.absent': { en: 'Absent', id: 'Tidak Hadir' },
    'dashboard.onLeave': { en: 'On Leave', id: 'Cuti' },

    // Attendance
    'attendance.record': { en: 'Record Attendance', id: 'Catat Absensi' },
    'attendance.employeeId': { en: 'Enter Your Employee ID', id: 'Masukkan ID Karyawan' },
    'attendance.checkIn': { en: 'CHECK IN', id: 'MASUK' },
    'attendance.checkOut': { en: 'CHECK OUT', id: 'KELUAR' },
    'attendance.success': { en: 'Successfully Recorded', id: 'Berhasil Dicatat' },
    'attendance.locationDenied': { en: 'Location permission denied', id: 'Izin lokasi ditolak' },
    'attendance.outsideOffice': { en: 'You are outside the office area', id: 'Anda di luar area kantor' },

    // Employees
    'employees.title': { en: 'Employee Management', id: 'Manajemen Karyawan' },
    'employees.subtitle': { en: 'Manage your workforce efficiently', id: 'Kelola karyawan dengan efisien' },
    'employees.search': { en: 'Search employee...', id: 'Cari karyawan...' },
    'employees.addNew': { en: 'Add New', id: 'Tambah Baru' },
    'employees.addTitle': { en: 'Add New Employee', id: 'Tambah Karyawan Baru' },

    // Common
    'common.loading': { en: 'Loading...', id: 'Memuat...' },
    'common.save': { en: 'Save', id: 'Simpan' },
    'common.cancel': { en: 'Cancel', id: 'Batal' },
    'common.delete': { en: 'Delete', id: 'Hapus' },
    'common.edit': { en: 'Edit', id: 'Ubah' },
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
