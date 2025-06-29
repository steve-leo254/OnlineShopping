// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import ProductDetail from "./pages/Productsdetail";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./assets/PrivateRoutes";
import ReviewPage from "./pages/pending-views";
import WishList from "./pages/WishList";
import TermsAndConditions from "./pages/Terms&Condition";
import { FavoritesProvider } from "./context/FavoritesContext";
import ModernEcommerceHomepage from "./pages/Home";
import CategoryProductsPage from "./components/CategoryPage";
import CategoryManagement from "./pages/CategoryManagement";
import BannerManagement from "./pages/BannerManagement";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Prevent Ctrl+A (select all)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+A
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
      }
      // Prevent Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
      }
      // Prevent F12 (dev tools)
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+I (dev tools)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "i"
      ) {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+C (dev tools)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "c"
      ) {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+J (dev tools)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "j"
      ) {
        e.preventDefault();
      }
    };
    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <AuthProvider>
      <FavoritesProvider>
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
              <Route path="/termsconditions" element={<TermsAndConditions />} />

              <Route element={<Layout />}>
                <Route index element={<ModernEcommerceHomepage />} />
                <Route path="/shop" element={<CategoryProductsPage />} />
                <Route
                  path="/category/:categoryName"
                  element={<CategoryProductsPage />}
                />
               
                <Route
                  path="/product-details/:id"
                  element={<ProductDetail />}
                />
                <Route path="/store" element={<Store />} />
                <Route path="/shopping-cart" element={<ShoppingCart />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route
                    path="/category-management"
                    element={<CategoryManagement />}
                  />
                  <Route
                    path="/banner-management"
                    element={<BannerManagement />}
                  />
                  <Route path="/pending-reviews" element={<ReviewPage />} />
                  <Route path="/wishlist" element={<WishList />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/AdminPage" element={<SuperAdminDashboard />} />
                  <Route path="/checkout" element={<Checkout />} />

                  <Route
                    path="/order-details/:orderId"
                    element={<OrderDetails />}
                  />

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
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
