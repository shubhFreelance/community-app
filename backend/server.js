const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/funds', require('./routes/fundRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Community App API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
