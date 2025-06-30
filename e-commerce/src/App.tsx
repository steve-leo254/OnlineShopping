// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ShoppingCartProvider } from "./context/ShoppingCartContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EcommerceApp from "./apps/EcommerceApp";
import POSApp from "./apps/POSApp";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SuperAdminRegister from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import ModernEcommerceHomepage from "./pages/Home";
import CategoryProductsPage from "./components/CategoryPage";
import Layout from "./assets/Layout";

// AppSwitcher component for switching between E-Commerce and POS
const AppSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div style={{ display: "flex", gap: 8, margin: 16 }}>
      <button
        onClick={() => navigate("/")}
        style={{ fontWeight: location.pathname === "/" ? "bold" : "normal" }}
      >
        Home
      </button>
      <button
        onClick={() => navigate("/shop")}
        style={{
          fontWeight: location.pathname.startsWith("/shop") ? "bold" : "normal",
        }}
      >
        Shop
      </button>
      <button
        onClick={() => navigate("/pos")}
        style={{
          fontWeight: location.pathname.startsWith("/pos") ? "bold" : "normal",
        }}
      >
        POS
      </button>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "SUPERADMIN";

  return (
    <>
      {/* Only show AppSwitcher for admins */}
      {isAdmin && <AppSwitcher />}
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/SuperAdmin" element={<SuperAdminRegister />} />
        {/* Home page at root, wrapped in Layout for navbar/footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<ModernEcommerceHomepage />} />
        </Route>
        {/* Shop/Categories */}
        <Route path="/shop" element={<CategoryProductsPage />} />
        {/* All other e-commerce routes */}
        <Route path="/shop/*" element={<EcommerceApp />} />
        {/* POS (admin only, with role check) */}
        {isAdmin && <Route path="/pos/*" element={<POSApp />} />}
        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  // useEffect(() => {
  //   // Prevent Ctrl+A (select all)
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     // Prevent Ctrl+A
  //     if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
  //       e.preventDefault();
  //     }
  //     // Prevent Ctrl+U (view source)
  //     if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
  //       e.preventDefault();
  //     }
  //     // Prevent F12 (dev tools)
  //     if (e.key === "F12") {
  //       e.preventDefault();
  //     }
  //     // Prevent Ctrl+Shift+I (dev tools)
  //     if (
  //       (e.ctrlKey || e.metaKey) &&
  //       e.shiftKey &&
  //       e.key.toLowerCase() === "i"
  //     ) {
  //       e.preventDefault();
  //     }
  //     // Prevent Ctrl+Shift+C (dev tools)
  //     if (
  //       (e.ctrlKey || e.metaKey) &&
  //       e.shiftKey &&
  //       e.key.toLowerCase() === "c"
  //     ) {
  //       e.preventDefault();
  //     }
  //     // Prevent Ctrl+Shift+J (dev tools)
  //     if (
  //       (e.ctrlKey || e.metaKey) &&
  //       e.shiftKey &&
  //       e.key.toLowerCase() === "j"
  //     ) {
  //       e.preventDefault();
  //     }
  //   };
  //   // Prevent right-click context menu
  //   const handleContextMenu = (e: MouseEvent) => {
  //     e.preventDefault();
  //   };
  //   document.addEventListener("keydown", handleKeyDown);
  //   document.addEventListener("contextmenu", handleContextMenu);
  //   return () => {
  //     document.removeEventListener("keydown", handleKeyDown);
  //     document.removeEventListener("contextmenu", handleContextMenu);
  //   };
  // }, []);

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
            <AppContent />
          </Router>
        </ShoppingCartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
