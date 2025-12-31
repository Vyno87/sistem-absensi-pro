import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Shifts from './pages/Shifts';
import Leaves from './pages/Leaves';
import Reports from './pages/Reports';

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
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

