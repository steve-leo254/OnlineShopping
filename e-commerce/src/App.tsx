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

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ShoppingCartProvider } from "./context/ShoppingCartContext";

import { FavoritesProvider } from "./context/FavoritesContext";

import EcommerceApp from "./apps/EcommerceApp";
import POSApp from "./apps/POSApp";

// AppSwitcher component for switching between E-Commerce and POS
const AppSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div style={{ display: "flex", gap: 8, margin: 16 }}>
      <button
        onClick={() => navigate("/shop")}
        style={{
          fontWeight: location.pathname.startsWith("/shop") ? "bold" : "normal",
        }}
      >
        E-Commerce
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
            <AppSwitcher />
            <Routes>
              <Route path="/shop/*" element={<EcommerceApp />} />
              <Route path="/pos/*" element={<POSApp />} />
              <Route path="/" element={<Navigate to="/shop" replace />} />
            </Routes>
          </Router>
        </ShoppingCartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;
