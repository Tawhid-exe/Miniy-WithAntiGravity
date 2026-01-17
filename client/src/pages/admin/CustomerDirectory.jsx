import { useEffect, useState } from 'react';
import api from '../../api/axios';

const CustomerDirectory = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                // In a real app we would have a dedicated /admin/users endpoint
                // reusing admin dashboard data or creating a new endpoint
                // For now, let's mock it or assume we fetch orders and aggregate
                // Since I haven't implemented /admin/users endpoint, I'll create it now
                // Actually I should create the endpoint first.
                // But for now let's put a placeholder message or basic list if available
                // I'll implement the endpoint in the next step.
                const { data } = await api.get('/admin/users');
                if (data.success) {
                    setCustomers(data.users);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching customers", error);
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    if (loading) return <div className="p-10">Loading Customers...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Directory</h1>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {customers.map((customer) => (
                            <tr key={customer._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{customer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {customer.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(customer.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerDirectory;
