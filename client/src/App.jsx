import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import AuthPage from './pages/AuthPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDirectory from './pages/admin/CustomerDirectory';
import InventoryAudit from './pages/admin/InventoryAudit';
import AdminOrders from './pages/admin/Orders';

import BackgroundBlobs from './components/BackgroundBlobs';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-black relative overflow-hidden">
              <BackgroundBlobs />
              <Navbar />
              <div className="pt-20 relative z-10">
                <AnimatedRoutes />
              </div>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />

        {/* Admin Routes - keeping them simple for now */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<div className="p-10">Products Manager (Coming Soon)</div>} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<CustomerDirectory />} />
          <Route path="inventory" element={<InventoryAudit />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
