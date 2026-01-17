const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        pinCode: { type: Number, required: true },
        phoneNo: { type: Number, required: true }
    },
    orderItems: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            image: { type: String, required: true },
            product: {
                type: mongoose.Schema.ObjectId,
                ref: "Product",
                required: true
            },
            costPrice: { type: Number, required: true } // Snapshot at time of order
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    paymentInfo: {
        id: { type: String, required: true },
        status: { type: String, required: true }
    },
    paidAt: {
        type: Date,
        required: true
    },
    itemsPrice: {
        type: Number,
        default: 0
    },
    taxPrice: {
        type: Number,
        default: 0
    },
    shippingPrice: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    totalProfit: {
        type: Number,
        default: 0
    },
    orderStatus: {
        type: String,
        required: true,
        default: "Processing"
    },
    orderId: {
        type: String,
        unique: true
    },
    deliveredAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to generate unique BMS Order ID
orderSchema.pre('save', async function (next) {
    if (!this.isNew) return next();

    try {
        const count = await this.constructor.countDocuments();
        const date = new Date();
        const year = date.getFullYear();
        // Format: BMS-YYYY-XXXX (e.g., BMS-2026-0001)
        // Pad with leading zeros up to 4 digits
        const sequence = (count + 1).toString().padStart(4, '0');
        this.orderId = `BMS-${year}-${sequence}`;
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Order', orderSchema);
