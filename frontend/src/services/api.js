import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const BASE_URL = API_URL.replace('/api', '');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth endpoints
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Profile endpoints
export const profileAPI = {
    submitProfile: (formData) => api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getMyProfile: () => api.get('/profile'),
    getProfileByUserId: (userId) => api.get(`/profile/${userId}`),
};

// User endpoints
export const userAPI = {
    getDocuments: () => api.get('/users/documents'),
    getNotifications: () => api.get('/users/notifications'),
    markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`),
};

// Admin endpoints
export const adminAPI = {
    getAllUsers: (params) => api.get('/admin/users', { params }),
    getPendingUsers: () => api.get('/admin/pending'),
    approveUser: (userId) => api.put(`/admin/approve/${userId}`),
    rejectUser: (userId, reason) => api.put(`/admin/reject/${userId}`, { reason }),
    createManager: (data) => api.post('/admin/managers', data),
    getAllManagers: () => api.get('/admin/managers'),
    updateManagerPermissions: (managerId, permissions) =>
        api.put(`/admin/managers/${managerId}/permissions`, { permissions }),
    sendBroadcast: (data) => api.post('/admin/broadcast', data),
    getAnalytics: () => api.get('/admin/analytics'),
    updateUser: (userId, formData) => api.put(`/admin/users/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
};

// Fund endpoints
export const fundAPI = {
    getAllTransactions: (params) => api.get('/funds', { params }),
    getFundDashboard: () => api.get('/funds/dashboard'),
    createFundEntry: (formData) => api.post('/funds/receive', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    createExpenseEntry: (formData) => api.post('/funds/expense', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
