import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify";
import axios from "axios";

// Types for better type safety
interface Order {
  order_id: number;
  datetime: string;
  total: number;
  status: string;
}

interface OrdersResponse {
  items: Order[];
  total: number;
}

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
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  // Mapping frontend dropdown values to API status values
  const statusMapping: Record<string, string> = {
    transit: "pending",
    confirmed: "delivered",
    cancelled: "cancelled",
    processing: "processing" 
  };

  // Enhanced status configuration with better styling
  const getStatusConfig = (status: string) => {
    const configs = {
      processing: {
        label: "Processing",
        className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
        textColor: "text-white",
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        ),
      },
      pending: {
        label: "In Transit",
        className: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg animate-pulse",
        textColor: "text-white",
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8l2 4m-8-4v8m0-8V6a1 1 0 00-1-1H4a1 1 0 00-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-10 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
      },
      delivered: {
        label: "Delivered",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg",
        textColor: "text-white",
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg",
        textColor: "text-white",
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      },
    };

    return configs[status] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      className: "bg-gray-100 text-gray-800 shadow",
      textColor: "text-gray-800",
      icon: null,
    };
  };

  // Fetch orders from the API with better error handling
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    if (!token) {
      setError("Authentication required. Please log in.");
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
      const response = await fetch(`http://127.0.0.1:8000/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load orders";
      setError(errorMessage);
      toast.error("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced cancel order function
  const cancelOrder = async (orderId: number) => {
    if (!token) {
      toast.error("Authentication required. Please log in.");
      return;
    }

    setCancellingOrderId(orderId);

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/update-order-status/${orderId}`,
        { status: "cancelled" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        toast.success("Order cancelled successfully!");
        await fetchOrders();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.detail || error.message
        : "Failed to cancel order. Please try again.";
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Effect to fetch orders
  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus, token]);

  // Handle status filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value === "all" ? null : statusMapping[value] || null);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  // Loading state with skeleton
  if (loading) {
    return (
      <section className="bg-gradient-to-br from-gray-50 to-white min-h-screen py-8">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="mx-auto max-w-5xl">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-48 mb-8"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="bg-gradient-to-br from-gray-50 to-white min-h-screen py-8">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load orders</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchOrders}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-gray-50 to-white min-h-screen py-8">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
              <p className="text-gray-600">Track and manage your order history</p>
            </div>
            
            {/* Filter dropdown */}
            <div className="relative">
              <select
                id="order-type"
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
                onChange={handleStatusChange}
                value={selectedStatus === null ? "all" : Object.keys(statusMapping).find(key => statusMapping[key] === selectedStatus) || "all"}
                disabled={loading}
              >
                <option value="all">All Orders</option>
                <option value="transit">In Transit</option>
                <option value="confirmed">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="processing">Processing</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Orders list */}
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
                <p className="text-gray-500 mb-6">
                  {selectedStatus ? "No orders match your current filter." : "You haven't placed any orders yet."}
                </p>
                <Link
                  to="/shop"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                >
                  Start Shopping
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const isCancelling = cancellingOrderId === order.order_id;
                
                return (
                  <div
                    key={order.order_id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                        {/* Order ID */}
                        <div>
                          <dt className="text-sm font-medium text-gray-500 mb-1">Order ID</dt>
                          <dd className="text-lg font-bold text-gray-900">
                            <Link 
                              to={`/order-details/${order.order_id}`}
                              className="hover:text-blue-600 transition-colors duration-200"
                            >
                              #{order.order_id}
                            </Link>
                          </dd>
                        </div>

                        {/* Date */}
                        <div>
                          <dt className="text-sm font-medium text-gray-500 mb-1">Order Date</dt>
                          <dd className="text-sm font-semibold text-gray-900">
                            {new Date(order.datetime).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </dd>
                        </div>

                        {/* Total */}
                        <div>
                          <dt className="text-sm font-medium text-gray-500 mb-1">Total Amount</dt>
                          <dd className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.total)}
                          </dd>
                        </div>

                        {/* Status */}
                        <div>
                          <dt className="text-sm font-medium text-gray-500 mb-1">Status</dt>
                          <dd>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </dd>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        {order.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => cancelOrder(order.order_id)}
                            disabled={isCancelling}
                            className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            {isCancelling ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 w-4 h-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Cancelling...
                              </>
                            ) : (
                              "Cancel Order"
                            )}
                          </button>
                        )}
                        
                        <Link
                          to={`/order-details/${order.order_id}`}
                          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                        >
                          View Details
                        </Link>
                        
                        {order.status !== "pending" && (
                          <button
                            type="button"
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                          >
                            Order Again
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} orders
              </div>
              
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => page > 1 && setPage(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          page === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => page < totalPages && setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default OrdersOverview;