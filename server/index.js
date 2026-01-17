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
// Data sanitization against NoSQL query injection
app.use((req, res, next) => {
    req.body = mongoSanitize.sanitize(req.body);
    req.params = mongoSanitize.sanitize(req.params);

    // In Express 5, req.query is a getter and cannot be reassigned directly.
    // We strictly sanitize the properties of req.query instead.
    if (req.query) {
        const sanitizedQuery = mongoSanitize.sanitize(req.query);
        // We can't assign req.query = sanitizedQuery, so we copy props back
        // But req.query might be read-only proxy in some setups, however in Express 5
        // it is widely reported that we can modify properties, just not the object reference.
        // Actually, Express 5 uses a getter that returns the query parser result.
        // If we want to "replace" it, we might just have to modify it in place.

        // Strategy: Clear existing keys and copy sanitized ones.
        // Note: This relies on req.query being mutable object returned by the getter.
        const keys = Object.keys(req.query);
        for (const key of keys) {
            delete req.query[key];
        }
        Object.assign(req.query, sanitizedQuery);
    }
    next();
});
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
