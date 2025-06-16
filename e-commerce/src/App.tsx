import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; 
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
import { ShoppingCartProvider } from "./context/ShoppingCartContext";
import OrdersManagement from "./pages/OrderManagement";
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/AboutUs";
import AccountProfile from "./pages/MyProfile";
import SuperAdminDashboard from "./pages/AdminPage";
import SuperAdminRegister from "./pages/SuperAdmin";
import AddressBook from "./components/AddressBook";
import ProductDetail from "./components/Productsdetail";




function App() {
  return (
    <AuthProvider>
      <ShoppingCartProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* <Route element={<ProtectedRoute />}> */}
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/store" element={<Store />} />
              <Route path="/AdminPage" element={<SuperAdminDashboard />} />
              <Route path="/shopping-cart" element={<ShoppingCart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route
                path="/order-details/:orderId"
                element={<OrderDetails />}
              />
              <Route path="/productdetail" element={<ProductDetail />} />
              <Route path="/orders-overview" element={<OrdersOverview />} />
              <Route path="/orders-management" element={<OrdersManagement />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/SuperAdmin" element={<SuperAdminRegister />} />
              <Route path="/MyProfile" element={<AccountProfile />} />
              <Route path="/address-book" element={<AddressBook />} />
            </Route>
            {/* </Route> */}
          </Routes>
        </Router>
      </ShoppingCartProvider>
    </AuthProvider>
  );
}

export default App;