import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fundAPI, BASE_URL } from '../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './Dashboard.css';
import './Admin.css';

const AdminFundDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [fundDashboard, setFundDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportTimeframe, setExportTimeframe] = useState('30'); // '7', '30', 'all'
    const [exportLoading, setExportLoading] = useState(false);

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

    const fetchTransactionsForExport = async () => {
        let params = { limit: 2000 }; // Fetch a large batch for export

        if (exportTimeframe !== 'all') {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - parseInt(exportTimeframe) * 24 * 60 * 60 * 1000)
                .toISOString().split('T')[0];
            params.startDate = startDate;
            params.endDate = endDate;
        }

        const res = await fundAPI.getAllTransactions(params);
        return res.data.data;
    };

    const handleExportJSON = async () => {
        try {
            setExportLoading(true);
            const data = await fetchTransactionsForExport();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            saveAs(blob, `transactions_export_${exportTimeframe}days_${new Date().toISOString().split('T')[0]}.json`);
        } catch (err) {
            alert('Failed to export JSON');
        } finally {
            setExportLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            setExportLoading(true);
            const data = await fetchTransactionsForExport();

            const excelData = data.map(t => ({
                'Date': new Date(t.date).toLocaleDateString(),
                'Description': t.description,
                'Type': t.type === 'FUND_RECEIVED' ? 'Credit' : 'Debit',
                'Amount (₹)': t.amount,
                'Balance After (₹)': t.balanceAfterTransaction,
                'Recorded By': t.createdBy?.email || 'N/A'
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

            // Professional Styling (Column Widths)
            const wscols = [
                { wch: 15 }, // Date
                { wch: 40 }, // Description
                { wch: 10 }, // Type
                { wch: 15 }, // Amount
                { wch: 15 }, // Balance
                { wch: 30 }, // Recorded By
            ];
            worksheet['!cols'] = wscols;

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `community_accounts_${exportTimeframe}days_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            alert('Failed to export Excel');
        } finally {
            setExportLoading(false);
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
                    <div className="export-controls">
                        <select
                            className="timeframe-select"
                            value={exportTimeframe}
                            onChange={(e) => setExportTimeframe(e.target.value)}
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="all">Overall History</option>
                        </select>
                        <button
                            className="export-btn json"
                            onClick={handleExportJSON}
                            disabled={exportLoading}
                        >
                            {exportLoading ? '...' : '📥 JSON'}
                        </button>
                        <button
                            className="export-btn excel"
                            onClick={handleExportExcel}
                            disabled={exportLoading}
                        >
                            {exportLoading ? '...' : '📁 Corporate Excel'}
                        </button>
                    </div>
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
                                            <a href={`${BASE_URL}${t.screenshotUrl}`} target="_blank" rel="noopener noreferrer" className="proof-link">
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
