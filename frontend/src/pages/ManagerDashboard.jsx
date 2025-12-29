import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, fundAPI } from '../services/api';
import './Dashboard.css';
import './Admin.css';

const ManagerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [pendingUsers, setPendingUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const hasPermission = (perm) => user?.permissions?.includes(perm);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (hasPermission('verify_users')) {
                const pendingRes = await adminAPI.getPendingUsers();
                setPendingUsers(pendingRes.data.data);
            }

            if (hasPermission('view_funds')) {
                const transRes = await fundAPI.getAllTransactions({});
                setTransactions(transRes.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        setActionLoading(userId);
        try {
            await adminAPI.approveUser(userId);
            setPendingUsers(prev => prev.filter(p => p.user._id !== userId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        setActionLoading(userId);
        try {
            await adminAPI.rejectUser(userId, reason);
            setPendingUsers(prev => prev.filter(p => p.user._id !== userId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>Manager Panel</h2>
                    <span className="member-id">{user?.memberId}</span>
                </div>

                <nav className="sidebar-nav">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        📊 Overview
                    </button>
                    {hasPermission('verify_users') && (
                        <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>
                            ⏳ Verify Users
                            {pendingUsers.length > 0 && <span className="badge">{pendingUsers.length}</span>}
                        </button>
                    )}
                    {hasPermission('view_funds') && (
                        <button className={activeTab === 'funds' ? 'active' : ''} onClick={() => setActiveTab('funds')}>
                            💰 Funds
                        </button>
                    )}
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <h1>Welcome, Manager</h1>
                    <div>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                            Permissions: {user?.permissions?.join(', ') || 'None'}
                        </span>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="tab-content">
                        <div className="status-card info">
                            <h3>👔 Manager Dashboard</h3>
                            <p>You have access to the following features based on your permissions.</p>
                        </div>

                        <div className="stats-grid">
                            {hasPermission('verify_users') && (
                                <div className="stat-card" onClick={() => setActiveTab('pending')} style={{ cursor: 'pointer' }}>
                                    <span className="stat-label">Pending Verifications</span>
                                    <span className="stat-value">{pendingUsers.length}</span>
                                </div>
                            )}
                            {hasPermission('view_funds') && (
                                <div className="stat-card" onClick={() => setActiveTab('funds')} style={{ cursor: 'pointer' }}>
                                    <span className="stat-label">Recent Transactions</span>
                                    <span className="stat-value">{transactions.length}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'pending' && hasPermission('verify_users') && (
                    <div className="tab-content">
                        {pendingUsers.length === 0 ? (
                            <div className="empty-state">
                                <p>No pending verifications</p>
                            </div>
                        ) : (
                            <div className="pending-list">
                                {pendingUsers.map(({ user: u, profile }) => (
                                    <div key={u._id} className="pending-card">
                                        <div className="pending-info">
                                            <div className="pending-photo">
                                                {profile?.profilePhotoUrl && (
                                                    <img src={`http://localhost:5000${profile.profilePhotoUrl}`} alt="" />
                                                )}
                                            </div>
                                            <div className="pending-details">
                                                <h4>{profile?.fullName || u.email}</h4>
                                                <p><strong>Member ID:</strong> {u.memberId}</p>
                                                <p><strong>Father's Name:</strong> {profile?.fatherName}</p>
                                                <p><strong>Phone:</strong> {profile?.phone}</p>
                                            </div>
                                            <div className="pending-docs">
                                                {profile?.aadhaarFileUrl && (
                                                    <a href={`http://localhost:5000${profile.aadhaarFileUrl}`} target="_blank" rel="noopener noreferrer" className="doc-link">
                                                        📄 View Aadhaar
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pending-actions">
                                            <button className="approve-btn" onClick={() => handleApprove(u._id)} disabled={actionLoading === u._id}>
                                                ✅ Approve
                                            </button>
                                            <button className="reject-btn" onClick={() => handleReject(u._id)} disabled={actionLoading === u._id}>
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'funds' && hasPermission('view_funds') && (
                    <div className="tab-content">
                        {hasPermission('upload_expenses') && (
                            <div className="fund-actions">
                                <button className="action-btn secondary" onClick={() => navigate('/funds/expense')}>
                                    ➖ Add Expense
                                </button>
                            </div>
                        )}

                        <div className="transactions-list" style={{ marginTop: '20px' }}>
                            {transactions.map((t) => (
                                <div key={t._id} className={`transaction-card ${t.type === 'FUND_RECEIVED' ? 'income' : 'expense'}`}>
                                    <div className="trans-info">
                                        <span className="trans-type">{t.type === 'FUND_RECEIVED' ? '↗️' : '↘️'}</span>
                                        <div>
                                            <h4>{t.description}</h4>
                                            <p>{new Date(t.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="trans-amount">
                                        <span className={t.type === 'FUND_RECEIVED' ? 'positive' : 'negative'}>
                                            {t.type === 'FUND_RECEIVED' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                        </span>
                                        <small>Balance: ₹{t.balanceAfterTransaction.toLocaleString()}</small>
                                    </div>
                                    {t.screenshotUrl && (
                                        <a href={`http://localhost:5000${t.screenshotUrl}`} target="_blank" rel="noopener noreferrer" className="proof-link">
                                            📷 Proof
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ManagerDashboard;
