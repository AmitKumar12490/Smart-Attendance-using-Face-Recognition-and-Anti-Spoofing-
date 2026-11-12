import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { MarkAttendancePage } from './pages/MarkAttendancePage';
import { AttendanceRecordsPage } from './pages/AttendanceRecordsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SecurityPage } from './pages/SecurityPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { EmployeePortalPage } from './pages/EmployeePortalPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If regular employee trying to access admin route, redirect to my-portal
    return <Navigate to="/my-portal" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mark-attendance" element={<MarkAttendancePage />} />

          {/* Authenticated Routes inside AdminLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SECURITY_OFFICER']}>
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={<EmployeeProfilePage />}
            />
            <Route path="/attendance" element={<AttendanceRecordsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route
              path="/security"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SECURITY_OFFICER']}>
                  <SecurityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SECURITY_OFFICER']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/my-portal" element={<EmployeePortalPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
