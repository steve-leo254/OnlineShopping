import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CartDropdown from "./CartDropdown";
import { useShoppingCart } from "../context/ShoppingCartContext";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Heart, ChevronDown, X, Menu } from "lucide-react";
import { useUserStats } from "../context/UserStatsContext";
import { useFavorites } from "../context/FavoritesContext";

declare global {
  interface Window {
    initFlowbite?: () => void;
  }
}

// Define types for categories
type Category = {
  id: number;
  name: string;
  description: string | null;
};

// Define the component as a React Functional Component (React.FC) for TypeScript compliance
const Bar: React.FC = () => {
  const { isAuthenticated, logout, role, token } = useAuth();
  const { cartQuantity } = useShoppingCart();
  const { pendingReviewsCount, activeOrdersCount } = useUserStats();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  // State for mobile navigation
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isMobileShopDropdownOpen, setIsMobileShopDropdownOpen] =
    useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Initialize Flowbite (if available) on component mount
  useEffect(() => {
    if (window.initFlowbite) {
      window.initFlowbite();
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<Category[]>(
          `${import.meta.env.VITE_API_BASE_URL}/public/categories`
        );
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsMobileShopDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }
    let isMounted = true;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    let currentUser: { id: number; name: string } | null = null;
    try {
      const decoded: any = jwtDecode(token);
      currentUser = { id: decoded.id, name: decoded.sub };
    } catch {
      currentUser = null;
    }
    if (!currentUser) return;
    const fetchPendingReviewsCount = async () => {
      try {
        const orderRes = await axios.get(`${API_BASE_URL}/orders`, {
          params: { limit: 100, status: "delivered" },
          headers: { Authorization: `Bearer ${token}` },
        });
        const deliveredOrders = orderRes.data.items || [];
        let count = 0;
        deliveredOrders.forEach((order: any) => {
          if (!order.order_details) return;
          order.order_details.forEach((detail: any) => {
            const product = detail.product;
            const alreadyReviewed = (product.reviews || []).some(
              (rev: any) =>
                rev.user_id === currentUser!.id &&
                rev.order_id === order.order_id
            );
            if (!alreadyReviewed) {
              count++;
            }
          });
        });
      } catch {
        // If there's an error, set pendingReviewsCount to 0
      }
    };
    const fetchActiveOrdersCount = async () => {
      try {
        // Fetch pending orders
        const pendingRes = await axios.get(`${API_BASE_URL}/orders`, {
          params: { limit: 100, status: "pending" },
          headers: { Authorization: `Bearer ${token}` },
        });
        // Fetch processing orders
        const processingRes = await axios.get(`${API_BASE_URL}/orders`, {
          params: { limit: 100, status: "processing" },
          headers: { Authorization: `Bearer ${token}` },
        });
        const pendingOrders = pendingRes.data.items || [];
        const processingOrders = processingRes.data.items || [];
        const count = pendingOrders.length + processingOrders.length;
      } catch {
        // If there's an error, set activeOrdersCount to 0
      }
    };
    fetchPendingReviewsCount();
    fetchActiveOrdersCount();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token]);

  // Handle logout functionality
  const handleLogout = () => {
    logout();
    localStorage.clear();
    window.location.href = "/login";
  };

  // Handle category navigation
  const handleCategoryClick = (categoryName: string) => {
    const categoryPath = categoryName.toLowerCase().replace(/\s+/g, "-");
    navigate(`/category/${categoryPath}`, {
      state: { categoryName },
      replace: true,
    });
  };

  // Handle shop navigation (goes to all categories)
  const handleShopClick = () => {
    navigate("/shop", { replace: true });
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center space-x-3">
                  <img
                    className="h-10 w-auto transition-transform duration-200 hover:scale-105"
                    src="/logomoto.png"
                    alt="Flowtechs Logo"
                  />
                  <span className="hidden sm:inline text-xl md:text-2xl font-semibold whitespace-nowrap text-white">
                    FlowTech
                  </span>
                </Link>
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  <Link
                    to="/"
                    className="relative text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-200 group"
                  >
                    Home
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                  </Link>

                  {/* Shop Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                      }
                      className="relative text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-200 group flex items-center gap-1"
                    >
                      Shop
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isCategoryDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                    </button>

                    {/* Category Dropdown */}
                    {isCategoryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2">
                          <button
                            onClick={handleShopClick}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200 font-medium"
                          >
                            All Categories
                          </button>
                        </div>
                        <div className="border-t border-gray-100 my-2"></div>
                        {categories.map((category) => (
                          <div key={category.id} className="px-4 py-1">
                            <button
                              onClick={() => handleCategoryClick(category.name)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                            >
                              {category.name}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to="/about"
                    className="relative text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-200 group"
                  >
                    About Us
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Section - Cart, Account, Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <div className="relative">
                <button
                  id="myCartDropdownButton1"
                  data-dropdown-toggle="myCartDropdown1"
                  type="button"
                  className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                >
                  <span className="sr-only">Shopping Cart</span>
                  <svg
                    className="w-6 h-6 transition-transform duration-200 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13l-1.1 5m0 0h12M6 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z"
                    />
                  </svg>
                  {cartQuantity > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
                      {cartQuantity > 99 ? "99+" : cartQuantity}
                    </span>
                  )}
                </button>
                <CartDropdown />
              </div>

              {/* User Authentication Section */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    id="userDropdownButton1"
                    data-dropdown-toggle="userDropdown1"
                    type="button"
                    className="flex items-center space-x-2 p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/30 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      Account
                    </span>
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <div
                    id="userDropdown1"
                    className="hidden absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                  >
                    <div className="py-2">
                      <Link
                        to="/MyProfile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        My Account
                      </Link>
                      <Link
                        to="/orders-overview"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 relative"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2"
                          />
                        </svg>
                        My Orders
                        {activeOrdersCount > 0 && (
                          <span className="absolute left-5 -top-1 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse shadow-lg">
                            {activeOrdersCount > 99 ? "99+" : activeOrdersCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/address-book"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Address Book
                      </Link>
                      <Link
                        to="/pending-reviews"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 relative"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2h2m6-4v4m0 0l-2-2m2 2l2-2"
                          />
                        </svg>
                        Pending Reviews
                        {pendingReviewsCount > 0 && (
                          <span className="absolute left-5 -top-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse shadow-lg">
                            {pendingReviewsCount > 99
                              ? "99+"
                              : pendingReviewsCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/wishlist"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors duration-200 relative"
                      >
                        <Heart className="w-4 h-4 mr-3 text-pink-500" />
                        Wishlist
                        {favorites.size > 0 && (
                          <span className="absolute left-5 -top-1 bg-pink-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse shadow-lg">
                            {favorites.size > 99 ? "99+" : favorites.size}
                          </span>
                        )}
                      </Link>
                      {(role === "admin" || role === "SUPERADMIN") && (
                        <>
                          <div className="border-t border-gray-100 my-2"></div>
                          <Link
                            to="/products"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                            Products
                          </Link>
                          <Link
                            to="/Orders-management"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            All Orders
                          </Link>
                          <Link
                            to="/category-management"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            Category Management
                          </Link>
                          <Link
                            to="/banner-management"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Banner Management
                          </Link>
                        </>
                      )}
                      {role === "SUPERADMIN" && (
                        <Link
                          to="/AdminPage"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200"
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        id="logoutButton"
                        data-modal-target="logoutModal"
                        data-modal-toggle="logoutModal"
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md border border-white/20"
                >
                  <svg
                    className="w-4 h-4 md:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden md:inline">Sign In</span>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white/10 backdrop-blur border-t border-white/20 rounded-lg mt-2 mx-4 mb-2">
              <div className="space-y-2 p-4">
                <Link
                  to="/"
                  className="block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>

                {/* Mobile Shop Dropdown */}
                <div className="border-t border-white/20 pt-2">
                  <button
                    onClick={() =>
                      setIsMobileShopDropdownOpen(!isMobileShopDropdownOpen)
                    }
                    className="flex items-center justify-between w-full px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                  >
                    <span className="text-white/70 text-sm font-medium">
                      Shop
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isMobileShopDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Mobile Shop Dropdown Content */}
                  {isMobileShopDropdownOpen && (
                    <div className="ml-4 mt-2 space-y-1">
                      <button
                        onClick={() => {
                          handleShopClick();
                          setIsMobileMenuOpen(false);
                          setIsMobileShopDropdownOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 text-sm"
                      >
                        All Categories
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            handleCategoryClick(category.name);
                            setIsMobileMenuOpen(false);
                            setIsMobileShopDropdownOpen(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 text-sm"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to="/about"
                  className="block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About Us
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Modal */}
      <div
        id="logoutModal"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto p-6 transform transition-all">
          {/* Close Button */}
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
            data-modal-toggle="logoutModal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="sr-only">Close modal</span>
          </button>

          {/* Modal Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Leave?
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-8">
              Your session will end and you'll need to sign in again to access
              your account.
            </p>

            {/* Action Buttons */}
            {isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  data-modal-toggle="logoutModal"
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                >
                  Stay Logged In
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                >
                  Yes, Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Bar;
