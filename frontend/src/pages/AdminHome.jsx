import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';
import './Admin.css';

const AdminHome = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    return (
        <div className="auth-container admin-selection-container">
            <div className="selection-header">
                <h1>Welcome, Super Admin</h1>
                <p>Select a module to manage your community</p>
            </div>

            <div className="admin-selection-grid">
                <div className="selection-card animate-slide-up" onClick={() => navigate('/admin/membership')}>
                    <div className="selection-icon">👥</div>
                    <h3>Membership Dashboard</h3>
                    <p>Manage users, verifications, managers, and community broadcasts.</p>
                    <button className="action-btn">Enter Module</button>
                </div>

                <div className="selection-card animate-slide-up" style={{ animationDelay: '0.1s' }} onClick={() => navigate('/admin/funds')}>
                    <div className="selection-icon">💰</div>
                    <h3>Fund Management</h3>
                    <p>Track receipts, manage expenses, and view community financial analytics.</p>
                    <button className="action-btn secondary">Enter Module</button>
                </div>
            </div>

            <button className="logout-btn selection-logout" onClick={() => { logout(); navigate('/login'); }}>
                🚪 Logout from System
            </button>
        </div>
    );
};

export default AdminHome;
