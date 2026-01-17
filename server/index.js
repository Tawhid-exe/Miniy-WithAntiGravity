const require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
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
// Data sanitization against NoSQL query injection
app.use((req, res, next) => {
    req.body = mongoSanitize.sanitize(req.body);
    req.params = mongoSanitize.sanitize(req.params);

    // In Express 5, req.query is a getter and cannot be reassigned directly.
    // We strictly sanitize the properties of req.query instead.
    if (req.query) {
        const sanitizedQuery = mongoSanitize.sanitize(req.query);
        // Strategy: Clear existing keys and copy sanitized ones.
        const keys = Object.keys(req.query);
        for (const key of keys) {
            delete req.query[key];
        }
        Object.assign(req.query, sanitizedQuery);
    }
    next();
});

// Data sanitization against XSS
app.use((req, res, next) => {
    // Helper function to sanitize object values
    const sanitizeObject = (obj) => {
        if (!obj) return obj;
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = xss(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) req.body = sanitizeObject(req.body);
    if (req.params) req.params = sanitizeObject(req.params);

    // Sanitize query safely for Express 5
    if (req.query) {
        const query = req.query;
        sanitizeObject(query);
    }

    next();
});

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
