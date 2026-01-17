const express = require('express');
const { getDashboardStats, getAllOrders, updateOrder } = require('../controllers/adminController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.route('/admin/dashboard').get(isAuthenticatedUser, authorizeRoles('admin', 'owner'), getDashboardStats);
router.route('/admin/orders').get(isAuthenticatedUser, authorizeRoles('admin', 'owner'), getAllOrders);
router.route('/admin/order/:id').put(isAuthenticatedUser, authorizeRoles('admin', 'owner'), updateOrder);

module.exports = router;
