import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fundAPI } from '../services/api';
import './Dashboard.css';
import './Admin.css';

const AdminFundDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [fundDashboard, setFundDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fundAPI.getFundDashboard();
            setFundDashboard(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-screen">Loading Finance Data...</div>;

    return (
        <div className="dashboard-container">
            <aside className="sidebar admin-sidebar">
                <div className="sidebar-header">
                    <h2>Fund Manager</h2>
                    <span className="role-badge">FINANCE MODULE</span>
                </div>

                <nav className="sidebar-nav">
                    <button className="active">📊 Overview</button>
                    <button onClick={() => navigate('/funds/add')}>➕ Add Fund</button>
                    <button onClick={() => navigate('/funds/expense')}>➖ Add Expense</button>
                    <button onClick={() => navigate('/admin')} style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)' }}>
                        🔙 Back to Hub
                    </button>
                </nav>

                <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }}>
                    🚪 Logout
                </button>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <h1>Financial Dashboard</h1>
                </header>

                <div className="tab-content">
                    {fundDashboard && (
                        <>
                            <div className="stats-grid">
                                <div className="stat-card success">
                                    <span className="stat-label">Total Received (Month)</span>
                                    <span className="stat-value">₹{fundDashboard.monthlyFundsReceived.toLocaleString()}</span>
                                </div>
                                <div className="stat-card danger">
                                    <span className="stat-label">Total Expenses (Month)</span>
                                    <span className="stat-value">₹{fundDashboard.monthlyExpenses.toLocaleString()}</span>
                                </div>
                                <div className="stat-card highlight">
                                    <span className="stat-label">Current Net Balance</span>
                                    <span className="stat-value">₹{fundDashboard.latestBalance.toLocaleString()}</span>
                                </div>
                            </div>

                            <h3 style={{ color: '#fff', marginTop: '48px', marginBottom: '24px' }}>Recent Financial Activity</h3>
                            <div className="transactions-list">
                                {fundDashboard.recentTransactions.map((t) => (
                                    <div key={t._id} className={`transaction-card ${t.type === 'FUND_RECEIVED' ? 'income' : 'expense'}`}>
                                        <div className="trans-info">
                                            <span className="trans-type">{t.type === 'FUND_RECEIVED' ? '📈' : '📉'}</span>
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
                                                📷 View Receipt
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminFundDashboard;
