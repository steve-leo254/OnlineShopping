import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { formatCurrency } from "../cart/formatCurrency";
import { useFavorites } from "../context/FavoritesContext";

interface Order {
  order_id: number;
  datetime: string;
  total: number;
  status: "pending" | "delivered" | "cancelled" | "processing";
}

interface Address {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  additional_info?: string;
  region: string;
  city: string;
  is_default: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const AccountProfile: React.FC = () => {
  const { token } = useAuth();
  const { favorites } = useFavorites();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Fetch user data
        const userResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(userResponse.data);

        // Fetch user addresses
        const addressResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/addresses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAddresses(addressResponse.data);

        // Fetch recent orders (limit to 4 for latest orders)
        const ordersResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/orders?limit=4`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrders(ordersResponse.data.items || []);

        // Fetch review count
        const reviewResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/my-reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reviewResponse.ok) {
          const data = await reviewResponse.json();
          setReviewCount(Array.isArray(data) ? data.length : 0);
        }

        setLoading(false);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          setError("Failed to load data. Please try again.");
          setLoading(false);
          console.error(err);
        }
      }
    };

    fetchData();
  }, [token, navigate]);

  const handleCancelOrderClick = async (orderId: number) => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/update-order-status/${orderId}`,
        { status: "cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(
        orders.map((order) =>
          order.order_id === orderId ? { ...order, status: "cancelled" } : order
        )
      );
      setShowCancelModal(false);
      setSelectedOrderId(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Failed to cancel order.");
        console.error(err);
      }
    }
  };

  const openCancelModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowCancelModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 sm:p-8 text-center shadow-xl max-w-md w-full">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 _generate8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 text-base sm:text-lg font-semibold">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const defaultAddress =
    addresses.find((addr) => addr.is_default) || addresses[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "cancelled":
        return (
          <svg
            className="w-4 h-4"
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
        );
      case "delivered":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "processing":
        return (
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
            Account Overview
          </h1>
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
            Your profile, orders, and preferences
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[
            {
              title: "Orders Made",
              value: orders.length,
              change: "+10.3%",
              icon: "🛒",
              color: "from-blue-500 to-blue-600",
            },
            {
              title: "Reviews Added",
              value: reviewCount,
              change: "+2.6%",
              icon: "⭐",
              color: "from-yellow-400 to-yellow-500",
            },
            {
              title: "Favorites",
              value: favorites.size,
              change: "+1.2%",
              icon: "❤️",
              color: "from-pink-500 to-pink-600",
            },
            {
              title: "Returns",
              value: 0,
              change: "0%",
              icon: "↩️",
              color: "from-green-500 to-green-600",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div
                  className={`w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r ${stat.color} rounded-lg sm:rounded-xl flex items-center justify-center text-white text-sm sm:text-xl shadow-lg`}
                >
                  {stat.icon}
                </div>
                <span className="text-xs sm:text-sm text-emerald-600 font-semibold bg-emerald-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-slate-600 text-xs sm:text-sm font-medium mb-1">
                {stat.title}
              </h3>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900">
                {stat.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* User Profile Card */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
              <div className="relative mx-auto sm:mx-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
              </div>
              <div className="flex-1 text-center sm:text-left ml-4 sm:ml-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium inline-block">
                    Premium Customer
                  </span>
                </div>
                <div className="flex flex-col space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 left-1">
                    {user?.username}
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base break-all sm:break-normal">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                {defaultAddress && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        Phone Number
                      </h3>
                      <p className="text-slate-900 font-medium text-sm sm:text-base">
                        {defaultAddress.phone_number}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-slate-500"
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
                        Delivery Address
                      </h3>
                      <p className="text-slate-900 font-medium text-sm sm:text-base">
                        {defaultAddress.address}, {defaultAddress.city},{" "}
                        {defaultAddress.region}, Kenya
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Payment Methods
                      </h3>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-6 sm:w-12 sm:h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                            alt="Visa"
                            className="h-4 sm:h-5"
                          />
                        </div>
                        <div className="w-12 h-8 sm:w-14 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg"
                            alt="M-PESA"
                            className="h-6 sm:h-8"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 shadow-xl">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "Edit Profile",
                  icon: "✏️",
                  color: "from-blue-500 to-blue-600",
                },
                {
                  label: "View All Orders",
                  icon: "📦",
                  color: "from-green-500 to-green-600",
                },
                {
                  label: "Manage Addresses",
                  icon: "📍",
                  color: "from-purple-500 to-purple-600",
                },
                {
                  label: "Payment Settings",
                  icon: "💳",
                  color: "from-pink-500 to-pink-600",
                },
              ].map((action, index) => (
                <button
                  key={index}
                  className="w-full bg-gradient-to-r from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 border border-slate-200 rounded-xl p-3 sm:p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow duration-200`}
                    >
                      <span className="text-sm sm:text-base">
                        {action.icon}
                      </span>
                    </div>
                    <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors duration-200 text-xs sm:text-sm">
                      {action.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-8 shadow-xl">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Recent Orders
          </h3>

          {orders.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                No orders yet
              </h4>
              <p className="text-slate-600 text-sm sm:text-base">
                Start shopping to see your orders here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:flex lg:items-center lg:space-x-6">
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-slate-500 mb-1">
                          Order ID
                        </p>
                        <p className="font-bold text-slate-900 text-sm sm:text-lg">
                          #{order.order_id}
                        </p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-slate-500 mb-1">
                          Date
                        </p>
                        <p className="font-semibold text-slate-700 text-sm sm:text-base">
                          {new Date(order.datetime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-slate-500 mb-1">
                          Total
                        </p>
                        <p className="font-bold text-slate-900 text-sm sm:text-lg">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                      <span
                        className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-2 capitalize">{order.status}</span>
                      </span>

                      {order.status === "pending" && (
                        <button
                          onClick={() => openCancelModal(order.order_id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors duration-200 border border-red-200 text-xs sm:text-sm w-full sm:w-auto"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  Cancel Order
                </h3>
                <p className="text-slate-600 mb-6 text-sm sm:text-base">
                  Are you sure you want to cancel order #{selectedOrderId}? This
                  action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 text-sm sm:text-base"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={() =>
                      selectedOrderId && handleCancelOrderClick(selectedOrderId)
                    }
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 text-sm sm:text-base"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountProfile;
