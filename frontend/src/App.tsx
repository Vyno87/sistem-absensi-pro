import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Direct import hanya untuk Login (karena initial route)
import Login from './pages/Login';

// Lazy load semua halaman lain untuk code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Shifts = lazy(() => import('./pages/Shifts'));
const Leaves = lazy(() => import('./pages/Leaves'));
const Reports = lazy(() => import('./pages/Reports'));

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

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
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

              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

