const User = require('../models/User');

// Register a User
exports.registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.create({ name, email, password });
        sendToken(user, 201, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Login User
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please Enter Email and Password" });
        }
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        const isPasswordMatched = await user.comparePassword(password);
        if (!isPasswordMatched) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        sendToken(user, 200, res);
    } catch (error) {
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
