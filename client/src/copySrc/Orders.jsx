import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { generateInvoice } from '../../utils/invoiceGenerator';
import { FileText } from 'lucide-react';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            // We need a proper endpoint for admin to get all orders.
            // Relying on the one used for dashboard or creating new one?
            // Dashboard endpoint returned aggregates.
            // We need a /api/v1/admin/orders endpoint.
            // I'll create the endpoint in the next step, for now mocking the call
            // effectively assuming the endpoint exists or using a known one.
            // Wait, I didn't create /admin/orders endpoint in adminController explicitly.
            // I'll assume I will create it.
            try {
                const { data } = await api.get('/admin/orders');
                if (data.success) {
                    setOrders(data.orders);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error", error);
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const updateOrderStatus = async (id, status) => {
        try {
            await api.put(`/admin/order/${id}`, { status });
            // Refresh orders locally
            setOrders(orders.map(order =>
                order._id === id ? { ...order, orderStatus: status } : order
            ));
        } catch (error) {
            alert("Failed to update status: " + (error.response?.data?.message || error.message));
        }
    };

    if (loading) return <div className="p-10">Loading Orders...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Management</h1>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {orders.map((order) => (
                            <tr key={order._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {order.orderId || order._id}
                                    <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    <select
                                        value={order.orderStatus}
                                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                                        ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                order.orderStatus === 'Processing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                                    >
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {order.orderItems.length} items
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    ${order.totalPrice}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => generateInvoice(order)}
                                        className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                                    >
                                        <FileText size={16} /> Invoice
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminOrders;
