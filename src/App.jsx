import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RiderDashboard from './pages/RiderDashboard';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute role="customer">
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/order-success/:code" element={<OrderSuccess />} />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute role="customer">
                <MyOrders />
              </ProtectedRoute>
            }
          />

          <Route path="/restaurant/signup" element={<SignupPage role="restaurant" />} />
          <Route path="/restaurant/login" element={<LoginPage role="restaurant" />} />
          <Route
            path="/restaurant/dashboard"
            element={
              <ProtectedRoute role="restaurant">
                <RestaurantDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/rider/signup" element={<SignupPage role="rider" />} />
          <Route path="/rider/login" element={<LoginPage role="rider" />} />
          <Route
            path="/rider/dashboard"
            element={
              <ProtectedRoute role="rider">
                <RiderDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
