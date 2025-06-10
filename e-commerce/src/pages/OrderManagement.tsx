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
} from "lucide-react";

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
  status: "pending" | "delivered" | "cancelled";
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

  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

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
        `http://127.0.0.1:8000/admin/orders?${params.toString()}`,
        {
          headers: {
            Authorization: ` Bearer ${token}`,
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
        `http://127.0.0.1:8000/update-order-status/${orderId}`,
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

  // Handle cancel order
  const cancelOrder = async (orderId: number) => {
    if (!token) {
      setError("No authentication token found. Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/update-order-status/${orderId}`,
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
                                <Banknote className="w-4 h-4 text-slate-400" />{" "}
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
                                ref={(el) =>
                                  (dropdownRefs.current[order.order_id] = el)
                                }
                                className={`absolute right-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 animate-in slide-in-from-top-2 duration-200 ${
                                  // Check if this is one of the last few rows to show dropdown above
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
                                          updateOrderStatus(
                                            order.order_id,
                                            "delivered"
                                          )
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
                                : "text-slate-700 hover:bg-slate-100"
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
                      <div className="bg-green-500"></div>
                      Active
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Cancel Order
                  </h3>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <Trash2 className="h-6 w-6 text-gray-500" />
                </div>
                <p className="mb-4 text-lg font-semibold text-slate-900">
                  Are you sure you want to cancel order #{selectedOrderId}?
                </p>
                <p className="mb-4 text-sm text-slate-600">
                  This action cannot be undone.
                </p>
                <div className="flex justify-center items-center space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="py-2 px-3 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors duration-200"
                  >
                    No, cancel
                  </button>
                  <button
                    onClick={() => cancelOrder(selectedOrderId)}
                    className="py-2 px-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Yes, I'm sure
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
