import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protected route wrapper
export const ProtectedRoute = ({ children, allowedRoles = [], requireApproved = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (requireApproved && user.status !== 'APPROVED') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

// Redirect if already logged in
export const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (user) {
        if (user.role === 'SUPER_ADMIN') {
            return <Navigate to="/admin" replace />;
        } else if (user.role === 'MANAGER') {
            return <Navigate to="/manager" replace />;
        } else {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};
