import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/Layout/AppShell';

import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { ReportDetail } from './pages/ReportDetail';
import { MapView } from './pages/MapView';
import { ReportIssue } from './pages/ReportIssue';
import { DriveMode } from './pages/DriveMode';
import { CitizenMyReports } from './pages/citizen/CitizenMyReports';
import { OfficerVerificationQueue } from './pages/officer/OfficerVerificationQueue';
import { AdminContractors } from './pages/admin/AdminContractors';
import { AdminRoads } from './pages/admin/AdminRoads';
import { NotFound } from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<Landing />} />

            {/* Public Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected Application Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Default redirect / shared views */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:id" element={<ReportDetail />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/report-issue" element={<ReportIssue />} />
              <Route path="/drive-mode" element={<DriveMode />} />

              {/* 1. Citizen Specific Routes */}
              <Route path="/citizen" element={<Navigate to="/citizen/report" replace />} />
              <Route path="/citizen/report" element={<ReportIssue />} />
              <Route path="/citizen/my-reports" element={<CitizenMyReports />} />
              <Route path="/citizen/drive-mode" element={<DriveMode />} />

              {/* 2. Officer Specific Routes */}
              <Route path="/officer" element={<Navigate to="/officer/dashboard" replace />} />
              <Route
                path="/officer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['officer', 'admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/verification"
                element={
                  <ProtectedRoute allowedRoles={['officer', 'admin']}>
                    <OfficerVerificationQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/reports"
                element={
                  <ProtectedRoute allowedRoles={['officer', 'admin']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* 3. Admin Specific Routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/contractors"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminContractors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/roads"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminRoads />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
