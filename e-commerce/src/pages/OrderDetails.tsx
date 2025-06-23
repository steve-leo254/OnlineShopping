import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "../cart/formatCurrency";
import { useAuth } from "../context/AuthContext";
import LoadingComponent from "../components/Loading";
import { useShoppingCart } from "../context/ShoppingCartContext";

// Define interfaces based on your pydantic models
interface Product {
  id: number;
  name: string;
  price: number;
  img_url: string;
  description?: string;
  brand?: string;
  images?: { img_url: string }[];
}

interface OrderDetail {
  order_detail_id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  product: Product;
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
}

interface Order {
  order_id: number;
  total: number;
  datetime: string;
  status: string;
  user_id: number;
  order_details: OrderDetail[];
  address?: Address;
  completed_at: string | null;
}

const OrderDetails: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  // Try different possible parameter names
  const orderId = params.orderId || params.id || params.order_id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log all params to see what we're getting
  console.log("All URL params:", params);
  console.log("Extracted Order ID:", orderId);

  // Configuration variables for delivery
  const { deliveryFee } = useShoppingCart();

  // image endpoint
  const imgEndPoint = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID is required");
        setLoading(false);
        return;
      }

      try {
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Order not found");
          } else if (response.status === 401) {
            setError("Unauthorized access");
          } else {
            setError("Failed to fetch order details");
          }
          setLoading(false);
          return;
        }

        const orderData = await response.json();
        setOrder(orderData);
      } catch (err) {
        setError("Network error occurred");
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <LoadingComponent message="Loading order details, please wait..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-md w-full">
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
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-red-600 text-base sm:text-lg mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg text-sm sm:text-base"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-base sm:text-lg">
            No order data available
          </p>
        </div>
      </div>
    );
  }

  // Calculate subtotal (total from database minus tax and delivery)
  const subtotal = order.total - deliveryFee;

  // Format the address
  const formatAddress = (address: Address | undefined) => {
    if (!address) return "No address selected";
    return `${address.first_name} ${address.last_name} - ${
      address.phone_number
    }, ${address.address}, ${address.city}, ${address.region}${
      address.additional_info ? `, ${address.additional_info}` : ""
    }`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case "cancelled":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      case "processing":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <section className="py-4 sm:py-6 md:py-8 lg:py-16 antialiased">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 2xl:px-0">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Order #{order.order_id}
                </h1>
                <p className="text-gray-500 mt-2 flex items-center text-sm sm:text-base">
                  <svg
                    className="w-4 h-4 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M3 7h18l-1.35 9.45A2 2 0 0118.65 18H5.35a2 2 0 01-1.99-1.55L2 7z"
                    />
                  </svg>
                  <span className="break-words">
                    Ordered on{" "}
                    {new Date(order.datetime).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              </div>
              <div className="flex-shrink-0">
                <span
                  className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg ${getStatusColor(
                    order.status
                  )}`}
                >
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 lg:gap-8 space-y-6 lg:space-y-0">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    Order Items ({order.order_details.length})
                  </h2>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.order_details.map((item, index) => (
                    <div
                      key={item.order_detail_id}
                      className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-6">
                        <div className="relative group flex-shrink-0">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                            <img
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"
                              src={
                                item.product.images &&
                                item.product.images.length > 0
                                  ? item.product.images[0].img_url.startsWith(
                                      "http"
                                    )
                                    ? item.product.images[0].img_url
                                    : `${imgEndPoint}${item.product.images[0].img_url}`
                                  : "/api/placeholder/80/80"
                              }
                              alt={item.product.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/api/placeholder/80/80";
                              }}
                            />
                          </div>
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {item.quantity}x
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 line-clamp-2">
                            {item.product.name}
                          </h3>
                          {item.product.brand && (
                            <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">
                              {item.product.brand}
                            </p>
                          )}
                          {item.product.description && (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 hidden sm:block">
                              {item.product.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                            Product ID: #{item.product_id}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(item.total_price)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {formatCurrency(item.product.price)} ×{" "}
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm sm:text-base">
                        Subtotal
                      </span>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center text-sm sm:text-base">
                        <svg
                          className="w-4 h-4 mr-1 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                          />
                        </svg>
                        Delivery Fee
                      </span>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">
                        {formatCurrency(deliveryFee)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg sm:text-xl font-bold text-gray-900">
                          Total
                        </span>
                        <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Tracking */}
            <div className="w-full">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Order Tracking
                  </h3>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="space-y-6 sm:space-y-8">
                    {/* Delivery Timeline */}
                    <div className="relative">
                      <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-blue-50 rounded-xl">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Estimated Delivery
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Within 48 hours after confirmation
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="relative">
                      <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getStatusColor(
                              order.status
                            )}`}
                          >
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Current Status
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Your order is {order.status.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="relative">
                      <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-purple-50 rounded-xl">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                            Delivery Address
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed break-words">
                            {formatAddress(order.address)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Confirmation */}
                    {order.completed_at && (
                      <div className="relative">
                        <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-green-50 rounded-xl">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center">
                              <svg
                                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                              Order Confirmed
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {new Date(order.completed_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Receipt #{order.order_id}47563
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 sm:mt-8 space-y-3">
                    <button
                      onClick={() => navigate("/store")}
                      className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg flex items-center justify-center text-sm sm:text-base"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      Continue Shopping
                    </button>

                    <button
                      onClick={() => navigate("/orders-overview")}
                      className="w-full px-4 sm:px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all duration-200 font-medium flex items-center justify-center text-sm sm:text-base"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      View All Orders
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrderDetails;
