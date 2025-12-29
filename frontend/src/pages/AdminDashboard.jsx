import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, fundAPI, profileAPI } from '../services/api';
import './Dashboard.css';
import './Admin.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    const [analytics, setAnalytics] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [managers, setManagers] = useState([]);
    const [fundDashboard, setFundDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // User management state
    const [userSubTab, setUserSubTab] = useState('USER');
    const [userSearch, setUserSearch] = useState('');
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [usersLoading, setUsersLoading] = useState(false);

    // Manager form state
    const [showManagerForm, setShowManagerForm] = useState(false);
    const [managerForm, setManagerForm] = useState({
        email: '',
        phone: '',
        password: '',
        permissions: [],
    });

    // Broadcast form
    const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });

    // User Edit Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm, setEditForm] = useState({
        email: '',
        phone: '',
        role: '',
        status: '',
        fullName: '',
        fatherName: '',
        dateOfBirth: '',
        age: '',
        gender: '',
        address: ''
    });
    const [aadhaarFile, setAadhaarFile] = useState(null);
    const [profilePhoto, setProfilePhoto] = useState(null);

    const availablePermissions = [
        'verify_users',
        'view_funds',
        'upload_expenses',
    ];

    useEffect(() => {
        loadData();
    }, []);

    // ... existing logic ...

    const handleEditUser = async (user) => {
        setSelectedUser(user);
        // Set basic user data immediately so modal isn't empty while loading profile
        setEditForm({
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            status: user.status,
            fullName: '',
            fatherName: '',
            dateOfBirth: '',
            age: '',
            gender: 'Male',
            address: ''
        });
        setShowEditModal(true);

        try {
            const res = await profileAPI.getProfileByUserId(user._id);
            const profile = res.data.data;
            setEditForm(prev => ({
                ...prev,
                fullName: profile?.fullName || '',
                fatherName: profile?.fatherName || '',
                dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
                age: profile?.age || '',
                gender: profile?.gender || 'Male',
                address: profile?.address || ''
            }));
        } catch (err) {
            console.log('Profile fetch failed or not found:', err.message);
            // Form is already pre-filled with basic user data from the first setEditForm call
        }
        setAadhaarFile(null);
        setProfilePhoto(null);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(editForm).forEach(key => {
                formData.append(key, editForm[key]);
            });

            if (aadhaarFile) {
                formData.append('aadhaarFile', aadhaarFile);
            }
            if (profilePhoto) {
                formData.append('profilePhoto', profilePhoto);
            }

            await adminAPI.updateUser(selectedUser._id, formData);
            setShowEditModal(false);
            fetchUsers();
            alert('User and Profile updated successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action is permanent and will delete all associated data.')) return;

        try {
            await adminAPI.deleteUser(userId);
            fetchUsers();
            alert('User deleted successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    // Watch for tab/search/page changes to fetch users
    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [userSubTab, usersPage, activeTab]);

    // Handle search with debounce conceptually (or just on enter/click for MVP)
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setUsersPage(1);
            fetchUsers();
        }
    };

    const loadData = async () => {
        try {
            const [analyticsRes, pendingRes, managersRes, fundRes] = await Promise.all([
                adminAPI.getAnalytics(),
                adminAPI.getPendingUsers(),
                adminAPI.getAllManagers(),
                fundAPI.getFundDashboard(),
            ]);

            setAnalytics(analyticsRes.data.data);
            setPendingUsers(pendingRes.data.data);
            setManagers(managersRes.data.data);
            setFundDashboard(fundRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await adminAPI.getAllUsers({
                role: userSubTab,
                search: userSearch,
                page: usersPage,
                limit: 10
            });
            setAllUsers(res.data.data);
            setUsersTotalPages(res.data.pages);
        } catch (err) {
            console.error(err);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        setActionLoading(userId);
        try {
            await adminAPI.approveUser(userId);
            setPendingUsers(prev => prev.filter(p => p.user._id !== userId));
            await loadData();
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
            await loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateManager = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.createManager(managerForm);
            setShowManagerForm(false);
            setManagerForm({ email: '', phone: '', password: '', permissions: [] });
            await loadData();
            alert('Manager created successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create manager');
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.sendBroadcast(broadcastForm);
            setBroadcastForm({ title: '', message: '' });
            alert('Broadcast sent!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send broadcast');
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
            <aside className="sidebar admin-sidebar">
                <div className="sidebar-header">
                    <h2>Admin Panel</h2>
                    <span className="role-badge">SUPER ADMIN</span>
                </div>

                <nav className="sidebar-nav">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        📊 Overview
                    </button>
                    <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>
                        ⏳ Pending Users
                        {pendingUsers.length > 0 && <span className="badge">{pendingUsers.length}</span>}
                    </button>
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                        👥 User Management
                    </button>
                    <button className={activeTab === 'managers' ? 'active' : ''} onClick={() => setActiveTab('managers')}>
                        👔 Managers
                    </button>
                    <button className={activeTab === 'broadcast' ? 'active' : ''} onClick={() => setActiveTab('broadcast')}>
                        📢 Broadcast
                    </button>
                    <button onClick={() => navigate('/admin')} style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)' }}>
                        🔙 Back to Hub
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    🚪 Logout
                </button>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <h1>{activeTab === 'overview' && 'Membership Overview'}
                        {activeTab === 'pending' && 'Pending Verifications'}
                        {activeTab === 'users' && 'User Management'}
                        {activeTab === 'managers' && 'Manager Management'}
                        {activeTab === 'broadcast' && 'Send Broadcast'}
                    </h1>
                </header>

                {activeTab === 'overview' && analytics && (
                    <div className="tab-content">
                        <div className="stats-grid">
                            <div className="stat-card highlight">
                                <span className="stat-label">Total Users</span>
                                <span className="stat-value">{analytics.totalUsers}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Pending</span>
                                <span className="stat-value">{analytics.pendingUsers}</span>
                            </div>
                            <div className="stat-card success">
                                <span className="stat-label">Approved</span>
                                <span className="stat-value">{analytics.approvedUsers}</span>
                            </div>
                            <div className="stat-card danger">
                                <span className="stat-label">Rejected</span>
                                <span className="stat-value">{analytics.rejectedUsers}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Managers</span>
                                <span className="stat-value">{analytics.totalManagers}</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pending' && (
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
                                                <p><strong>DOB:</strong> {profile?.dateOfBirth && new Date(profile.dateOfBirth).toLocaleDateString()}</p>
                                                <p><strong>Phone:</strong> {profile?.phone}</p>
                                                <p><strong>Address:</strong> {profile?.address}</p>
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
                                            <button
                                                className="approve-btn"
                                                onClick={() => handleApprove(u._id)}
                                                disabled={actionLoading === u._id}
                                            >
                                                ✅ Approve
                                            </button>
                                            <button
                                                className="reject-btn"
                                                onClick={() => handleReject(u._id)}
                                                disabled={actionLoading === u._id}
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="tab-content">
                        <div className="sub-tabs">
                            <button className={`sub-tab-btn ${userSubTab === 'USER' ? 'active' : ''}`} onClick={() => { setUserSubTab('USER'); setUsersPage(1); }}>Members</button>
                            <button className={`sub-tab-btn ${userSubTab === 'MANAGER' ? 'active' : ''}`} onClick={() => { setUserSubTab('MANAGER'); setUsersPage(1); }}>Managers</button>
                            <button className={`sub-tab-btn ${userSubTab === 'SUPER_ADMIN' ? 'active' : ''}`} onClick={() => { setUserSubTab('SUPER_ADMIN'); setUsersPage(1); }}>Admins</button>
                        </div>

                        <div className="search-container">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="🔍 Search by ID, Email or Phone (Press Enter)"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>

                        {usersLoading ? (
                            <div className="loading">Fetching users...</div>
                        ) : (
                            <>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Member ID</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No users found</td>
                                            </tr>
                                        ) : (
                                            allUsers.map((u) => (
                                                <tr key={u._id}>
                                                    <td>{u.memberId}</td>
                                                    <td>{u.email}</td>
                                                    <td>{u.phone}</td>
                                                    <td>{u.role}</td>
                                                    <td><span className={`status-badge status-${u.status.toLowerCase().replace('_', '-')}`}>{u.status}</span></td>
                                                    <td className="table-actions">
                                                        <button className="edit-mini-btn" onClick={() => handleEditUser(u)}>✏️ Edit</button>
                                                        <button className="delete-mini-btn" onClick={() => handleDeleteUser(u._id)}>🗑️ Delete</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {usersTotalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                                            disabled={usersPage === 1}
                                        >
                                            ← Previous
                                        </button>
                                        <span className="page-info">Page {usersPage} of {usersTotalPages}</span>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setUsersPage(prev => Math.min(usersTotalPages, prev + 1))}
                                            disabled={usersPage === usersTotalPages}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'managers' && (
                    <div className="tab-content">
                        <button className="action-btn" onClick={() => setShowManagerForm(!showManagerForm)}>
                            ➕ Create Manager
                        </button>

                        {showManagerForm && (
                            <form onSubmit={handleCreateManager} className="manager-form">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={managerForm.email} onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input type="tel" value={managerForm.phone} onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="password" value={managerForm.password} onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Permissions</label>
                                    <div className="permissions-grid">
                                        {availablePermissions.map((perm) => (
                                            <label key={perm} className="permission-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={managerForm.permissions.includes(perm)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setManagerForm({ ...managerForm, permissions: [...managerForm.permissions, perm] });
                                                        } else {
                                                            setManagerForm({ ...managerForm, permissions: managerForm.permissions.filter(p => p !== perm) });
                                                        }
                                                    }}
                                                />
                                                {perm.replace('_', ' ')}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="auth-btn">Create Manager</button>
                            </form>
                        )}

                        <div className="managers-list">
                            {managers.map((m) => (
                                <div key={m._id} className="manager-card">
                                    <h4>{m.email}</h4>
                                    <p>Member ID: {m.memberId}</p>
                                    <p>Permissions: {m.permissions.join(', ') || 'None'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'broadcast' && (
                    <div className="tab-content">
                        <form onSubmit={handleBroadcast} className="broadcast-form">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={broadcastForm.title}
                                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                                    placeholder="Notification title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    value={broadcastForm.message}
                                    onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                                    placeholder="Your message to all users..."
                                    rows="4"
                                    required
                                />
                            </div>
                            <button type="submit" className="auth-btn">📢 Send Broadcast</button>
                        </form>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && (
                    <div className="modal-overlay">
                        <div className="modal-content admin-modal expanded-modal">
                            <div className="modal-header">
                                <h3>Edit User & Profile: {selectedUser?.memberId}</h3>
                                <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="admin-form scrollable-form">
                                <section className="form-section">
                                    <h4>Account Details</h4>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Role</label>
                                            <select
                                                value={editForm.role}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            >
                                                <option value="USER">Member (USER)</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="SUPER_ADMIN">Super Admin</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Status</label>
                                            <select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            >
                                                <option value="NEW">New</option>
                                                <option value="PENDING_VERIFICATION">Pending Verification</option>
                                                <option value="APPROVED">Approved</option>
                                                <option value="REJECTED">Rejected</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section className="form-section">
                                    <h4>Profile Information</h4>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            value={editForm.fullName}
                                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Father's Name</label>
                                        <input
                                            type="text"
                                            value={editForm.fatherName}
                                            onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Date of Birth</label>
                                            <input
                                                type="date"
                                                value={editForm.dateOfBirth}
                                                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Age</label>
                                            <input
                                                type="number"
                                                value={editForm.age}
                                                onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Gender</label>
                                            <select
                                                value={editForm.gender}
                                                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Address</label>
                                        <textarea
                                            value={editForm.address}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                            rows="2"
                                        />
                                    </div>
                                </section>

                                <section className="form-section">
                                    <h4>Documents & Media</h4>
                                    <div className="form-group">
                                        <label>Aadhaar Card (Update File)</label>
                                        <input
                                            type="file"
                                            onChange={(e) => setAadhaarFile(e.target.files[0])}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Profile Photo (Update Image)</label>
                                        <input
                                            type="file"
                                            onChange={(e) => setProfilePhoto(e.target.files[0])}
                                            accept="image/*"
                                        />
                                    </div>
                                </section>

                                <div className="modal-actions sticky-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                                    <button type="submit" className="save-btn">Update Everything</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </main >
        </div >
    );
};

export default AdminDashboard;
