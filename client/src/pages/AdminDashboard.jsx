import { useEffect, useState } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        ordersCount: 0,
        productsCount: 0,
        usersCount: 0,
        totalProfit: 0,
        lowStockProducts: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/admin/dashboard');
                if (data.success) {
                    setStats(data);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching stats", error);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-10">Loading Stats...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase">Total Revenue</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase">Total Profit</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalProfit.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase">Orders</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.ordersCount}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase">Stock Alerts</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowStockProducts.length}</p>
                </div>
            </div>

            {/* Detailed Low Stock View */}
            {stats.lowStockProducts.length > 0 && (
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-red-500">Low Stock Alert</h3>
                    </div>
                    <div className="p-6">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {stats.lowStockProducts.map(prod => (
                                <li key={prod._id} className="py-3 flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">{prod.name}</span>
                                    <span className="text-red-500 font-bold">{prod.stock} left</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
