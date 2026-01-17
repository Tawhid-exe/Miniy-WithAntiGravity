const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

exports.getDashboardStats = async (req, res, next) => {
    try {
        const productsCount = await Product.countDocuments();
        const usersCount = await User.countDocuments();
        const ordersCount = await Order.countDocuments();

        const orders = await Order.find();
        let totalRevenue = 0;
        let totalProfit = 0;

        orders.forEach(order => {
            totalRevenue += order.totalPrice;
            totalProfit += order.totalProfit || 0;
        });

        // Get low stock products
        const lowStockProducts = await Product.find({ $expr: { $lte: ["$stock", "$lowStockThreshold"] } });

        res.status(200).json({
            success: true,
            productsCount,
            usersCount,
            ordersCount,
            totalRevenue,
            totalProfit,
            lowStockProducts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().populate('user', 'name email');
        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Order Status -- Admin
exports.updateOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found with this Id" });
        }

        if (order.orderStatus === "Delivered") {
            return res.status(400).json({ success: false, message: "You have already delivered this order" });
        }

        order.orderStatus = req.body.status;

        if (req.body.status === "Delivered") {
            order.deliveredAt = Date.now();
        }

        await order.save({ validateBeforeSave: false });
        // Update product stock if delivered? Or stock is deducted at order time?
        // Stock usually deducted at order time.
        // If order cancelled, we might need logic to restore stock.
        // For now, simple status update.

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
