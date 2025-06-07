import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "../cart/formatCurrency";
import { useAuth } from "../context/AuthContext";
import LoadingComponent from "../components/Loading";

// Define interfaces based on your pydantic models
interface Product {
  id: number;
  name: string;
  price: number;
  img_url: string;
  description?: string;
  brand?: string;
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
  const DELIVERY_FEE = 150; // Fixed delivery fee

  // image endpoint

  const imgEndPoint = "http://localhost:8000";

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
          `http://localhost:8000/orders/${orderId}`,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 ">No order data available</p>
      </div>
    );
  }

  // Calculate subtotal (total from database minus tax and delivery)
  const subtotal = order.total - DELIVERY_FEE;
  const grandTotal = subtotal + DELIVERY_FEE;

  // Format the address
  const formatAddress = (address: Address | undefined) => {
    if (!address) return "No address selected";
    return `${address.first_name} ${address.last_name} - ${
      address.phone_number
    }, ${address.address}, ${address.city}, ${address.region}${
      address.additional_info ? `, ${address.additional_info}` : ""
    }`;
  };

  return (
    <section className="bg-white py-8 antialiased md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Order #{order.order_id} Details
          </h2>
        </div>

        {/* Order Status */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mt-2">
            Ordered on{" "}
            {new Date(order.datetime).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="mt-6 sm:mt-8 lg:flex lg:gap-8">
          <div className="w-full divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700 lg:max-w-xl xl:max-w-2xl">
            {/* Order Items */}
            {order.order_details.map((item) => (
              <div
                key={item.order_detail_id}
                className="space-y-4 p-6 "
              >
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 shrink-0">
                    <img
                      className="h-full w-full object-cover rounded"
                      src={
                        item.product.img_url
                          ? `${imgEndPoint}${item.product.img_url}`
                          : "/api/placeholder/56/56"
                      }
                      alt={item.product.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/api/placeholder/56/56";
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900">
                      {item.product.name}
                    </h4>
                    {item.product.brand && (
                      <p className="text-sm text-gray-500">
                        Brand: {item.product.brand}
                      </p>
                    )}
                    {item.product.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.product.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-normal text-gray-500">
                    <span className="font-medium text-gray-900 ">
                      Product ID:
                    </span>{" "}
                    {item.product_id}
                  </p>

                  <div className="flex items-center justify-end gap-4">
                    <p className="text-base font-normal text-gray-900">
                      x{item.quantity}
                    </p>
                    <p className="text-xl font-bold leading-tight text-gray-900">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <div className="space-y-4 bg-gray-50 p-6">
              <div className="space-y-2">
                <dl className="flex items-center justify-between gap-4">
                  <dt className="font-normal text-gray-500">Subtotal</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCurrency(subtotal)}
                  </dd>
                </dl>

                <dl className="flex items-center justify-between gap-4">
                  <dt className="font-normal text-gray-500">Delivery Fee</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCurrency(DELIVERY_FEE)}
                  </dd>
                </dl>
              </div>

              <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                <dt className="text-lg font-bold text-gray-900 ">Total</dt>
                <dd className="text-lg font-bold text-gray-900">
                  {formatCurrency(order.total)} or {formatCurrency(grandTotal)}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-6 grow sm:mt-8 lg:mt-0">
            <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">
                Order Tracking
              </h3>

              <ol className="relative ms-3 border-s border-gray-200">
                <li className="mb-10 ms-6">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
                    <svg
                      className="h-4 w-4 text-gray-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"
                      />
                    </svg>
                  </span>
                  <h4 className="mb-0.5 text-base font-semibold text-gray-900">
                    Estimated delivery
                  </h4>
                  <p className="text-sm font-normal text-gray-500">
                    Within 48 hrs after order confirmation
                  </p>
                </li>

                <li className="mb-10 ms-6">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
                    <svg
                      className="h-4 w-4 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                      />
                    </svg>
                  </span>
                  <h4 className="mb-0.5 text-base font-semibold text-gray-900 ">
                    Order Status
                  </h4>
                  <p className="text-sm font-normal text-gray-500">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${
              order.status === "delivered"
                ? "bg-green-100 text-green-800"
                : order.status === "pending"
                ? "bg-yellow-100 text-yellow-800 "
                : order.status === "cancelled"
                ? "bg-red-100 text-red-800 "
                : "bg-blue-100 text-blue-800 "
            }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </p>
                </li>

                <li className="mb-10 ms-6">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white ">
                    <svg
                      className="h-4 w-4 text-gray-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"
                      />
                    </svg>
                  </span>
                  <h4 className="mb-0.5 text-base font-semibold text-gray-900">
                    Delivery Address
                  </h4>
                  <p className="text-sm font-normal text-gray-500">
                    {formatAddress(order.address)}{" "}
                  </p>
                </li>

                <li className="ms-6 text-primary-700">
                  <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 ring-8 ring-white ">
                    <svg
                      className="h-4 w-4"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 11.917 9.724 16.5 19 7.5"
                      />
                    </svg>
                  </span>
                  <div>
                    <h4 className="mb-0.5 font-semibold text-gray-500">
                      19 Nov 2023, 10:45
                    </h4>
                    <a
                      href="#"
                      className="text-sm font-medium hover:underline text-gray-400"
                    >
                      Order confirmed - Receipt #647563
                    </a>
                  </div>
                </li>
              </ol>

              <div className="gap-4 sm:flex sm:items-center">
                <button
                  onClick={() => navigate("/store")}
                  type="button"
                  className="w-full rounded-lg  border border-gray-200 bg-white px-5  py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100"
                >
                  Shop
                </button>

                <a
                  href="/orders-overview"
                  className="bg-blue-600 mt-4 flex w-full items-center justify-center rounded-lg bg-primary-700  px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300   sm:mt-0"
                >
                  My Orders
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderDetails;
