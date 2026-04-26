import { Link, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, MessageCircle } from 'lucide-react';

// Real WhatsApp SVG icon
function WhatsAppIcon({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

function Footer() {
    const location = useLocation();

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
                            <a href="#" className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white dark:hover:bg-green-500 dark:hover:text-white transition-all transform hover:-translate-y-1">
                                <WhatsAppIcon size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6">Quick Links</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/products" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/cart" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                                    Cart
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
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
                                <span>123 Fashion Street, Suite 100<br />Dhaka, Bangladesh</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Phone size={18} className="text-purple-500 flex-shrink-0" />
                                <span>+880 1700-000000</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <span className="text-green-500 flex-shrink-0"><WhatsAppIcon size={18} /></span>
                                <span>WhatsApp Available</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <Mail size={18} className="text-purple-500 flex-shrink-0" />
                                <span>support@minivy.com</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 flex items-center justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {currentYear} Minivy. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;