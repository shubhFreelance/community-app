import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileAPI, userAPI } from '../services/api';
import './Dashboard.css';

const UserDashboard = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [documents, setDocuments] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            // Load profile if exists
            try {
                const profileRes = await profileAPI.getMyProfile();
                setProfile(profileRes.data.data);
            } catch (err) {
                // Profile doesn't exist yet
            }

            // Load notifications
            const notifRes = await userAPI.getNotifications();
            setNotifications(notifRes.data.data);

            // Load documents if approved
            if (user?.status === 'APPROVED') {
                try {
                    const docsRes = await userAPI.getDocuments();
                    setDocuments(docsRes.data.data);
                } catch (err) { }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusBadge = () => {
        const statusColors = {
            NEW: 'status-new',
            FORM_SUBMITTED: 'status-pending',
            PENDING_VERIFICATION: 'status-pending',
            APPROVED: 'status-approved',
            REJECTED: 'status-rejected',
        };
        return statusColors[user?.status] || 'status-new';
    };

    const renderStatusMessage = () => {
        switch (user?.status) {
            case 'NEW':
                return (
                    <div className="status-card warning">
                        <h3>⚠️ Action Required</h3>
                        <p>Please complete your community registration form to proceed.</p>
                        <button onClick={() => navigate('/community-form')} className="action-btn">
                            Complete Registration
                        </button>
                    </div>
                );
            case 'PENDING_VERIFICATION':
                return (
                    <div className="status-card info">
                        <h3>⏳ Pending Verification</h3>
                        <p>Your registration is under review. We'll notify you once approved.</p>
                    </div>
                );
            case 'REJECTED':
                return (
                    <div className="status-card error">
                        <h3>❌ Registration Rejected</h3>
                        <p>{profile?.rejectionReason || 'Please update your details and resubmit.'}</p>
                        <button onClick={() => navigate('/community-form')} className="action-btn">
                            Update & Resubmit
                        </button>
                    </div>
                );
            case 'APPROVED':
                return (
                    <div className="status-card success">
                        <h3>✅ Verified Member</h3>
                        <p>Welcome to the community! You have full access to all features.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>Community App</h2>
                    <span className={`member-id`}>{user?.memberId}</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={activeTab === 'overview' ? 'active' : ''}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={activeTab === 'profile' ? 'active' : ''}
                        onClick={() => setActiveTab('profile')}
                    >
                        👤 Profile
                    </button>
                    {user?.status === 'APPROVED' && (
                        <button
                            className={activeTab === 'documents' ? 'active' : ''}
                            onClick={() => setActiveTab('documents')}
                        >
                            📄 Documents
                        </button>
                    )}
                    <button
                        className={activeTab === 'notifications' ? 'active' : ''}
                        onClick={() => setActiveTab('notifications')}
                    >
                        🔔 Notifications
                        {notifications.filter(n => !n.isRead).length > 0 && (
                            <span className="badge">{notifications.filter(n => !n.isRead).length}</span>
                        )}
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <h1>Welcome, {profile?.fullName || user?.email}</h1>
                    <span className={`status-badge ${getStatusBadge()}`}>
                        {user?.status?.replace('_', ' ')}
                    </span>
                </header>

                {activeTab === 'overview' && (
                    <div className="tab-content">
                        {renderStatusMessage()}

                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">Member ID</span>
                                <span className="stat-value">{user?.memberId}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Account Status</span>
                                <span className="stat-value">{user?.status?.replace('_', ' ')}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Role</span>
                                <span className="stat-value">{user?.role}</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="tab-content">
                        {profile ? (
                            <div className="profile-card">
                                <div className="profile-photo">
                                    <img src={`http://localhost:5000${profile.profilePhotoUrl}`} alt="Profile" />
                                </div>
                                <div className="profile-details">
                                    <h3>{profile.fullName}</h3>
                                    <p><strong>Father's Name:</strong> {profile.fatherName}</p>
                                    <p><strong>DOB:</strong> {new Date(profile.dateOfBirth).toLocaleDateString()}</p>
                                    <p><strong>Age:</strong> {profile.age}</p>
                                    <p><strong>Gender:</strong> {profile.gender}</p>
                                    <p><strong>Address:</strong> {profile.address}</p>
                                    <p><strong>Phone:</strong> {profile.phone}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No profile submitted yet.</p>
                                <button onClick={() => navigate('/community-form')} className="action-btn">
                                    Complete Registration
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && user?.status === 'APPROVED' && (
                    <div className="tab-content">
                        {documents ? (
                            <div className="documents-grid">
                                <div className="document-card">
                                    <span className="doc-icon">📜</span>
                                    <h4>Membership Approval</h4>
                                    <a href={`http://localhost:5000${documents.membershipApprovalUrl}`} target="_blank" rel="noopener noreferrer" className="download-btn">
                                        Download PDF
                                    </a>
                                </div>
                                <div className="document-card">
                                    <span className="doc-icon">🪪</span>
                                    <h4>Community ID Card</h4>
                                    <a href={`http://localhost:5000${documents.idCardUrl}`} target="_blank" rel="noopener noreferrer" className="download-btn">
                                        Download
                                    </a>
                                </div>
                                <div className="document-card">
                                    <span className="doc-icon">📋</span>
                                    <h4>Caste Certificate</h4>
                                    <a href={`http://localhost:5000${documents.casteCertificateUrl}`} target="_blank" rel="noopener noreferrer" className="download-btn">
                                        Download
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>Documents not yet generated.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="tab-content">
                        {notifications.length > 0 ? (
                            <div className="notifications-list">
                                {notifications.map((notif) => (
                                    <div key={notif._id} className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}>
                                        <div className="notif-header">
                                            <h4>{notif.title}</h4>
                                            <span className="notif-date">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p>{notif.message}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No notifications yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserDashboard;
