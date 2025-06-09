import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

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

const OrdersMangement: React.FC = () => {
  const { token } = useAuth();
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

  // New state for dropdown and modal management
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Status options aligned with backend OrderStatus enum
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
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
      const response = await axios.put(
        `http://127.0.0.1:8000/update-order-status/${orderId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success(`Order status updated to ${newStatus}.`);
        fetchOrders();
        setOpenDropdown(null); // Close dropdown after action
      } else {
        const errorData = response.data;
        setError(
          errorData.detail || `Failed to update order status to ${newStatus}.`
        );
      }
    } catch (error: any) {
      console.error("Error updating order status:", error);
      setError(
        error.response?.data?.detail ||
          "Error updating order status. Please try again."
      );
    }
  };

  // Handle status dropdown change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value || null);
    setPage(1); // Reset to first page
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
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
          className:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
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
          className:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
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
          className:
            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
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
          className:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
          icon: null,
        };
    }
  };

  // Show account information
  const showAccountInfo = (user: User) => {
    setAccountInfo(user);
    setShowAccountModal(true);
    setOpenDropdown(null); // Close dropdown
  };

  // Handle cancel order modal
  const handleCancelOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowDeleteModal(true);
    setOpenDropdown(null); // Close dropdown
  };

  // Fetch orders on mount and when page, status, or search changes
  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus, navigate]);

  return (
    <>
      <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-8">
        <div className="mx-auto max-w-screen-lg px-4 2xl:px-0">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl md:mb-6">
            Manage Orders
          </h2>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 max-w-md">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="search"
                  id="customer-search"
                  className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-l-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Search by customer name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-3 text-sm font-medium text-white bg-blue-700 rounded-r-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Search
              </button>
            </div>
            <div className="flex gap-3">
              <select
                className="block w-48 rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
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
          </div>

          {error && (
            <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>
          )}
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Loading orders...
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 md:p-8">
                <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Latest Orders
                </h3>
                {orders.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    No orders found.
                  </div>
                ) : (
                  orders.map((order) => {
                    const badge = getStatusBadge(order.status); // Compute badge once per order
                    return (
                      <div
                        key={order.order_id}
                        className="flex flex-wrap items-center gap-y-4 border-b border-gray-200 py-4 dark:border-gray-700 md:py-5"
                      >
                        <dl className="w-1/2 sm:w-48">
                          <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
                            Order ID:
                          </dt>
                          <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
                            <a
                              href="#"
                              className="hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/admin/orders/${order.order_id}`);
                              }}
                            >
                              #{order.order_id}
                            </a>
                          </dd>
                        </dl>
                        <dl className="w-1/2 sm:w-48">
                          <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
                            Customer Name:
                          </dt>
                          <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
                            {order.address
                              ? `${order.address.first_name} ${order.address.last_name}`
                              : order.user
                              ? order.user.username
                              : "N/A"}
                          </dd>
                        </dl>
                        <dl className="w-1/2 sm:w-1/4 md:flex-1 lg:w-auto">
                          <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
                            Date:
                          </dt>
                          <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
                            {formatDate(order.datetime)}
                          </dd>
                        </dl>
                        <dl className="w-1/2 sm:w-1/5 md:flex-1 lg:w-auto">
                          <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
                            Price:
                          </dt>
                          <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(order.total)}
                          </dd>
                        </dl>
                        <dl className="w-1/2 sm:w-1/4 sm:flex-1 lg:w-auto">
                          <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
                            Status:
                          </dt>
                          <dd
                            className={`me-2 mt-1.5 inline-flex shrink-0 items-center rounded px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </dd>
                        </dl>
                        {/* Rest of the JSX (Actions dropdown) remains unchanged */}
                        <div className="w-full sm:flex sm:w-32 sm:items-center sm:justify-end sm:gap-4 relative">
                          <button
                            type="button"
                            className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 md:w-auto"
                            onClick={() => toggleDropdown(order.order_id)}
                          >
                            Actions
                            <svg
                              className="-me-0.5 ms-1.5 h-4 w-4"
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
                                d="m19 9-7 7-7-7"
                              />
                            </svg>
                          </button>
                          {openDropdown === order.order_id && (
                            <div
                              ref={(el) =>
                                (dropdownRefs.current[order.order_id] = el)
                              }
                              className="absolute right-0 top-full mt-1 z-10 w-48 divide-y divide-gray-100 rounded-lg bg-white shadow-lg dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                            >
                              <ul className="p-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                <li>
                                  <button
                                    className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                                    onClick={() => {
                                      navigate(
                                        `/order-details/${order.order_id}`
                                      );
                                      setOpenDropdown(null);
                                    }}
                                  >
                                    <svg
                                      className="me-1.5 h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white"
                                      aria-hidden="true"
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
                                      />
                                      <path
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                      />
                                    </svg>
                                    Order details
                                  </button>
                                </li>
                                {order.status !== "cancelled" &&
                                  order.status !== "delivered" && (
                                    <li>
                                      <button
                                        className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                        onClick={() =>
                                          updateOrderStatus(
                                            order.order_id,
                                            "cancelled"
                                          )
                                        }
                                      >
                                        <svg
                                          className="me-1.5 h-4 w-4"
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
                                            d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1M6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                                          />
                                        </svg>
                                        Cancel order
                                      </button>
                                    </li>
                                  )}
                                <li>
                                  <button
                                    className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                                    onClick={() =>
                                      order.user && showAccountInfo(order.user)
                                    }
                                  >
                                    <svg
                                      className="me-1.5 h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
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
                                        strokeWidth="2"
                                        d="M16 12a4 4 0 1 0-0-8 4 4 0 0 0 0 8z"
                                      />
                                      <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeWidth="2"
                                        d="M3 20v-1 a4 4 0 0 1 4-4 h3"
                                      />
                                    </svg>
                                    Account info
                                  </button>
                                </li>
                                {order.status !== "delivered" &&
                                  order.status !== "cancelled" && (
                                    <li>
                                      <button
                                        className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                        onClick={() =>
                                          updateOrderStatus(
                                            order.order_id,
                                            "delivered"
                                          )
                                        }
                                      >
                                        <svg
                                          className="me-1.5 h-4 w-4 text-blue-400 group-hover:text-blue-900 dark:group-hover:text-white"
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
                                        Mark as Delivered
                                      </button>
                                    </li>
                                  )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination Controls */}
              {total > 0 && (
                <div className="mt-6 flex justify-center gap-4">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <span className="self-center text-sm text-gray-700 dark:text-gray-300">
                    Page {page} of {Math.ceil(total / limit)}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === Math.ceil(total / limit)}
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Delete Order Modal */}
          <div
            id="deleteOrderModal"
            tabIndex={-1}
            aria-hidden="true"
            className="fixed left-0 right-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden h-full bg-gray-900/50 md:h-full"
          >
            <div className="relative h-full w-full max-w-md p-4 md:h-auto">
              <div className="relative rounded-lg bg-white p-4 text-center shadow dark:bg-gray-800 sm:p-5">
                <button
                  type="button"
                  className="absolute right-2.5 top-2.5 ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                  data-modal-toggle="deleteOrderModal"
                  onClick={() => setSelectedOrderId(null)}
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                  <svg
                    className="h-6 w-6 text-gray-500 dark:text-gray-400"
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
                      d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1M6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                    />
                  </svg>
                  <span className="sr-only">Danger icon</span>
                </div>
                <p className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Are you sure you want to cancel order #{selectedOrderId}?
                </p>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-300">
                  This action cannot be undone.
                </p>
                <div className="flex justify-center items-center space-x-4">
                  <button
                    data-modal-toggle="deleteOrderModal"
                    type="button"
                    className="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                    onClick={() => setSelectedOrderId(null)}
                  >
                    No, cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
                    onClick={() =>
                      selectedOrderId && cancelOrder(selectedOrderId)
                    }
                  >
                    Yes, I'm sure
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information Modal */}
          <div
            id="accountInfoModal"
            tabIndex={-1}
            aria-hidden="true"
            className="fixed left-0 top-0 z-50 hidden w-full items-center justify-center overflow-y-auto overflow-x-hidden h-full bg-gray-900/50 md:h-full"
          >
            <div className="relative h-full w-full max-w-md p-4 md:h-auto">
              <div className="relative rounded-lg bg-white p-4 text-center shadow dark:bg-gray-900 sm:p-5">
                <button
                  type="button"
                  className="absolute right-2.5 top-2.5 ml-auto inline-flex items-center rounded-lg bg-transparent p-0.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                  data-modal-toggle="accountInfoModal"
                  onClick={() => setAccountInfo(null)}
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 0 0 1.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  Account Details
                </h3>
                {accountInfo ? (
                  <div className="text-left text-gray-600 dark:text-gray-300">
                    <p className="mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        Username:
                      </span>{" "}
                      {accountInfo.username}
                    </p>
                    <p className="mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        Email:
                      </span>{" "}
                      {accountInfo.email || "N/A"}
                    </p>
                    <p className="mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        Role:
                      </span>{" "}
                      {accountInfo.role || "N/A"}
                    </p>
                    <p className="mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        Status:
                      </span>{" "}
                      {accountInfo.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">
                    No account information available.
                  </p>
                )}
                <button
                  data-modal-toggle="accountInfoModal"
                  type="button"
                  className="mt-4 px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  onClick={() => setAccountInfo(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrdersMangement;
