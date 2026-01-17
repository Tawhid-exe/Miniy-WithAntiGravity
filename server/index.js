require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173',
        process.env.FRONTEND_URL // Production URL from env
    ],
    credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(cookieParser());
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(xss()); // Data sanitization against XSS

// Rate Limiting
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Route Imports
const product = require('./routes/productRoute');
const user = require('./routes/authRoute');
const admin = require('./routes/adminRoute');

app.use('/api/v1', product);
app.use('/api/v1', user);
app.use('/api/v1', admin);


// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/antigravity');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Database connection error:', err);
    }
};

// Start Server
app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
