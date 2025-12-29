import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fundAPI } from '../services/api';
import './Auth.css';

const FundEntry = ({ type = 'receive' }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        balanceAfterTransaction: '',
    });
    const [currentBalance, setCurrentBalance] = useState(0);
    const [screenshot, setScreenshot] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fundAPI.getFundDashboard();
                setCurrentBalance(res.data.data.latestBalance || 0);
            } catch (err) {
                console.error('Failed to fetch balance:', err);
            }
        };
        fetchBalance();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedData = { ...formData, [name]: value };

        // Auto-calculate balance if amount changes
        if (name === 'amount') {
            const amountVal = parseFloat(value) || 0;
            const newBalance = type === 'receive'
                ? currentBalance + amountVal
                : currentBalance - amountVal;
            updatedData.balanceAfterTransaction = newBalance;
        }

        setFormData(updatedData);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setScreenshot(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            data.append('screenshot', screenshot);

            if (type === 'receive') {
                await fundAPI.createFundEntry(data);
            } else {
                await fundAPI.createExpenseEntry(data);
            }

            setSuccess('Transaction recorded successfully!');
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to record transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '500px' }}>
                <div className="auth-header">
                    <h1>{type === 'receive' ? '💰 Add Fund Entry' : '💸 Add Expense'}</h1>
                    <p>Record a {type === 'receive' ? 'fund received' : 'expense'} transaction</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="amount">Amount (₹) *</label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="Enter amount"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">{type === 'receive' ? 'Source / Description' : 'Purpose'} *</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder={type === 'receive' ? 'e.g., Donation from Mr. XYZ' : 'e.g., Office supplies'}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">Date</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label htmlFor="balanceAfterTransaction" style={{ marginBottom: 0 }}>Remaining Balance After Transaction (₹) *</label>
                            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Current: ₹{currentBalance}</span>
                        </div>
                        <input
                            type="number"
                            id="balanceAfterTransaction"
                            name="balanceAfterTransaction"
                            value={formData.balanceAfterTransaction}
                            onChange={handleChange}
                            placeholder="Enter balance after this transaction"
                            style={{
                                borderColor: formData.amount && formData.balanceAfterTransaction &&
                                    parseFloat(formData.balanceAfterTransaction) !== (type === 'receive' ? currentBalance + parseFloat(formData.amount) : currentBalance - parseFloat(formData.amount))
                                    ? '#ef4444' : ''
                            }}
                            required
                        />
                        {formData.amount && formData.balanceAfterTransaction && (
                            (() => {
                                const expected = type === 'receive'
                                    ? currentBalance + parseFloat(formData.amount)
                                    : currentBalance - parseFloat(formData.amount);
                                if (parseFloat(formData.balanceAfterTransaction) !== expected) {
                                    return (
                                        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                                            ⚠️ Calculation mismatch! {type === 'receive' ? 'Added' : 'Subtracted'} balance should be ₹{expected}
                                        </p>
                                    );
                                }
                                return null;
                            })()
                        )}
                    </div>

                    <div className="form-group file-group">
                        <label htmlFor="screenshot">Proof Screenshot *</label>
                        <input
                            type="file"
                            id="screenshot"
                            name="screenshot"
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/jpg"
                            required
                        />
                        {preview && (
                            <img src={preview} alt="Preview" className="file-preview" style={{ width: '100%', height: 'auto', maxHeight: '200px' }} />
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" className="auth-btn" style={{ background: '#4b5563' }} onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Recording...' : 'Record Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const AddFundEntry = () => <FundEntry type="receive" />;
export const AddExpenseEntry = () => <FundEntry type="expense" />;

export default FundEntry;
