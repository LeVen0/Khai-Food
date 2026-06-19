import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Promotions from './pages/Promotions';
import About from './pages/About';
import ProductDetail from './pages/ProductDetail';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPromoCodes from './pages/admin/AdminPromoCodes';
import Vacancies from './pages/Vacancies';
import Partners from './pages/Partners';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      {children}
      <Footer />
    </>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders"    element={<AdminOrders />} />
          <Route path="products"  element={<AdminProducts />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="promo"     element={<AdminPromoCodes />} />
        </Route>
      </Routes>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/"              element={<Home />} />
              <Route path="/menu"          element={<Menu />} />
              <Route path="/login"         element={<Login />} />
              <Route path="/register"      element={<Register />} />
              <Route path="/profile"       element={<Profile />} />
              <Route path="/checkout"      element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/promotions"    element={<Promotions />} />
              <Route path="/about"         element={<About />} />
              <Route path="/vacancies"     element={<Vacancies />} />
              <Route path="/partners"      element={<Partners />} />
              <Route path="/product/:id"   element={<ProductDetail />} />
            </Routes>
          </Layout>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
