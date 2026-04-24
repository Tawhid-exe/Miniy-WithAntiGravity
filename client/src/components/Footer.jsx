import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, MessageCircle } from 'lucide-react';

function Footer() {
    const location = useLocation();

    // Hide footer on admin routes
    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white/10 dark:bg-black/20 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
                    
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-3 mb-6">
                            <img src="/logo.jpeg" alt="Minivy Logo" className="h-10 w-10 rounded-full border-2 border-purple-500/50" />
                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                                Minivy
                            </span>
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            Discover premium quality products curated just for you. We bring the best selections right to your doorstep with love and care.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 dark:hover:text-white transition-all transform hover:-translate-y-1">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 hover:bg-pink-600 hover:text-white dark:hover:bg-pink-500 dark:hover:text-white transition-all transform hover:-translate-y-1">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all transform hover:-translate-y-1">
                                <Twitter size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">Quick Links</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-0 transition-opacity"></span>
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/products" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-0 transition-opacity"></span>
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/cart" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-0 transition-opacity"></span>
                                    Cart
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-0 transition-opacity"></span>
                                    My Profile
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">Customer Service</h3>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">FAQ</a></li>
                            <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">Shipping & Returns</a></li>
                            <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">Privacy Policy</a></li>
                            <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">Terms of Service</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin size={18} className="text-purple-500 flex-shrink-0 mt-0.5" />
                                <span>123 Fashion Street, Suite 100<br/>Dhaka, Bangladesh</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Phone size={18} className="text-purple-500 flex-shrink-0" />
                                <span>+880 1600-015008</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <MessageCircle size={18} className="text-purple-500 flex-shrink-0" />
                                <span>WhatsApp Available</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Mail size={18} className="text-purple-500 flex-shrink-0" />
                                <span>support@minivy.com</span>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {currentYear} Minivy. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        Made with ❤️ by <span className="font-semibold text-gray-700 dark:text-gray-300">Maruf Hasan Tawhid</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
