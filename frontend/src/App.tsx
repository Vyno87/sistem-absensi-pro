import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center text-white bg-[#020617]">Loading App...</div>;

  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
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
            <PrivateRoute>
              <Employees />
            </PrivateRoute>
          } />

          <Route path="/attendance" element={
            <PrivateRoute>
              <Attendance />
            </PrivateRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
