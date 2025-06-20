import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify";
import axios from "axios";
import { useUserStats } from "../context/UserStatsContext";

interface Order {
  order_id: number;
  status: "pending" | "delivered" | "cancelled" | "processing";
  datetime: string;
  total: number;
}

// Confirmation Modal Component
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  orderNumber: string;
}> = ({ isOpen, onClose, onConfirm, isLoading, orderNumber }) => {
  const [reason, setReason] = useState("");
  if (!isOpen) return null;

  return (
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
          <p className="text-gray-600 text-center mb-4">
            Are you sure you want to cancel order{" "}
            <span className="font-semibold">#{orderNumber}</span>? This action
            cannot be undone.
          </p>
          <textarea
            className="text-gray-700 w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-200"
            placeholder="Please provide a reason for cancellation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Keep Order
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={isLoading || !reason.trim()}
              className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Order"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdersOverview: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(
    null
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null);
  const { refreshStats } = useUserStats();

  // Mapping frontend dropdown values to API status values
  const statusMapping = {
    transit: "pending",
    confirmed: "delivered",
    cancelled: "cancelled",
    processing: "processing",
  };

  // Fetch orders from the API
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    if (!token) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      skip: ((page - 1) * limit).toString(),
      limit: limit.toString(),
    });

    if (selectedStatus) {
      params.append("status", selectedStatus);
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/orders?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      setOrders(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel order confirmation
  const handleCancelOrder = (orderId: number) => {
    setOrderToCancel(orderId);
    setShowConfirmModal(true);
  };

  // Cancel order function
  const cancelOrder = async (reason: string) => {
    if (!token || !orderToCancel) {
      setError("No authentication token found. Please log in.");
      return;
    }
    setCancellingOrderId(orderToCancel);
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/auth/cancel-order/${orderToCancel}`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status < 200 || response.status >= 300) {
        throw new Error(
          response.data?.detail || `Failed to cancel order: ${response.status}`
        );
      }
      toast.success("Request sent");
      setShowConfirmModal(false);
      setOrderToCancel(null);
      await fetchOrders();
      refreshStats();
    } catch (error: unknown) {
      console.error("Error cancelling order:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.detail || error.message
        : error instanceof Error
        ? error.message
        : "Failed to cancel order. Please try again.";
      setError(errorMessage);
      toast.error("Failed to cancel order. Please try again.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Fetch orders when page or selectedStatus changes
  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus]);

  // Handle dropdown change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(
      value === "all"
        ? null
        : statusMapping[value as keyof typeof statusMapping]
    );
    setPage(1);
  };

  // Map API status to frontend display
  const getStatusBadge = (
    status: "pending" | "delivered" | "cancelled" | "processing"
  ) => {
    switch (status) {
      case "processing":
        return {
          label: "Processing",
          className:
            "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
          icon: (
            <svg
              className="w-3 h-3 mr-1.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "pending":
        return {
          label: "In Transit",
          className:
            "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg",
          icon: (
            <svg
              className="w-3 h-3 mr-1.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707L15 6.586A1 1 0 0014.414 6H14v1z" />
            </svg>
          ),
        };
      case "delivered":
        return {
          label: "Delivered",
          className:
            "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg",
          icon: (
            <svg
              className="w-3 h-3 mr-1.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "cancelled":
        return {
          label: "Cancelled",
          className:
            "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg",
          icon: (
            <svg
              className="w-3 h-3 mr-1.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      default:
        return {
          label: status,
          className:
            "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg",
          icon: null,
        };
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg text-gray-600 font-medium">
                Loading your orders...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-lg text-red-600 font-medium">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Orders
              </h1>
              <p className="text-gray-600">Track and manage your orders</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  id="order-type"
                  className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-700 focus:border-blue-500 focus:ring-0 transition-colors min-w-[160px]"
                  onChange={handleStatusChange}
                  value={
                    selectedStatus === null
                      ? "all"
                      : Object.keys(statusMapping).find(
                          (key) =>
                            statusMapping[key as keyof typeof statusMapping] ===
                            selectedStatus
                        ) || "all"
                  }
                  disabled={loading}
                >
                  <option value="all">All Orders</option>
                  <option value="transit">In Transit</option>
                  <option value="confirmed">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="processing">Processing</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-600">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              const isCancelling = cancellingOrderId === order.order_id;

              return (
                <div
                  key={order.order_id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Order Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">
                            Order ID
                          </p>
                          <Link
                            to={`/order-details/${order.order_id}`}
                            className="text-lg font-bold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            #{order.order_id}
                          </Link>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">
                            Date
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(order.datetime).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">
                            Total
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">
                            Status
                          </p>
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusBadge.className}`}
                          >
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
                        {order.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.order_id)}
                            disabled={isCancelling}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            {isCancelling ? "Cancelling..." : "Cancel Order"}
                          </button>
                        )}
                        {order.status !== "pending" && (
                          <button
                            type="button"
                            className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            Order Again
                          </button>
                        )}
                        <Link
                          to={`/order-details/${order.order_id}`}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <nav className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => page > 1 && setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-4 py-2 font-medium rounded-xl transition-colors ${
                        page === p
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => page < totalPages && setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setOrderToCancel(null);
        }}
        onConfirm={cancelOrder}
        isLoading={cancellingOrderId !== null}
        orderNumber={orderToCancel?.toString() || ""}
      />
    </div>
  );
};

export default OrdersOverview;
