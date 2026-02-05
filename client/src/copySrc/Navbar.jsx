import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Home, Package, User, LogIn, LayoutDashboard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

function Navbar() {
    const location = useLocation();
    const { getCartCount } = useCart();
    const { isAuthenticated, user, logout } = useAuth();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/products', icon: Package, label: 'Products' },
        { path: '/cart', icon: ShoppingCart, label: 'Cart', badge: getCartCount() }
    ];

    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'owner')) {
        navItems.push({ path: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin' });
    }

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 glass !rounded-none !border-x-0 !border-t-0 shadow-lg"
        >
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <img
                            src="/logo.jpeg"
                            alt="Minivy"
                            className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover border-2 border-primary/50"
                        />
                        <span className="text-xl md:text-2xl font-bold text-gradient hidden sm:block">
                            Minivy
                        </span>
                    </Link>

                    {/* Navigation Links + Theme Toggle */}
                    <div className="flex items-center gap-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="relative"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`
                                            flex items-center gap-2 px-4 py-2 rounded-full transition-all
                                            ${isActive
                                                ? 'bg-gradient-to-r from-primary to-secondary !text-white shadow-lg'
                                                : 'glass-button'
                                            }
                                        `}
                                    >
                                        <Icon size={20} />
                                        <span className="hidden sm:inline font-medium">{item.label}</span>
                                        {item.badge > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-2 -right-2 bg-secondary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md"
                                            >
                                                {item.badge}
                                            </motion.span>
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}

                        {/* Auth Buttons */}
                        {isAuthenticated ? (
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={logout}
                                onClick={logout}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full glass-button transition-all"
                            >
                                <User size={20} />
                                <span className="hidden sm:inline font-medium">Logout</span>
                            </motion.div>
                        ) : (
                            <Link to="/auth">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-md"
                                >
                                    <LogIn size={20} />
                                    <span className="hidden sm:inline font-medium">Login</span>
                                </motion.div>
                            </Link>
                        )}

                        {/* Animated Theme Toggle */}
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}

export default Navbar;
