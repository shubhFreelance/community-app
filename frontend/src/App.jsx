import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import CommunityForm from './pages/CommunityForm';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/AdminHome';
import AdminFundDashboard from './pages/AdminFundDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import { AddFundEntry, AddExpenseEntry } from './pages/FundEntry';

// Global styles
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          {/* User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['USER']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/community-form" element={
            <ProtectedRoute allowedRoles={['USER']}>
              <CommunityForm />
            </ProtectedRoute>
          } />

          {/* Manager Routes */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['MANAGER']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminHome />
            </ProtectedRoute>
          } />
          <Route path="/admin/membership" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/funds" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <AdminFundDashboard />
            </ProtectedRoute>
          } />

          {/* Fund Management Routes */}
          <Route path="/funds/add" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER']}>
              <AddFundEntry />
            </ProtectedRoute>
          } />
          <Route path="/funds/expense" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER']}>
              <AddExpenseEntry />
            </ProtectedRoute>
          } />

          {/* Unauthorized */}
          <Route path="/unauthorized" element={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              background: '#1a1a2e',
              color: '#fff',
              flexDirection: 'column'
            }}>
              <h1>🚫 Unauthorized</h1>
              <p>You don't have permission to access this page.</p>
              <Link to="/login" style={{ color: '#818cf8', marginTop: '20px' }}>Go to Login</Link>
            </div>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
