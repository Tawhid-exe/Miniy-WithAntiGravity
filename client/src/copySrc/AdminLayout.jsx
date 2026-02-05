import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { user } = useAuth();

    // Simple protection check, can be enhanced
    if (!user || user.role === 'user') {
        return <div className="p-10 text-center">Access Denied. Admins and Owners only.</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-md">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Panel</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {user.name}</p>
                </div>
                <nav className="mt-6">
                    <Link to="/admin/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-purple-500 hover:text-white text-gray-700 dark:text-gray-200">
                        Dashboard
                    </Link>
                    <Link to="/admin/products" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-purple-500 hover:text-white text-gray-700 dark:text-gray-200">
                        Products
                    </Link>
                    <Link to="/admin/orders" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-purple-500 hover:text-white text-gray-700 dark:text-gray-200">
                        Orders
                    </Link>
                    <Link to="/admin/customers" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-purple-500 hover:text-white text-gray-700 dark:text-gray-200">
                        Customers
                    </Link>
                    <Link to="/admin/inventory" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-purple-500 hover:text-white text-gray-700 dark:text-gray-200">
                        Inventory Audit
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
