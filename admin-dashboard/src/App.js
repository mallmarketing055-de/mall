import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminManagement from './components/AdminManagement';
import ProductManagement from './components/ProductManagement';
import UserManagement from './components/UserManagement';
import TransactionManagement from './components/TransactionManagement';
import "./i18n"; // <-- make sure this is here
import SocialMediaLinks from './components/SocialMediaManagement';
import AppPointsManagement from './components/PointsManagement';
import UserJobsDashboard from './components/UserJobsDashboard';
import CourseManagement from './components/CourseManagement';
import RewardSettingsManagement from './components/RewardSettingsManagement';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {


  return (
    <AuthProvider>

      <Router basename='/'>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-management"
              element={
                <ProtectedRoute>
                  <AdminManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/points-management"
              element={
                <ProtectedRoute>
                  <AppPointsManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/social-media-links"
              element={
                <ProtectedRoute>
                  <SocialMediaLinks />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user-jobs"
              element={
                <ProtectedRoute>
                  <UserJobsDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CourseManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reward-settings"
              element={
                <ProtectedRoute>
                  <RewardSettingsManagement />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>

          {/* Toast notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
