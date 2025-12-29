import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileAPI, BASE_URL } from '../services/api';
import './Auth.css';

const CommunityForm = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        fatherName: '',
        dateOfBirth: '',
        age: '',
        gender: '',
        address: '',
        phone: user?.phone || '',
    });

    const [files, setFiles] = useState({
        aadhaarFile: null,
        profilePhoto: null,
    });

    const [previews, setPreviews] = useState({
        aadhaarFile: null,
        profilePhoto: null,
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const res = await profileAPI.getMyProfile();
                if (res.data.success && res.data.data) {
                    const profile = res.data.data;

                    // Format date for input: YYYY-MM-DD
                    let formattedDate = '';
                    if (profile.dateOfBirth) {
                        formattedDate = new Date(profile.dateOfBirth).toISOString().split('T')[0];
                    }

                    setFormData({
                        fullName: profile.fullName || '',
                        fatherName: profile.fatherName || '',
                        dateOfBirth: formattedDate,
                        age: profile.age || '',
                        gender: profile.gender || '',
                        address: profile.address || '',
                        phone: profile.phone || user?.phone || '',
                    });

                    setPreviews({
                        profilePhoto: profile.profilePhotoUrl ? `${BASE_URL}${profile.profilePhotoUrl}` : null,
                        aadhaarFile: profile.aadhaarFileUrl ? `${BASE_URL}${profile.aadhaarFileUrl}` : null,
                    });
                }
            } catch (err) {
                console.log('No existing profile found or fetch failed');
            } finally {
                setFetchLoading(false);
            }
        };

        fetchInitialData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Auto calculate age from DOB
        if (name === 'dateOfBirth') {
            const dob = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            setFormData(prev => ({ ...prev, dateOfBirth: value, age: age > 0 ? age : '' }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (selectedFiles[0]) {
            setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [name]: reader.result }));
            };
            reader.readAsDataURL(selectedFiles[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });

            if (files.aadhaarFile) {
                data.append('aadhaarFile', files.aadhaarFile);
            }
            if (files.profilePhoto) {
                data.append('profilePhoto', files.profilePhoto);
            }

            await profileAPI.submitProfile(data);
            setSuccess('Registration updated successfully! Awaiting verification.');
            await refreshUser();

            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return <div className="loading-screen">Loading existing data...</div>;
    }

    return (
        <div className="auth-container" style={{ padding: '40px 20px' }}>
            <div className="auth-card" style={{ maxWidth: '600px' }}>
                <div className="auth-header">
                    <h1>Community Registration</h1>
                    <p>Please fill in your details to complete registration</p>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name *</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="fatherName">Father's Name *</label>
                            <input
                                type="text"
                                id="fatherName"
                                name="fatherName"
                                value={formData.fatherName}
                                onChange={handleChange}
                                placeholder="Enter father's name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth *</label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="age">Age</label>
                            <input
                                type="number"
                                id="age"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="gender">Gender *</label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number *</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address *</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter your full address"
                            rows="3"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group file-group">
                            <label htmlFor="profilePhoto">Profile Photo *</label>
                            <input
                                type="file"
                                id="profilePhoto"
                                name="profilePhoto"
                                onChange={handleFileChange}
                                accept="image/jpeg,image/png,image/jpg"
                                required={!previews.profilePhoto}
                            />
                            {previews.profilePhoto && (
                                <img src={previews.profilePhoto} alt="Preview" className="file-preview" />
                            )}
                        </div>

                        <div className="form-group file-group">
                            <label htmlFor="aadhaarFile">Aadhaar Card *</label>
                            <input
                                type="file"
                                id="aadhaarFile"
                                name="aadhaarFile"
                                onChange={handleFileChange}
                                accept="image/jpeg,image/png,image/jpg,application/pdf"
                                required={!previews.aadhaarFile}
                            />
                            {previews.aadhaarFile && previews.aadhaarFile.startsWith('data:image') && (
                                <img src={previews.aadhaarFile} alt="Preview" className="file-preview" />
                            )}
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Submitting...' : formData.fullName ? 'Update Registration' : 'Submit Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommunityForm;
