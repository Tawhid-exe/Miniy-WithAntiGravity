import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import PageTransition from '../components/PageTransition';

function Cart() {
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    if (cartItems.length === 0) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-light-bg dark:bg-dark flex items-center justify-center px-4 transition-colors duration-300">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <ShoppingBag className="mx-auto mb-4 text-gray-400 dark:text-slate-600" size={80} />
                        <h1 className="text-4xl font-bold text-light-text dark:text-light mb-4">Your Cart is Empty</h1>
                        <p className="text-light-text-muted dark:text-slate-400 mb-8">Add some amazing products to get started!</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-gradient-to-r from-light-primary to-light-secondary dark:from-primary dark:to-secondary !text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
                        >
                            Shop Now
                        </button>
                    </motion.div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-light-bg dark:bg-dark py-12 px-4 transition-colors duration-300">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex items-center justify-between"
                    >
                        <h1 className="text-4xl font-bold text-gradient">Shopping Cart</h1>

                        <button
                            onClick={() => setShowClearConfirm(true)}
                            className="px-4 py-2 rounded-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
                        >
                            Clear Cart
                        </button>
                    </motion.div>

                    {/* Clear Cart Confirmation Modal */}
                    <AnimatePresence>
                        {showClearConfirm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowClearConfirm(false)}
                                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full text-center"
                                >
                                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
                                        <Trash2 size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Clear Cart?</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                                        Are you sure you want to remove all items from your cart? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => setShowClearConfirm(false)}
                                            className="px-5 py-2 rounded-full font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                clearCart();
                                                setShowClearConfirm(false);
                                            }}
                                            className="px-5 py-2 rounded-full font-medium text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
                                        >
                                            Yes, Clear It
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>


                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="md:col-span-2 space-y-4">
                            <AnimatePresence mode="popLayout">
                                {cartItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 200, scale: 0.5, transition: { duration: 0.3 } }}
                                        className="bg-white/90 dark:bg-black/20 backdrop-blur-md border border-slate-200 dark:border-white/5 shadow-lg rounded-2xl p-4 flex gap-4"
                                    >
                                        {/* Product Image */}
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-24 h-24 object-cover rounded-xl"
                                        />

                                        {/* Product Info */}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-light-text dark:text-light mb-1">{item.name}</h3>
                                            <p className="text-light-text-muted dark:text-slate-400 text-sm mb-2">{item.category}</p>
                                            <p className="text-light-primary dark:text-primary font-bold">${item.price}</p>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex flex-col items-end justify-between">
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <div className="flex items-center gap-2 bg-white/50 dark:bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 border border-slate-200 dark:border-white/10">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="text-light-text dark:text-light font-bold w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card rounded-2xl p-6 h-fit sticky top-4"
                        >
                            <h2 className="text-2xl font-bold text-light-text dark:text-light mb-6">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-light-text dark:text-slate-300">
                                    <span>Subtotal</span>
                                    <span>${getCartTotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-light-text dark:text-slate-300">
                                    <span>Shipping</span>
                                    <span className="text-green-500">Free</span>
                                </div>
                                <div className="border-t border-gray-300 dark:border-slate-700 pt-3 flex justify-between text-xl font-bold text-light-text dark:text-light">
                                    <span>Total</span>
                                    <span className="text-gradient">${getCartTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <button className="w-full bg-gradient-to-r from-light-primary to-light-secondary dark:from-primary dark:to-secondary !text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all mb-3">
                                Checkout
                            </button>

                            <button
                                onClick={() => navigate('/products')}
                                className="w-full glass text-light-text dark:text-slate-300 hover:text-light-primary dark:hover:text-white py-3 rounded-full font-semibold transition-all"
                            >
                                Continue Shopping
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

export default Cart;
