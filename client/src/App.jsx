import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen transition-colors duration-300">
              <Navbar />
              <div className="pt-20">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="products" element={<div className="p-10">Products Manager (Coming Soon)</div>} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="customers" element={<CustomerDirectory />} />
                    <Route path="inventory" element={<InventoryAudit />} />
                  </Route>
                </Routes>
              </div>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

