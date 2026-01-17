const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please enter product description']
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price'],
        min: [0, 'Price cannot be negative']
    },
    images: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    category: {
        type: String,
        required: [true, 'Please enter product category']
    },
    stock: {
        type: Number,
        required: [true, 'Please enter product stock'],
        default: 1
    },
    costPrice: {
        type: Number,
        required: [true, 'Please enter product cost price']
    },
    sku: {
        type: String,
        unique: true,
        required: [true, 'Please enter product SKU']
    },
    lowStockThreshold: {
        type: Number,
        default: 5
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    discountPrice: {
        type: Number,
        default: 0
    },
    isOnSale: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
