import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CartDropdown from "./CartDropdown";
import { useShoppingCart } from "../context/ShoppingCartContext";

declare global {
  interface Window {
    initFlowbite?: () => void;
  }
}

// Define the component as a React Functional Component (React.FC) for TypeScript compliance
const Bar: React.FC = () => {
  const { isAuthenticated, logout, role } = useAuth();
  const { cartQuantity } = useShoppingCart();

  // Initialize Flowbite (if available) on component mount
  useEffect(() => {
    if (window.initFlowbite) {
      window.initFlowbite();
    }
  }, []);

  // Handle logout functionality
  const handleLogout = () => {
    logout();
    localStorage.clear();
    window.location.href = "/login";
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
                <Link
                  to="https://www.instagram.com/flowtechs_ltd"
                  className="flex items-center space-x-3"
                >
                  <img
                    className="h-10 w-auto transition-transform duration-200 hover:scale-105"
                    src="/logomoto.png"
                    alt="Flowtechs Logo"
                  />
                  <span className="text-2xl font-semibold whitespace-nowrap text-white">FlowTech</span>
                  
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
                  <Link
                    to="/store"
                    className="relative text-white/90 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-200 group"
                  >
                    Today's Deals
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
                  </Link>
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
                            d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2"
                          />
                        </svg>
                        My Orders
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
                    className="w-4 h-4 mr-2"
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
                  Sign In
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                data-collapse-toggle="ecommerce-navbar-menu-1"
                aria-controls="ecommerce-navbar-menu-1"
                aria-expanded="false"
                className="md:hidden p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div
            id="ecommerce-navbar-menu-1"
            className="md:hidden hidden bg-white/10 backdrop-blur border-t border-white/20 rounded-lg mt-2 mx-4 mb-2"
          >
            <div className="space-y-2 p-4">
              <Link
                to="/"
                className="block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                to="/store"
                className="block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                Today's Deals
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                About Us
              </Link>
            </div>
          </div>
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