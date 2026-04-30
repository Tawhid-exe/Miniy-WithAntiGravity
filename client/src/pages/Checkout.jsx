import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCustomer } from '../context/CustomerContext';
import { CheckCircle, ChevronRight, ChevronLeft, ShoppingBag, User, MapPin, Phone, FileText, Copy } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

const steps = ['Contact', 'Delivery', 'Review'];

function StepIndicator({ current }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                        i < current ? 'bg-green-500 text-white'
                        : i === current ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}>
                        {i < current ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${i === current ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>{s}</span>
                    {i < steps.length - 1 && <div className={`w-8 h-px ${i < current ? 'bg-green-400' : 'bg-gray-200 dark:bg-slate-700'}`} />}
                </div>
            ))}
        </div>
    );
}

function Checkout() {
    const navigate = useNavigate();
    const { cartItems, getCartTotal, checkout } = useCart();
    const { customer } = useCustomer();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const cartTotal = getCartTotal();
    const shippingFee = cartTotal > 2000 ? 0 : 80;
    const grandTotal = cartTotal + shippingFee;

    const [form, setForm] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        notes: '',
    });

    if (cartItems.length === 0 && !orderId) {
        navigate('/cart');
        return null;
    }

    const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

    const next = () => {
        if (step === 0 && (!form.name || !form.phone)) { setError('Name and phone are required.'); return; }
        if (step === 1 && !form.address) { setError('Delivery address is required.'); return; }
        setError('');
        setStep(s => s + 1);
    };

    const submit = async () => {
        setLoading(true); setError('');
        try {
            const result = await checkout({
                customerId: customer?.id || '',
                customerName: form.name,
                phone: form.phone,
                address: form.address,
                notes: form.notes,
            });
            setOrderId(result.orderId);
        } catch (e) {
            setError(e.message || 'Order failed. Please try again.');
        } finally { setLoading(false); }
    };

    const copyOrderId = () => {
        navigator.clipboard.writeText(orderId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── SUCCESS ──
    if (orderId) {
        return (
            <PageTransition>
                <div className="min-h-screen flex items-center justify-center px-4 py-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border-2 border-green-400"
                        >
                            <CheckCircle className="text-green-400" size={40} />
                        </motion.div>

                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Requested! ✦</h1>
                        <p className="text-gray-500 dark:text-slate-400 mb-8">We'll contact you soon on <strong className="text-purple-500">{form.phone}</strong> to confirm your order.</p>

                        <div className="glass-card rounded-2xl p-6 mb-6 text-left">
                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Your Order ID</p>
                            <div className="flex items-center gap-3">
                                <code className="flex-1 text-purple-600 dark:text-purple-400 font-bold text-lg tracking-wider">{orderId}</code>
                                <button onClick={copyOrderId} className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 transition-colors">
                                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">📸 Screenshot this for your reference</p>
                        </div>

                        <div className="glass-card rounded-2xl p-4 mb-6 text-left">
                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Delivery to</p>
                            <p className="text-sm text-gray-700 dark:text-slate-300">{form.address}</p>
                        </div>

                        <button
                            onClick={() => navigate('/products')}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-lg transition-all"
                        >
                            Continue Shopping
                        </button>
                    </motion.div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen py-10 px-4">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-gradient text-center mb-2">Checkout</h1>
                    <p className="text-center text-gray-500 dark:text-slate-400 text-sm mb-6">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · Total {fmt(cartTotal)}</p>

                    <StepIndicator current={step} />

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="glass-card rounded-3xl p-8"
                        >
                            {/* Step 0 — Contact */}
                            {step === 0 && (
                                <div className="space-y-5">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><User size={18} className="text-purple-500" /> Contact Info</h2>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                                        <input value={form.name} onChange={set('name')} placeholder="Your name" className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Phone / WhatsApp *</label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input value={form.phone} onChange={set('phone')} placeholder="+880 1XXX-XXXXXX" className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 1 — Delivery */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><MapPin size={18} className="text-purple-500" /> Delivery Address</h2>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Address *</label>
                                        <textarea value={form.address} onChange={set('address')} placeholder="House/Flat, Road, Area, City..." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Order Notes (optional)</label>
                                        <div className="relative">
                                            <FileText size={14} className="absolute left-3.5 top-3 text-gray-400" />
                                            <textarea value={form.notes} onChange={set('notes')} placeholder="Any special requests..." rows={2} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2 — Review */}
                            {step === 2 && (
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5"><ShoppingBag size={18} className="text-purple-500" /> Review Order</h2>
                                    <div className="space-y-3 mb-5">
                                        {cartItems.map(item => {
                                            const price = item.isOnSale ? (item.salePrice || item.price) : item.price;
                                            return (
                                                <div key={item.id} className="flex items-center gap-3">
                                                    <img src={item.images?.[0] || 'https://placehold.co/48x48/1a1a2e/c9a853?text=M'} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</p>
                                                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-bold text-purple-600 dark:text-purple-400 text-sm">{fmt(price * item.quantity)}</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-2 text-sm mb-5">
                                        <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>Items Total</span><span className="font-medium">{fmt(cartTotal)}</span></div>
                                        <div className="flex justify-between text-gray-600 dark:text-slate-300">
                                            <span>Delivery</span>
                                            <span className="font-medium">
                                                {shippingFee === 0 ? <span className="text-green-500 font-bold">Free</span> : fmt(shippingFee)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
                                            <span>Grand Total</span>
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{fmt(grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Nav buttons */}
                    <div className="mt-6 flex flex-col gap-3">
                        <div className="flex gap-3">
                            {step > 0 && (
                                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-6 py-3 rounded-xl glass border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-white font-semibold text-sm transition-all hover:border-purple-400">
                                    <ChevronLeft size={16} /> Back
                                </button>
                            )}
                            {step < 2 ? (
                                <button onClick={next} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all">
                                    Continue <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button onClick={submit} disabled={loading} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-60">
                                    {loading ? 'Placing order...' : 'Place Order ✦'}
                                </button>
                            )}
                        </div>
                        {step === 2 && !customer && (
                            <p className="text-xs text-center text-gray-500 dark:text-slate-400 mt-2">
                                Want to track your order and access past purchase history? <button onClick={() => navigate('/login')} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Please Log In or Sign Up.</button>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

export default Checkout;
