import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminGetOrders, adminUpdateOrderStatus } from '../../services/appsScript';
import { Search, MapPin, Phone, User, Package, Calendar, Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const fmt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');

const statusConfig = {
    Pending:   { icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-800' },
    Confirmed: { icon: CheckCircle,  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-200 dark:border-blue-800' },
    Delivered: { icon: Truck,        color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-200 dark:border-green-800' },
    Cancelled: { icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-800' },
};

function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await adminGetOrders();
            const parsed = (data.orders || []).map(o => ({
                ...o,
                items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
            }));
            setOrders(parsed.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (e) {
            console.error('Failed to load orders', e);
        } finally { setLoading(false); }
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        const order = orders.find(o => o.orderId === orderId);
        if (!order) return;

        // Confirmation dialog for cancellations
        if (newStatus === 'Cancelled') {
            const confirmed = window.confirm(
                `Are you sure you want to cancel order ${orderId}?\n\nThis will restore the stock for all items in this order.`
            );
            if (!confirmed) return;
        }

        try {
            // Optimistic update
            setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
            await adminUpdateOrderStatus(orderId, newStatus, order.items);
            // Reload orders after cancellation to reflect restored stock
            if (newStatus === 'Cancelled') await loadOrders();
        } catch (e) {
            alert('Status update failed');
            loadOrders(); // revert
        }
    };

    const filtered = orders.filter(o => {
        const matchesSearch = (o.orderId + o.customerName + o.phone).toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((a, b) => a + parseFloat(b.totalPrice || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-gray-200 dark:border-white/10 backdrop-blur-md sm:col-span-2 flex flex-col justify-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Orders Management</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">View and update customer orders</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl text-white shadow-lg shadow-green-500/20 flex flex-col justify-center items-start">
                    <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold">{fmt(totalRevenue)}</p>
                    <p className="text-xs text-white/80 mt-1">From delivered orders only</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search by ID, name, or phone..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white shadow-sm"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {['All', 'Pending', 'Confirmed', 'Delivered', 'Cancelled'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                filterStatus === s 
                                    ? 'bg-purple-600 text-white shadow-md' 
                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Order List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading orders...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white/50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/5">
                        <Package size={48} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                        No orders found
                    </div>
                ) : (
                    filtered.map(order => {
                        const isExpanded = expandedOrder === order.orderId;
                        const cfg = statusConfig[order.status || 'Pending'];
                        const StatusIcon = cfg.icon;

                        return (
                            <div key={order.orderId} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                {/* Compact Summary (Click to expand) */}
                                <div 
                                    onClick={() => setExpandedOrder(isExpanded ? null : order.orderId)}
                                    className="p-5 flex flex-wrap sm:flex-nowrap items-center gap-4 cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                                        <Package size={24} />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 dark:text-white">{order.customerName}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${cfg.color} ${cfg.bg}`}>
                                                <StatusIcon size={12} /> {order.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-3">
                                            <span className="font-mono">{order.orderId}</span>
                                            <span className="hidden sm:inline flex items-center gap-1"><Calendar size={12}/> {new Date(order.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right ml-auto mr-4">
                                        <div className="font-bold text-lg text-gray-900 dark:text-white">{fmt(order.totalPrice)}</div>
                                        <div className="text-xs text-gray-500">{order.items?.length || 0} items</div>
                                    </div>
                                    
                                    <div className="text-gray-400">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50"
                                        >
                                            <div className="p-5 grid md:grid-cols-2 gap-6">
                                                {/* Customer Info */}
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Details</h3>
                                                    <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300">
                                                        <User size={16} className="text-purple-500 mt-0.5" />
                                                        <div>{order.customerName}</div>
                                                    </div>
                                                    <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300">
                                                        <Phone size={16} className="text-purple-500 mt-0.5" />
                                                        <div>{order.phone}</div>
                                                    </div>
                                                    <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300">
                                                        <MapPin size={16} className="text-purple-500 mt-0.5" />
                                                        <div>{order.address}</div>
                                                    </div>
                                                    {order.notes && (
                                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm border border-yellow-200 dark:border-yellow-800/30">
                                                            <span className="font-bold text-yellow-800 dark:text-yellow-500">Note:</span> {order.notes}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Order Items & Actions */}
                                                <div>
                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Items</h3>
                                                    <div className="space-y-3 mb-6">
                                                        {(order.items || []).map((item, i) => (
                                                            <div key={i} className="flex gap-3 items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-100 dark:border-slate-700">
                                                                <img src={item.image || 'https://placehold.co/40'} className="w-12 h-12 rounded-lg object-cover" alt="" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</div>
                                                                    <div className="text-xs text-gray-500">Qty: {item.quantity} × {fmt(item.price)}</div>
                                                                </div>
                                                                <div className="font-bold text-sm text-purple-600 dark:text-purple-400 pr-2">
                                                                    {fmt(item.price * item.quantity)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Update Status</h3>
                                                    <select 
                                                        value={order.status || 'Pending'}
                                                        onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                                                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                                                    >
                                                        <option value="Pending">Pending (Awaiting Confirmation)</option>
                                                        <option value="Confirmed">Confirmed (Processing)</option>
                                                        <option value="Delivered">Delivered (Completed)</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default AdminOrders;
