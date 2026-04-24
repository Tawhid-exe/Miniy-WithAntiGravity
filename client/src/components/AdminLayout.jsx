import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, LogOut, Shield, Home } from 'lucide-react';

function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/admin/products', icon: Package, label: 'Products' },
        { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    ];

    const handleLogout = () => {
        sessionStorage.removeItem('miniy_admin');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black pt-6 px-4 pb-12">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
                
                {/* Sidebar */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="glass-card rounded-2xl p-5 sticky top-24">
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center shadow-lg">
                                <Shield className="text-white dark:text-gray-900" size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 dark:text-white leading-tight">Admin Console</h2>
                                <p className="text-xs text-green-500 font-semibold bg-green-500/10 inline-block px-2 rounded-full mt-0.5">Connected</p>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            {menuItems.map(item => {
                                const isActive = location.pathname.startsWith(item.path);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                            isActive
                                                ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-md shadow-purple-500/20'
                                                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </Link>
                                );
                            })}

                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-800">
                                <Link
                                    to="/"
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors mb-2"
                                >
                                    <Home size={18} />
                                    Back to Store
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
