# Community Management & Fund Tracking App

A full-stack MERN application for community management with role-based access control, user verification, and transparent fund tracking.

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Frontend**: React (Vite), React Router
- **File Storage**: Local uploads (ready for S3/Cloudinary migration)

## Features

### User Roles
- **USER**: Register, submit community form, view documents after approval
- **MANAGER**: Verify users, view/add fund entries (based on permissions)
- **SUPER_ADMIN**: Full access - manage users, managers, funds, broadcasts

### Core Features
- ✅ JWT Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Community Registration Form with file uploads
- ✅ User Verification Workflow
- ✅ In-app Notifications
- ✅ Document Downloads (for approved members)
- ✅ Fund Tracking with proof uploads
- ✅ Manager permission management

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/community_app
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=30d
```

### 3. Seed Super Admin

```bash
cd backend
node scripts/seedAdmin.js
```

Default credentials:
- **Email**: admin@community.com
- **Password**: admin123

### 4. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Profile
- `POST /api/profile` - Submit community form (with files)
- `GET /api/profile` - Get own profile

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/pending` - Get pending verifications
- `PUT /api/admin/approve/:userId` - Approve user
- `PUT /api/admin/reject/:userId` - Reject user
- `POST /api/admin/managers` - Create manager
- `GET /api/admin/analytics` - Get dashboard stats

### Funds
- `GET /api/funds` - Get all transactions
- `GET /api/funds/dashboard` - Get fund dashboard
- `POST /api/funds/receive` - Add fund entry
- `POST /api/funds/expense` - Add expense

## Folder Structure

```
community-app/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, RBAC, uploads
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── scripts/        # Seed scripts
│   ├── uploads/        # File storage
│   └── server.js       # Entry point
├── frontend/
│   └── src/
│       ├── components/ # Reusable components
│       ├── context/    # Auth context
│       ├── pages/      # Page components
│       └── services/   # API service
└── README.md
```

## Future Enhancements

- [ ] AWS S3 / Cloudinary integration
- [ ] Automated document generation (PDFs)
- [ ] Advanced fund analytics & reports
- [ ] Mobile app (React Native)
- [ ] Microservices architecture

## License

MIT
