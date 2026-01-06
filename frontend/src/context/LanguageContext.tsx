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
    'app.title': { en: 'Axiom ID', id: 'Axiom ID' },
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
    'login.adminOnline': { en: 'Admin Account is Currently Online', id: 'Akun Admin Sedang Online' },
    'login.downloadApp': { en: 'Download App', id: 'Unduh Aplikasi' },
    'login.installInstruction': { en: 'Install app for faster and easier access.', id: 'Pasang aplikasi untuk akses yang lebih cepat dan mudah.' },
    'login.installBtn': { en: 'Install Now', id: 'Pasang Sekarang' },
    'login.iosInstruction': { en: 'Tap the "Share" icon and then "Add to Home Screen" to install.', id: 'Ketuk ikon "Bagikan" lalu "Tambahkan ke Layar Utama" untuk memasang.' },

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
    'dashboard.attendanceTrend': { en: 'Attendance Trend', id: 'Tren Kehadiran' },
    'dashboard.present': { en: 'Present', id: 'Hadir' },
    'dashboard.late': { en: 'Late', id: 'Terlambat' },
    'dashboard.absent': { en: 'Absent', id: 'Tidak Hadir' },

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
    'attendance.shiftSchedule': { en: 'Work Schedule', id: 'Jadwal Kerja' },
    'attendance.onTime': { en: 'On Time', id: 'Tepat Waktu' },
    'attendance.employee': { en: 'Employee', id: 'Karyawan' },
    'attendance.position': { en: 'Software Engineer', id: 'Pengembang Perangkat Lunak' },
    'attendance.regularShift': { en: 'Regular Shift', id: 'Shift Reguler' },

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
    'employees.dailyWorker': { en: 'Daily Worker', id: 'Harian Lepas' },
    'employees.outsourcing': { en: 'Outsourcing', id: 'Outsourcing' },
    'employees.freelance': { en: 'Freelance', id: 'Borongan' },
    'employees.confirmDelete': { en: 'Delete Employee', id: 'Hapus Karyawan' },
    'employees.failedDelete': { en: 'Failed to delete employee', id: 'Gagal menghapus karyawan' },

    // Days of week
    'days.mon': { en: 'Mon', id: 'Sen' },
    'days.tue': { en: 'Tue', id: 'Sel' },
    'days.wed': { en: 'Wed', id: 'Rab' },
    'days.thu': { en: 'Thu', id: 'Kam' },
    'days.fri': { en: 'Fri', id: 'Jum' },
    'days.sat': { en: 'Sat', id: 'Sab' },
    'days.sun': { en: 'Sun', id: 'Min' },

    // Shifts
    'shifts.title': { en: 'Shift Management', id: 'Manajemen Shift' },
    'shifts.subtitle': { en: 'Manage employee work shifts', id: 'Kelola shift kerja karyawan' },
    'shifts.addShift': { en: 'Add Shift', id: 'Tambah Shift' },
    'shifts.editShift': { en: 'Edit Shift', id: 'Ubah Shift' },
    'shifts.addNewShift': { en: 'Add New Shift', id: 'Tambah Shift Baru' },
    'shifts.updateShift': { en: 'Update Shift', id: 'Perbarui Shift' },
    'shifts.deleteShift': { en: 'Delete Shift', id: 'Hapus Shift' },
    'shifts.noShifts': { en: 'No shifts created yet.', id: 'Belum ada shift yang dibuat.' },
    'shifts.shiftName': { en: 'Shift Name (e.g., Morning Shift)', id: 'Nama Shift (cth: Shift Pagi)' },
    'shifts.startTime': { en: 'Start Time', id: 'Waktu Mulai' },
    'shifts.endTime': { en: 'End Time', id: 'Waktu Selesai' },
    'shifts.description': { en: 'Description (optional)', id: 'Deskripsi (opsional)' },
    'shifts.noDescription': { en: 'No description', id: 'Tidak ada deskripsi' },
    'shifts.start': { en: 'Start', id: 'Mulai' },
    'shifts.end': { en: 'End', id: 'Selesai' },
    'shifts.confirmDelete': { en: 'Are you sure you want to delete this shift?', id: 'Apakah Anda yakin ingin menghapus shift ini?' },
    'shifts.failedSave': { en: 'Failed to save shift', id: 'Gagal menyimpan shift' },
    'shifts.failedDelete': { en: 'Failed to delete shift', id: 'Gagal menghapus shift' },

    // Leaves
    'leaves.title': { en: 'Leave Management', id: 'Manajemen Cuti' },
    'leaves.subtitle': { en: 'Request and manage employee leaves', id: 'Ajukan dan kelola cuti karyawan' },
    'leaves.requestLeave': { en: 'Request Leave', id: 'Ajukan Cuti' },
    'leaves.noLeaves': { en: 'No leave requests yet.', id: 'Belum ada pengajuan cuti.' },
    'leaves.employeeId': { en: 'Employee ID', id: 'ID Karyawan' },
    'leaves.leaveType': { en: 'Leave Type', id: 'Jenis Cuti' },
    'leaves.startDate': { en: 'Start Date', id: 'Tanggal Mulai' },
    'leaves.endDate': { en: 'End Date', id: 'Tanggal Selesai' },
    'leaves.reason': { en: 'Reason for leave', id: 'Alasan cuti' },
    'leaves.submitRequest': { en: 'Submit Request', id: 'Ajukan Permohonan' },
    'leaves.approve': { en: 'Approve', id: 'Setujui' },
    'leaves.reject': { en: 'Reject', id: 'Tolak' },
    'leaves.pending': { en: 'PENDING', id: 'MENUNGGU' },
    'leaves.approved': { en: 'APPROVED', id: 'DISETUJUI' },
    'leaves.rejected': { en: 'REJECTED', id: 'DITOLAK' },
    'leaves.annualLeave': { en: 'Annual Leave', id: 'Cuti Tahunan' },
    'leaves.sickLeave': { en: 'Sick Leave', id: 'Cuti Sakit' },
    'leaves.personalLeave': { en: 'Personal Leave', id: 'Cuti Pribadi' },
    'leaves.unpaidLeave': { en: 'Unpaid Leave', id: 'Cuti Tanpa Gaji' },
    'leaves.failedSubmit': { en: 'Failed to submit leave request', id: 'Gagal mengajukan permohonan cuti' },
    'leaves.failedApprove': { en: 'Failed to approve', id: 'Gagal menyetujui' },
    'leaves.failedReject': { en: 'Failed to reject', id: 'Gagal menolak' },

    // Reports
    'nav.reports': { en: 'Reports', id: 'Laporan' },
    'reports.title': { en: 'Attendance Reports', id: 'Laporan Absensi' },
    'reports.subtitle': { en: 'Export attendance data in Excel or PDF format', id: 'Ekspor data absensi dalam format Excel atau PDF' },
    'reports.startDate': { en: 'Start Date', id: 'Tanggal Mulai' },
    'reports.endDate': { en: 'End Date', id: 'Tanggal Akhir' },
    'reports.refresh': { en: 'Refresh', id: 'Segarkan' },
    'reports.totalRecords': { en: 'Total Records', id: 'Total Data' },
    'reports.present': { en: 'Present', id: 'Hadir' },
    'reports.late': { en: 'Late', id: 'Terlambat' },
    'reports.downloadReport': { en: 'Download Report', id: 'Unduh Laporan' },
    'reports.downloadExcel': { en: 'Download Excel', id: 'Unduh Excel' },
    'reports.downloadPDF': { en: 'Download PDF', id: 'Unduh PDF' },
    'reports.downloadFailed': { en: 'Failed to download report', id: 'Gagal mengunduh laporan' },
    'reports.preview': { en: 'Data Preview', id: 'Pratinjau Data' },
    'reports.noData': { en: 'No data available for the selected period', id: 'Tidak ada data untuk periode yang dipilih' },
    'reports.name': { en: 'Name', id: 'Nama' },
    'reports.date': { en: 'Date', id: 'Tanggal' },
    'reports.checkIn': { en: 'Check In', id: 'Masuk' },
    'reports.checkOut': { en: 'Check Out', id: 'Keluar' },
    'reports.status': { en: 'Status', id: 'Status' },
    'reports.showingFirst': { en: 'Showing first', id: 'Menampilkan' },
    'reports.of': { en: 'of', id: 'dari' },
    'reports.records': { en: 'records', id: 'data' },
    'reports.summaryTable': { en: 'Employee Summary Table (Pivot)', id: 'Tabel Ringkasan Karyawan (Pivot)' },
    'reports.promotionRecommendation': { en: 'Promotion Recommendations', id: 'Rekomendasi Pengangkatan Status' },
    'reports.attendanceRate': { en: 'Att. Rate', id: '% Hadir' },
    'reports.punctualityRate': { en: 'Punctuality', id: '% Tepat Waktu' },
    'reports.performanceScore': { en: 'Perf. Score', id: 'Skor Performa' },
    'reports.promotionScore': { en: 'Promo Score', id: 'Skor Promosi' },
    'reports.recommendation': { en: 'Recommendation', id: 'Rekomendasi' },
    'reports.eligible': { en: 'ELIGIBLE', id: 'LAYAK' },
    'reports.promotionCriteria': { en: 'Criteria: Attendance >= 90%, Performance >= 80%, Not Permanent', id: 'Kriteria: Kehadiran >= 90%, Performa >= 80%, Bukan Tetap' },
    'reports.noPromotion': { en: 'No employees meet the promotion criteria at this time.', id: 'Tidak ada karyawan yang memenuhi kriteria pengangkatan saat ini.' },

    // Common
    'common.loading': { en: 'Loading...', id: 'Memuat...' },
    'common.loadingDashboard': { en: 'Loading Dashboard...', id: 'Memuat Dashboard...' },
    'common.save': { en: 'Save', id: 'Simpan' },
    'common.cancel': { en: 'Cancel', id: 'Batal' },
    'common.delete': { en: 'Delete', id: 'Hapus' },
    'common.edit': { en: 'Edit', id: 'Ubah' },
    'common.active': { en: 'Active', id: 'Aktif' },
    'common.inactive': { en: 'Inactive', id: 'Tidak Aktif' },
    'common.disabled': { en: 'Disabled', id: 'Nonaktif' },
    'common.live': { en: 'Live', id: 'Langsung' },
    'common.gpsEnforcement': { en: 'GPS Enforcement', id: 'Penegakan GPS' },
    'common.recentActivityLive': { en: 'Recent Activity (Live)', id: 'Aktivitas Terbaru (Langsung)' },
    'common.liveEmployeeLocations': { en: 'Live Employee Locations', id: 'Lokasi Karyawan (Langsung)' },
    'common.noData': { en: 'No data available', id: 'Tidak ada data' },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('absensi-lang');
        return (saved as Language) || 'id';
    });

    const t = (key: string): string => {
        return translations[key]?.[language] || key;
    };

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('absensi-lang', lang);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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
