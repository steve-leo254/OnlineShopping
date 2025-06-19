// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import Home from "./pages/Home";
import Layout from "./assets/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Product";
import Store from "./pages/Store";
import ShoppingCart from "./pages/ShoppingCart";
import Checkout from "./pages/Checkout";
import OrderDetails from "./pages/OrderDetails";
import OrdersOverview from "./pages/OrdersOverview";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ShoppingCartProvider } from "./context/ShoppingCartContext";
import OrdersManagement from "./pages/OrderManagement";
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/AboutUs";
import AccountProfile from "./pages/MyProfile";
import SuperAdminDashboard from "./pages/AdminPage";
import SuperAdminRegister from "./pages/SuperAdmin";
import AddressBook from "./components/AddressBook";
import ProductDetail from "./components/Productsdetail";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./assets/PrivateRoutes";

function App() {
  return (
    <AuthProvider>
      <ShoppingCartProvider>
        <Router>
          <ToastContainer
            position="top-left"
            autoClose={3000}
            hideProgressBar={true}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            progressClassName="toast-progress-bar"
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/SuperAdmin" element={<SuperAdminRegister />} />

            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/store" element={<Store />} />
              <Route path="/shopping-cart" element={<ShoppingCart />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/products" element={<Products />} />
                <Route path="/AdminPage" element={<SuperAdminDashboard />} />
                <Route path="/checkout" element={<Checkout />} />

                <Route
                  path="/order-details/:orderId"
                  element={<OrderDetails />}
                />
                <Route path="/productdetail" element={<ProductDetail />} />
                <Route path="/orders-overview" element={<OrdersOverview />} />
                <Route
                  path="/orders-management"
                  element={<OrdersManagement />}
                />

                <Route path="/MyProfile" element={<AccountProfile />} />
                <Route path="/address-book" element={<AddressBook />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </ShoppingCartProvider>
    </AuthProvider>
  );
}

export default App;
