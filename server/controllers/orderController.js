const Order = require("../models/Order");
const Product = require("../models/Product");
const ErrorHander = require("../utils/errorhander"); // Assuming this exists, or I'll use simple res.status
const { createInvoice } = require("../utils/invoiceGenerator");
const sendEmail = require("../utils/sendEmail");
const path = require("path");
const fs = require("fs");

// Create new Order
exports.newOrder = async (req, res, next) => {
    try {
        const {
            shippingInfo,
            orderItems,
            paymentInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        } = req.body;

        // 1. Verify Stock & Calculate Profit
        let totalProfit = 0;

        // We need to iterate and update stock ATOMICALLY or sequentially to ensure validity
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for: ${product.name}` });
            }

            // Deduct Stock
            product.stock -= item.quantity;
            await product.save({ validateBeforeSave: false });

            // Calculate Profit for this item
            // Profit = (Selling Price - Cost Price) * Quantity
            const profitPerItem = (product.price - product.costPrice) * item.quantity;
            totalProfit += profitPerItem;
        }

        const order = await Order.create({
            shippingInfo,
            orderItems,
            paymentInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paidAt: Date.now(),
            user: req.user._id,
            totalProfit, // Stored for financial analytics
        });

        // 2. Generate Invoice
        // Ensure invoices directory exists
        const invoiceDir = path.join(__dirname, "../invoices");
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir);
        }

        const invoicePath = path.join(invoiceDir, `${order.orderId}.pdf`);
        createInvoice(order, invoicePath);

        // Send Email (Graceful degradation if credentials missing)
        try {
            const message = `Thank you for your order! Your Order ID is ${order.orderId}. We have attached your invoice.`;
            // await sendEmail({
            //     email: req.user.email,
            //     subject: `BMS Order Confirmation: ${order.orderId}`,
            //     message,
            //     // attachments: [{ path: invoicePath }] // Nodemailer attachment syntax would go here
            // });
            // console.log("Email logic placeholder - ready for SMTP credentials");
        } catch (emailError) {
            console.warn("Email send failed (non-critical):", emailError.message);
        }

        res.status(201).json({
            success: true,
            order,
            invoicePath
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Single Order
exports.getSingleOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate("user", "name email");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found with this Id" });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get logged in user  Orders
exports.myOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id });

        res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all Orders -- Admin
exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find();

        let totalAmount = 0;
        let totalProfit = 0;

        orders.forEach((order) => {
            totalAmount += order.totalPrice;
            if (order.totalProfit) totalProfit += order.totalProfit;
        });

        res.status(200).json({
            success: true,
            totalAmount,
            totalProfit,
            orders,
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

        // Logic for stock updates is handled at creation in this system, 
        // to prevent "Hold" inventory issues.
        // If we supported "Cancellation", we would re-add stock here.

        order.orderStatus = req.body.status;

        if (req.body.status === "Delivered") {
            order.deliveredAt = Date.now();
        }

        await order.save({ validateBeforeSave: false });
        res.status(200).json({
            success: true,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Order -- Admin
exports.deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found with this Id" });
        }

        await order.deleteOne();

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Invoice
exports.getInvoice = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const invoicePath = path.join(__dirname, "../invoices", `${order.orderId}.pdf`);

        if (fs.existsSync(invoicePath)) {
            res.download(invoicePath);
        } else {
            res.status(404).json({ success: false, message: "Invoice not found on server" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
