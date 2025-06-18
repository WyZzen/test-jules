import React from 'react';
import MainLayout from './components/MainLayout';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import AuthProvider and useAuth
import './App.css';

// Import page components
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ReportListPage from './pages/ReportListPage';
import ReportsFormPage from './pages/ReportsFormPage';
import AttachementListPage from './pages/AttachementListPage';
import AttachementFormPage from './pages/AttachementFormPage';
import PrintableAttachmentPage from './pages/PrintableAttachmentPage';
import SignalementPage from './pages/SignalementPage';
import RecapPage from './pages/RecapPage';
import UsersPage from './pages/UsersPage';
import WorksitesPage from './pages/WorksitesPage';
import ClientsPage from './pages/ClientsPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminRoute from './components/AdminRoute'; // Import AdminRoute


// Component to protect routes and wrap them with MainLayout
function ProtectedRoutesWrapper() {
  const { user, loading, profile } = useAuth(); // Use the auth context

  if (loading) {
    // You might want to show a global loading spinner here
    // For now, just rendering null or a simple loading message
    return <p>Loading session...</p>;
  }

  if (!user) {
    // Redirect to login if not authenticated and not loading.
    return <Navigate to="/Techmine/" replace />;
  }

  // Optional: Check if profile is loaded, if profile is essential for all protected routes
  // if (!profile) {
  //   return <p>Loading profile...</p>; // Or redirect to a profile setup page
  // }

  return (
    <MainLayout>
      <Outlet /> {/* Child routes will render here, inside MainLayout */}
    </MainLayout>
  );
}

// App component wrapped with AuthProvider
function AppContent() {
  return (
    <Routes>
      {/* Public routes (no MainLayout) */}
      <Route path="/Techmine/" element={<LoginPage />} />
      <Route path="/Techmine/Forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes (wrapped with MainLayout) */}
      <Route element={<ProtectedRoutesWrapper />}>
        <Route path="/Techmine/Home" element={<HomePage />} />
        <Route path="/Techmine/ReportList" element={<ReportListPage />} />
        <Route path="/Techmine/ReportsForm" element={<ReportsFormPage />} />
        <Route path="/Techmine/ReportsForm/:id" element={<ReportsFormPage />} />
        <Route path="/Techmine/AttachementList" element={<AttachementListPage />} />
        <Route path="/Techmine/AttachementForm" element={<AttachementFormPage />} />
        <Route path="/Techmine/AttachementForm/:id" element={<AttachementFormPage />} />
        <Route path="/Techmine/PrintableAttachment/:id" element={<PrintableAttachmentPage />} />
        <Route path="/Techmine/Signalement" element={<SignalementPage />} />
        <Route path="/Techmine/Recap" element={<RecapPage />} />

        {/* Admin Routes */}
        <Route path="/Techmine/Users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="/Techmine/Worksites" element={<AdminRoute><WorksitesPage /></AdminRoute>} />
        <Route path="/Techmine/Clients" element={<AdminRoute><ClientsPage /></AdminRoute>} />

        {/* Add any other protected routes here */}
      </Route>

      {/* Catch-all 404 route (no MainLayout) */}
      {/* This should be the last route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
