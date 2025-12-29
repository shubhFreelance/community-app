import { useState } from 'react';
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
    const [screenshot, setScreenshot] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                        <label htmlFor="balanceAfterTransaction">Remaining Balance After Transaction (₹) *</label>
                        <input
                            type="number"
                            id="balanceAfterTransaction"
                            name="balanceAfterTransaction"
                            value={formData.balanceAfterTransaction}
                            onChange={handleChange}
                            placeholder="Enter balance after this transaction"
                            required
                        />
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
