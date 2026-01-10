import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import api from './services/api';

// Direct import hanya untuk Login (karena initial route)
import Login from './pages/Login';

// Lazy load semua halaman lain untuk code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Shifts = lazy(() => import('./pages/Shifts'));
const Leaves = lazy(() => import('./pages/Leaves'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Payroll = lazy(() => import('./pages/Payroll'));

// Loading component yang ringan
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-[#020617]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-sm">Memuat halaman...</p>
    </div>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { token, user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center text-white bg-[#020617]">Loading App...</div>;

  if (!token) return <Navigate to="/login" />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const SyncHandler = () => {
  React.useEffect(() => {
    const handleSync = async () => {
      if (!navigator.onLine) return;

      const pending = JSON.parse(localStorage.getItem('pending_attendance') || '[]');
      if (pending.length === 0) return;

      console.log(`🌐 Found ${pending.length} pending attendances. Syncing...`);
      const remaining = [];

      for (const attendance of pending) {
        try {
          await api.post('/attendance', { ...attendance, notes: 'Synced from offline' });
        } catch (error) {
          console.error('❌ Sync failed for', attendance.employeeId, error);
          remaining.push(attendance);
        }
      }

      localStorage.setItem('pending_attendance', JSON.stringify(remaining));
      if (remaining.length === 0) {
        console.log('✅ All pending data synced successfully');
      }
    };

    window.addEventListener('online', handleSync);
    // Also try sync on mount if online
    handleSync();

    return () => window.removeEventListener('online', handleSync);
  }, []);

  return null;
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SyncHandler />
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } />

                <Route path="/employees" element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <Employees />
                  </PrivateRoute>
                } />

                <Route path="/attendance" element={
                  <PrivateRoute allowedRoles={['user']}>
                    <Attendance />
                  </PrivateRoute>
                } />

                <Route path="/shifts" element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <Shifts />
                  </PrivateRoute>
                } />

                <Route path="/leaves" element={
                  <PrivateRoute>
                    <Leaves />
                  </PrivateRoute>
                } />

                <Route path="/reports" element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <Reports />
                  </PrivateRoute>
                } />

                <Route path="/settings" element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <Settings />
                  </PrivateRoute>
                } />

                <Route path="/payroll" element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <Payroll />
                  </PrivateRoute>
                } />

                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
