import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CustomerProvider, useCustomer } from './context/CustomerContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import BackgroundBlobs from './components/BackgroundBlobs';
import Spotlight from './components/Spotlight';

// Customer pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';

// Admin pages
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';

// ── Protected route for customer profile ──────────────────────
function RequireAuth({ children }) {
    const { isLoggedIn } = useCustomer();
    return isLoggedIn ? children : <Navigate to="/auth?redirect=profile" replace />;
}

// ── Protected route for admin ─────────────────────────────────
function RequireAdmin({ children }) {
    const isAdmin = sessionStorage.getItem('miniy_admin') === 'true';
    return isAdmin ? children : <Navigate to="/admin/login" replace />;
}

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Customer */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/profile" element={
                    <RequireAuth><Profile /></RequireAuth>
                } />

                {/* Admin */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={
                    <RequireAdmin><AdminLayout /></RequireAdmin>
                }>
                    <Route index element={<Navigate to="products" replace />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="orders" element={<AdminOrders />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <ThemeProvider>
            <CustomerProvider>
                <CartProvider>
                    <Router>
                        <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-black relative overflow-hidden">
                            <Spotlight />
                            <BackgroundBlobs />
                            <Navbar />
                            <div className="pt-20 relative z-10">
                                <AnimatedRoutes />
                            </div>
                        </div>
                    </Router>
                </CartProvider>
            </CustomerProvider>
        </ThemeProvider>
    );
}

export default App;
