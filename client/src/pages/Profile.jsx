import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomer } from '../context/CustomerContext';
import { fetchCustomerOrders } from '../services/appsScript';
import { User, Phone, MapPin, ShoppingBag, Edit2, Save, X, Package, CheckCircle, Truck, Clock, XCircle } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

const statusConfig = {
    Pending:   { icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800' },
    Confirmed: { icon: CheckCircle,  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-800' },
    Delivered: { icon: Truck,        color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-200 dark:border-green-800' },
    Cancelled: { icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-800' },
};

function StatusBadge({ status }) {
    const cfg = statusConfig[status] || statusConfig.Pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            <Icon size={12} /> {status}
        </span>
    );
}

function Profile() {
    const { customer, updateProfile, loading, error, clearError } = useCustomer();
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', address: '' });
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        if (customer) {
            setForm({ name: customer.name || '', phone: customer.phone || '', address: customer.address || '' });
            loadOrders();
        }
    }, [customer]);

    const loadOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await fetchCustomerOrders(customer.id);
            // Parse items JSON string if needed
            const parsed = (data.orders || []).map(o => ({
                ...o,
                items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
            }));
            setOrders(parsed.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (e) {
            console.error('Failed to load orders', e);
        } finally { setOrdersLoading(false); }
    };

    const handleSave = async () => {
        try {
            await updateProfile(form);
            setEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (e) { /* error shown from context */ }
    };

    const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

    return (
        <PageTransition>
            <div className="min-h-screen py-10 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gradient mb-8">My Profile</h1>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Profile Card */}
                        <div className="md:col-span-1">
                            <div className="glass-card rounded-2xl p-6">
                                {/* Avatar */}
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-white shadow-lg shadow-purple-500/30">
                                    {customer?.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <p className="text-center font-bold text-gray-900 dark:text-white text-lg">{customer?.name}</p>
                                <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-6">{customer?.email}</p>

                                <div className="space-y-4">
                                    {editing ? (
                                        <>
                                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                                            {[
                                                { f: 'name', label: 'Name', icon: User },
                                                { f: 'phone', label: 'Phone', icon: Phone },
                                                { f: 'address', label: 'Address', icon: MapPin, textarea: true },
                                            ].map(({ f, label, icon: Icon, textarea }) => (
                                                <div key={f}>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
                                                    {textarea ? (
                                                        <textarea value={form[f]} onChange={set(f)} rows={2} className="w-full px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                                                    ) : (
                                                        <div className="relative">
                                                            <Icon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                            <input value={form[f]} onChange={set(f)} className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="flex gap-2">
                                                <button onClick={handleSave} disabled={loading} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-1 hover:bg-purple-700 transition-colors disabled:opacity-60">
                                                    <Save size={13} /> Save
                                                </button>
                                                <button onClick={() => { setEditing(false); clearError(); }} className="py-2 px-3 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 hover:text-gray-700 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {saveSuccess && <p className="text-green-400 text-xs text-center">Profile updated ✓</p>}
                                            {[
                                                { icon: Phone, value: customer?.phone, label: 'Phone' },
                                                { icon: MapPin, value: customer?.address, label: 'Address' },
                                            ].map(({ icon: Icon, value, label }) => value ? (
                                                <div key={label} className="flex items-start gap-2.5">
                                                    <Icon size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                                                        <p className="text-sm text-gray-900 dark:text-white">{value}</p>
                                                    </div>
                                                </div>
                                            ) : null)}
                                            <button onClick={() => setEditing(true)} className="w-full py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium flex items-center justify-center gap-1.5 hover:border-purple-400 hover:text-purple-500 transition-all">
                                                <Edit2 size={13} /> Edit Profile
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Orders */}
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <ShoppingBag size={20} className="text-purple-500" /> Order History
                                <span className="ml-auto text-sm font-normal text-gray-400">{orders.length} orders</span>
                            </h2>

                            {ordersLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
                                            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
                                        </div>
                                    ))}
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="glass-card rounded-2xl p-12 text-center">
                                    <Package className="mx-auto mb-3 text-gray-300 dark:text-slate-600" size={48} />
                                    <p className="text-gray-400 dark:text-slate-500">No orders yet</p>
                                    <a href="/products" className="text-purple-500 hover:underline text-sm mt-1 block">Start shopping →</a>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {orders.map(order => (
                                        <motion.div
                                            key={order.orderId}
                                            layout
                                            className="glass-card rounded-xl overflow-hidden cursor-pointer hover:border-purple-400 transition-all"
                                            onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
                                        >
                                            <div className="p-4 flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <code className="text-xs font-bold text-purple-500">{order.orderId}</code>
                                                        <StatusBadge status={order.status || 'Pending'} />
                                                    </div>
                                                    <p className="text-xs text-gray-400 dark:text-slate-500">
                                                        {new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        {' · '}{Array.isArray(order.items) ? order.items.length : 0} item{order.items?.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex-shrink-0">
                                                    {fmt(order.totalPrice)}
                                                </span>
                                            </div>

                                            <AnimatePresence>
                                                {expandedOrder === order.orderId && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden border-t border-gray-200 dark:border-slate-700"
                                                    >
                                                        <div className="p-4 space-y-2">
                                                            {(order.items || []).map((item, i) => (
                                                                <div key={i} className="flex items-center gap-3">
                                                                    <img src={item.image || 'https://placehold.co/40x40/1a1a2e/c9a853?text=M'} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                                                    <div className="flex-1 text-sm">
                                                                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                                        <p className="text-xs text-gray-400">× {item.quantity}</p>
                                                                    </div>
                                                                    <p className="text-sm font-semibold text-purple-500">{fmt(item.price * item.quantity)}</p>
                                                                </div>
                                                            ))}
                                                            {order.address && (
                                                                <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                                                                    📍 {order.address}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

export default Profile;
