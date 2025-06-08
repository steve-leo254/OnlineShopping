import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../cart/formatCurrency";

const OrdersOverview: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mapping frontend dropdown values to API status values
const statusMapping = {
  transit: "pending",
  confirmed: "delivered",
  cancelled: "cancelled",
  processing: "processing" 
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

    // Only append status if selectedStatus is not null
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



  // Cancel order function
  const cancelOrder = async (orderId) => {
    if (!token) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh orders after cancellation
        fetchOrders();
      } else {
        console.error("Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
    }
  };

  // Fetch orders when page or selectedStatus changes
  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus]);

  // Handle dropdown change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // Reset to null for "all", otherwise map to API status
    setSelectedStatus(value === "all" ? null : statusMapping[value]);
    setPage(1); // Reset to first page on filter change
  };

  // Map API status to frontend display
  const getStatusBadge = (status) => {
    switch (status) {
      case "processing":
        return {
          label: "Processed",
          className: "bg-blue-200 text-white dark:bg-blue-900 dark:text-white",
          icon: (
            <svg
              className="me-1 h-3 w-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
              />
            </svg>
          ),
        };
      case "pending":
        return {
          label: "Pending",
          className: "bg-gradient-to-r from-yellow-400 to-orange-500 p-4",
          icon: (
            <svg
              className="me-1 h-3 w-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
              />
            </svg>
          ),
        };
      case "delivered":
        return {
          label: "Confirmed",
          className: "bg-green-100 text-green-800 ",
          icon: (
            <svg
              className="me-1 h-3 w-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 11.917 9.724 16.5 19 7.5"
              />
            </svg>
          ),
        };
      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          icon: (
            <svg
              className="me-1 h-3 w-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18 17.94 6M18 18 6.06 6"
              />
            </svg>
          ),
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
          icon: null,
        };
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <section className="bg-white py-8 antialiased md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading orders...</div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white py-8 antialiased md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-8 antialiased md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0 min-h-screen">
        <div className="mx-auto max-w-5xl">
          <div className="gap-4 sm:flex sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              My orders
            </h2>
            <div className="mt-6 gap-4 space-y-4 sm:mt-0 sm:flex sm:items-center sm:justify-end sm:space-y-0">
              <div>
                <label
                  htmlFor="order-type"
                  className="sr-only mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Select order type
                </label>
                <select
                  id="order-type"
                  className="block w-full min-w-[8rem] rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                  onChange={handleStatusChange}
                  value={selectedStatus === null ? "all" : Object.keys(statusMapping).find(key => statusMapping[key] === selectedStatus) || "all"}
                  disabled={loading}
                >
                  <option value="all">All orders</option>
                  <option value="transit">In transit</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flow-root sm:mt-8">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  return (
                    <div
                      key={order.order_id}
                      className="flex flex-wrap items-center gap-y-4 py-6"
                    >
                      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
                        <dt className="text-base font-medium text-gray-500">
                          Order ID:
                        </dt>
                        <dd className="mt-1.5 text-base font-semibold text-gray-900">
                          <Link 
                            to={`/order-details/${order.order_id}`}
                            className="hover:underline"
                          >
                            #{order.order_id}
                          </Link>
                        </dd>
                      </dl>
                      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
                        <dt className="text-base font-medium text-gray-500">
                          Date:
                        </dt>
                        <dd className="mt-1.5 text-base font-semibold text-gray-900">
                          {new Date(order.datetime).toLocaleDateString()}
                        </dd>
                      </dl>
                      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
                        <dt className="text-base font-medium text-gray-500 ">
                          Total:
                        </dt>
                        <dd className="mt-1.5 text-base font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </dd>
                      </dl>
                      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
                        <dt className="text-base font-medium text-gray-500">
                          Status:
                        </dt>
                        <dd
                          className={`me-2 mt-1.5 inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}
                        >
                          {statusBadge.icon}
                          {statusBadge.label}
                        </dd>
                      </dl>
                      <div className="w-full grid sm:grid-cols-2 lg:flex lg:w-64 lg:items-center lg:justify-end gap-4">
                        {order.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => cancelOrder(order.order_id)}
                            className="w-full rounded-lg border border-red-700 px-3 py-2 text-center text-sm font-medium text-red-700 hover:bg-red-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300  lg:w-auto"
                          >
                            Cancel order
                          </button>
                        )}
                        {order.status !== "pending" && (
                          <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100  lg:w-auto"
                          >
                            Order again
                          </button>
                        )}
                        <Link
                          to={`/order-details/${order.order_id}`}
                          className="w-full inline-flex justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100  lg:w-auto"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-6 flex items-center justify-center sm:mt-8"
              aria-label="Page navigation"
            >
              <ul className="flex h-8 items-center -space-x-px text-sm">
                <li>
                  <button
                    onClick={() => page > 1 && setPage(page - 1)}
                    disabled={page <= 1}
                    className="ms-0 flex h-8 items-center justify-center rounded-s-lg border border-e-0 border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-4 w-4 rtl:rotate-180"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m15 19-7-7 7-7"
                      />
                    </svg>
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <li key={p}>
                    <button
                      onClick={() => setPage(p)}
                      className={`flex h-8 items-center justify-center border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
                        page === p
                          ? "z-10 bg-primary-50 text-primary-600 border-primary-300"
                          : ""
                      }`}
                    >
                      {p}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => page < totalPages && setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="flex h-8 items-center justify-center rounded-e-lg border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-4 w-4 rtl:rotate-180"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m9 5 7 7-7 7"
                      />
                    </svg>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
};

export default OrdersOverview;