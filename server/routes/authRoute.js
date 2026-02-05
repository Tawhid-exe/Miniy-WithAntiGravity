const express = require('express');
const { registerUser, loginUser, logout, getUserDetails, getAllUsers } = require('../controllers/authController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

const { validate, registerSchema, loginSchema } = require('../middleware/validator');

router.route('/register').post(validate(registerSchema), registerUser);
router.route('/login').post(validate(loginSchema), loginUser);
router.route('/logout').get(logout);
router.route('/me').get(isAuthenticatedUser, getUserDetails);
router.route('/admin/users').get(isAuthenticatedUser, authorizeRoles('admin', 'owner'), getAllUsers);

module.exports = router;
