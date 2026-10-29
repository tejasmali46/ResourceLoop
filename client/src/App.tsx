import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { ResourceLoopAssistantModal } from './components/assistant/ResourceLoopAssistantModal.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ResourceCatalogPage } from './pages/ResourceCatalogPage.js';
import { IncidentsPage } from './pages/IncidentsPage.js';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage.js';
import { EventRequestWizardPage } from './pages/student/EventRequestWizardPage.js';
import { MyRequestsPage } from './pages/student/MyRequestsPage.js';
import { RequestDetailPage } from './pages/student/RequestDetailPage.js';
import { CheckinReturnPage } from './pages/student/CheckinReturnPage.js';

// Faculty Pages
import { ApprovalDashboardPage } from './pages/faculty/ApprovalDashboardPage.js';

// Manager Pages
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage.js';
import { HandoverQueuePage } from './pages/manager/HandoverQueuePage.js';

// Admin Pages
import { AnalyticsDashboardPage } from './pages/admin/AnalyticsDashboardPage.js';
import { AuditLogPage } from './pages/admin/AuditLogPage.js';
import { UserManagementPage } from './pages/admin/UserManagementPage.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';

function AppContent() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar onOpenAssistant={() => setAssistantOpen(true)} />

      <main className="flex-1">
        <Routes>
          {/* Public / Common Routes */}
          <Route path="/" element={<LandingPage onOpenAssistant={() => setAssistantOpen(true)} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/resources" element={<ResourceCatalogPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/student/incidents" element={<IncidentsPage />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboardPage onOpenAssistant={() => setAssistantOpen(true)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/new-request"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <EventRequestWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/requests"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MyRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/requests/:id"
            element={
              <ProtectedRoute>
                <RequestDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/handover"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <CheckinReturnPage />
              </ProtectedRoute>
            }
          />

          {/* Faculty / HOD Approvals */}
          <Route
            path="/approvals"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD', 'ADMIN']}>
                <ApprovalDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals/:id"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD', 'RESOURCE_MANAGER', 'ADMIN']}>
                <RequestDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HOD', 'ADMIN']}>
                <ApprovalDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Resource Manager Operations */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['RESOURCE_MANAGER', 'ADMIN']}>
                <ManagerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/queue"
            element={
              <ProtectedRoute allowedRoles={['RESOURCE_MANAGER', 'ADMIN']}>
                <HandoverQueuePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Oversight */}
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AnalyticsDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Global AI Assistant Modal */}
      <ResourceLoopAssistantModal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
