const User = require('../models/User');

const logger = require('../config/logger');

// Register a User
exports.registerUser = async (req, res, next) => {
    try {
        // SECURITY FIX: Strictly extract fields. Do NOT allow 'role' to be passed.
        const { name, email, password } = req.body;

        // Force role to 'user' for public registration
        const user = await User.create({
            name,
            email,
            password,
            role: 'user'
        });

        logger.info(`New user registered: ${email}`);
        sendToken(user, 201, res);
    } catch (error) {
        logger.error(`Register Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Login User
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validation handled by middleware, but double check doesn't hurt
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please Enter Email and Password" });
        }
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            logger.warn(`Failed login attempt: ${email}`);
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        const isPasswordMatched = await user.comparePassword(password);
        if (!isPasswordMatched) {
            logger.warn(`Failed login attempt (bad password): ${email}`);
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        logger.info(`User logged in: ${email}`);
        sendToken(user, 200, res);
    } catch (error) {
        logger.error(`Login Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Logout User
exports.logout = async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
};

// Get User Detail
exports.getUserDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all users (admin)
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to get token
const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();
    // options for cookie
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        user,
        token,
    });
};
