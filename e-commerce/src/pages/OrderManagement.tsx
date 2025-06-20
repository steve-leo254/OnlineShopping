import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../cart/formatCurrency";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Banknote,
  Package,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Phone,
} from "lucide-react";
import { useUserStats } from "../context/UserStatsContext";

// Define interfaces for type safety
interface Address {
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  additional_info: string;
  region: string;
  city: string;
  is_default: boolean;
  id: number;
  user_id: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  email?: string;
  role?: string;
  is_active?: boolean;
}

interface OrderDetail {
  order_detail_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  product: {
    name: string;
    cost: number;
    price: number;
    img_url: string;
    stock_quantity: number;
    barcode: number;
    category_id: number;
    brand: string;
    description: string;
    id: number;
    created_at: string;
    user_id: number;
    category: {
      name: string;
      description: string;
      id: number;
    };
  };
}

interface Order {
  order_id: number;
  total: number;
  datetime: string;
  status: "pending" | "delivered" | "cancelled" | "processing";
  user_id: number;
  delivery_fee: number;
  completed_at: string | null;
  address: Address;
  user?: User;
  order_details?: OrderDetail[];
}

const OrdersManagement: React.FC = () => {
  const { token, role } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [accountInfo, setAccountInfo] = useState<User | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<
    number | null
  >(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("idle");

  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const { refreshStats } = useUserStats();

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "processing", label: "Processed" },
  ];

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown !== null) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (
          dropdownElement &&
          !dropdownElement.contains(event.target as Node)
        ) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // Toggle dropdown for specific order
  const toggleDropdown = (orderId: number) => {
    setOpenDropdown(openDropdown === orderId ? null : orderId);
  };

  // Fetch orders from the API
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    if (!token) {
      setError("No authentication token found. Please log in.");
      setLoading(false);
      navigate("/login");
      return;
    }

    const params = new URLSearchParams({
      skip: ((page - 1) * limit).toString(),
      limit: limit.toString(),
    });

    if (selectedStatus) {
      params.append("status", selectedStatus);
    }
    if (searchQuery.trim()) {
      params.append("search", searchQuery.trim());
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/admin/orders?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
          throw new Error("Unauthorized or forbidden. Please log in as admin.");
        }
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Failed to fetch orders: ${response.status}`
        );
      }

      const data = await response.json();
      setOrders(data.items || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setError(error.message || "Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (
    orderId: number,
    newStatus: Order["status"]
  ) => {
    if (!token) {
      setError("No authentication token found. Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/update-order-status/${orderId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Failed to update order status to ${newStatus}.`
        );
      }

      toast.success(`Order status updated to ${newStatus}.`);
      fetchOrders(); // Refresh orders after status update
      setOpenDropdown(null);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      setError(
        error.message || "Error updating order status. Please try again."
      );
    }
  };

  // Initiate M-Pesa transaction
  const initiateTransaction = async (
    orderId: number,
    phoneNumber: string,
    amount: number
  ) => {
    const transactionData = {
      order_id: orderId,
      phone_number: phoneNumber,
      amount: amount,
    };
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/payments/lnmo/transact`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to initiate transaction");
    }
    const data = await response.json();
    return data.CheckoutRequestID;
  };

  // Check transaction status
  const checkTransactionStatus = async (orderId: number) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/payments/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId.toString() }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to check transaction status");
    }
    const data = await response.json();
    return data.transaction.status;
  };

  // Handle initiate payment
  const handleInitiatePayment = async (orderId: number, total: number) => {
    try {
      setPaymentStatus("processing");
      setError(null);

      const phoneRegex = /^(?:254[17]\d{8}|0[17]\d{8})$/;
      if (!phoneRegex.test(mpesaPhone)) {
        throw new Error("Please enter a valid Kenyan phone number");
      }

      let formattedPhone = mpesaPhone;
      if (mpesaPhone.startsWith("0")) {
        formattedPhone = "254" + mpesaPhone.substring(1);
      }

      await initiateTransaction(orderId, formattedPhone, total);
      let attempts = 0;
      const maxAttempts = 24; // 2 minutes with 5-second intervals

      const interval = setInterval(async () => {
        attempts++;
        const status = await checkTransactionStatus(orderId);
        if (status === 4) {
          // ACCEPTED
          clearInterval(interval);
          await updateOrderStatus(orderId, "delivered");
          setPaymentStatus("success");
          setShowDeliveredModal(false);
          setSelectedOrderForDelivery(null);
          setMpesaPhone("");
          toast.success("Payment confirmed and order marked as delivered.");
          refreshStats();
        } else if (status === 3 || status === 2) {
          // REJECTED or CANCELLED
          clearInterval(interval);
          setPaymentStatus("error");
          setError("Payment was rejected or cancelled");
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentStatus("error");
          setError("Payment confirmation timed out");
        }
      }, 5000);
    } catch (err: any) {
      setPaymentStatus("error");
      setError(err.message || "Failed to initiate payment");
    }
  };

  // Handle cancel order
  const cancelOrder = async (orderId: number) => {
    if (!token) {
      setError("No authentication token found. Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/update-order-status/${orderId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to cancel order.");
      }

      toast.success("Order cancelled successfully.");
      setShowDeleteModal(false);
      setSelectedOrderId(null);
      fetchOrders();
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      setError(error.message || "Error cancelling order. Please try again.");
    }
  };

  // Handle status dropdown change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value || null);
    setPage(1);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  // Handle search button click
  const handleSearch = () => {
    fetchOrders();
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(total / limit)) {
      setPage(newPage);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          color: "bg-amber-100 text-amber-800 border-amber-200",
          icon: <Clock className="w-3 h-3" />,
          dotColor: "bg-amber-500",
        };
      case "delivered":
        return {
          label: "Delivered",
          color: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: <CheckCircle className="w-3 h-3" />,
          dotColor: "bg-emerald-500",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <X className="w-3 h-3" />,
          dotColor: "bg-red-500",
        };
      default:
        return {
          label: status,
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Clock className="w-3 h-3" />,
          dotColor: "bg-blue-500",
        };
    }
  };

  // Show account information
  const showAccountInfo = (user: User) => {
    setAccountInfo(user);
    setShowAccountModal(true);
    setOpenDropdown(null);
  };

  // Handle cancel order modal
  const handleCancelOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  // Handle mark as delivered modal
  const handleMarkAsDelivered = (orderId: number) => {
    setSelectedOrderForDelivery(orderId);
    setShowDeliveredModal(true);
    setOpenDropdown(null);
  };

  // Handle confirm delivery
  const confirmDelivery = async (orderId: number) => {
    await updateOrderStatus(orderId, "delivered");
    setShowDeliveredModal(false);
    setSelectedOrderForDelivery(null);
    refreshStats();
  };

  // Fetch orders on mount and when page or status changes
  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus, navigate, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Order Management
              </h1>
              <p className="text-slate-600 mt-1">
                Manage and track all customer orders in one place
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Total Orders</p>
                    <p className="font-semibold text-slate-900">{total}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by customer name..."
                  className="text-gray-500 w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <select
                  className="text-gray-500 appearance-none pl-10 pr-8 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white min-w-48"
                  onChange={handleStatusChange}
                  value={selectedStatus || ""}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-slate-600">Loading orders...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">
                  Recent Orders
                </h2>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No orders found
                  </h3>
                  <p className="text-slate-600">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                      <div
                        key={order.order_id}
                        className="p-6 hover:bg-slate-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* Order ID */}
                            <div>
                              <p className="text-sm font-medium text-slate-500 mb-1">
                                Order ID
                              </p>
                              <button
                                onClick={() =>
                                  navigate(`/order-details/${order.order_id}`)
                                }
                                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                              >
                                #{order.order_id}
                              </button>
                            </div>

                            {/* Customer */}
                            <div>
                              <p className="text-sm font-medium text-slate-500 mb-1">
                                Customer
                              </p>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                <p className="font-medium text-slate-900">
                                  {order.address
                                    ? `${order.address.first_name} ${order.address.last_name}`
                                    : order.user
                                    ? order.user.username
                                    : "N/A"}
                                </p>
                              </div>
                            </div>

                            {/* Date */}
                            <div>
                              <p className="text-sm font-medium text-slate-500 mb-1">
                                Date
                              </p>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <p className="text-slate-900">
                                  {formatDate(order.datetime)}
                                </p>
                              </div>
                            </div>

                            {/* Amount */}
                            <div>
                              <p className="text-sm font-medium text-slate-500 mb-1">
                                Amount
                              </p>
                              <div className="flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-slate-400" />
                                <p className="font-semibold text-slate-900">
                                  {formatCurrency(order.total)}
                                </p>
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <p className="text-sm font-medium text-slate-500 mb-1">
                                Status
                              </p>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}
                                ></div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                                >
                                  {statusConfig.icon}
                                  {statusConfig.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions Dropdown */}
                          <div className="relative ml-4">
                            <button
                              onClick={() => toggleDropdown(order.order_id)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                            >
                              <MoreVertical className="w-5 h-5 text-slate-600" />
                            </button>
                            {openDropdown === order.order_id && (
                              <div
                                ref={(el) => {
                                  dropdownRefs.current[order.order_id] = el;
                                }}
                                className={`absolute right-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 animate-in slide-in-from-top-2 duration-200 ${
                                  orders.indexOf(order) >= orders.length - 2
                                    ? "bottom-full mb-2"
                                    : "top-full mt-2"
                                }`}
                              >
                                <div className="p-1">
                                  <button
                                    onClick={() => {
                                      navigate(
                                        `/order-details/${order.order_id}`
                                      );
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors duration-200"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </button>

                                  {order.user && (
                                    <button
                                      onClick={() =>
                                        showAccountInfo(order.user!)
                                      }
                                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors duration-200"
                                    >
                                      <User className="w-4 h-4" />
                                      Account Info
                                    </button>
                                  )}

                                  {order.status !== "delivered" &&
                                    order.status !== "cancelled" && (
                                      <button
                                        onClick={() =>
                                          handleMarkAsDelivered(order.order_id)
                                        }
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors duration-200"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark as Delivered
                                      </button>
                                    )}

                                  {order.status !== "cancelled" &&
                                    order.status !== "delivered" && (
                                      <button
                                        onClick={() =>
                                          handleCancelOrder(order.order_id)
                                        }
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Cancel Order
                                      </button>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {total > 0 && (
              <div className="flex items-center justify-between mt-6 z-1">
                <p className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-medium">{(page - 1) * limit + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(page * limit, total)}
                  </span>{" "}
                  of <span className="font-medium">{total}</span> results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, Math.ceil(total / limit)) },
                      (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              page === pageNum
                                ? "bg-blue-600 text-white"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === Math.ceil(total / limit)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Account Info Modal */}
        {showAccountModal && accountInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Account Information
                  </h3>
                  <button
                    onClick={() => setShowAccountModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Username
                    </p>
                    <p className="text-slate-900">{accountInfo.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Email</p>
                    <p className="text-slate-900">
                      {accountInfo.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Role</p>
                    <p className="text-slate-900">{role || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        accountInfo.is_active
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          accountInfo.is_active
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      {accountInfo.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowAccountModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Order Modal */}
        {showDeleteModal && selectedOrderId && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Cancel Order
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to cancel order{" "}
                  <span className="font-semibold">#{selectedOrderId}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={() => cancelOrder(selectedOrderId)}
                    className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mark as Delivered Modal */}
        {showDeliveredModal && selectedOrderForDelivery && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
              <div className="p-6 relative">
                <button
                  onClick={() => {
                    setShowDeliveredModal(false);
                    setSelectedOrderForDelivery(null);
                    setMpesaPhone("");
                    setPaymentStatus("idle");
                    setError(null);
                  }}
                  className="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-emerald-100 rounded-full mb-4">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Confirm Order Delivery or Initiate Payment
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  To confirm that order{" "}
                  <span className="font-semibold">
                    #{selectedOrderForDelivery}
                  </span>{" "}
                  has been delivered, you can either initiate an M-Pesa payment
                  or mark it as delivered for cash payments.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      M-Pesa Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="text-gray-500 w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="e.g., 0712345678 or 254712345678"
                        disabled={paymentStatus === "processing"}
                      />
                    </div>
                  </div>
                  {paymentStatus === "processing" && (
                    <div className="space-y-2">
                      <p className="text-emerald-700 text-center">
                        Awaiting payment confirmation...
                      </p>
                      <div className="flex justify-center">
                        <svg
                          className="animate-spin h-5 w-5 text-emerald-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                  {error && paymentStatus === "error" && (
                    <p className="text-red-600 text-center">{error}</p>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => confirmDelivery(selectedOrderForDelivery)}
                    className="flex-1 px-4 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={paymentStatus === "processing"}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Delivered
                  </button>
                  <button
                    onClick={() => {
                      const order = orders.find(
                        (o) => o.order_id === selectedOrderForDelivery
                      );
                      if (order) {
                        handleInitiatePayment(
                          selectedOrderForDelivery,
                          order.total
                        );
                      }
                    }}
                    className="flex-1 px-4 py-2.5 text-white bg-green-500 hover:bg-green-600 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={paymentStatus === "processing" || !mpesaPhone}
                  >
                    <Phone className="w-4 h-4" />
                    Prompt Payment
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

export default OrdersManagement;
