import React, { useState, useEffect } from 'react';
import getActionDropdown from './getActionDropdown';
import ErrorBoundary from '../context/ErrorBoundary';

interface Order {
  order_id: number;
  status: string;
  address: { first_name: string; last_name: string };
  datetime: string;
  total: number;
}

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pages, setPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [modalInstance, setModalInstance] = useState<any>(null);

  // Fetch orders from API
  const fetchOrders = async () => {
    const skip = (page - 1) * limit;
    const queryParams: { [key: string]: string } = {
      skip: skip.toString(),
      limit: limit.toString(),
      search: appliedSearchQuery,
    };
    if (selectedStatus !== 'all') {
      queryParams.status = selectedStatus;
    }
    const params = new URLSearchParams(queryParams);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://127.0.0.1:8000/admin/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      setOrders(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (selectedOrderId === null) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://127.0.0.1:8000/admin/orders/${selectedOrderId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (response.ok) {
        await fetchOrders();
        setSelectedOrderId(null);
        if (modalInstance) {
          modalInstance.hide();
        }
      } else {
        console.error('Failed to cancel order:', await response.text());
        alert('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Error cancelling order');
    }
  };

  // Initialize Flowbite components
  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus, appliedSearchQuery]);

  useEffect(() => {
    if (orders.length === 0 || typeof window === 'undefined') return;

    const initializeFlowbite = () => {
      const flowbite = (window as any).flowbite || (window as any).Flowbite;
      if (!flowbite) {
        console.warn('Flowbite not loaded');
        return;
      }

      try {
        // Try initFlowbite if available
        if (typeof flowbite.initFlowbite === 'function') {
          flowbite.initFlowbite();
          console.log('Flowbite initialized with initFlowbite');
        } else {
          // Initialize modal
          const modalElement = document.getElementById('deleteOrderModal');
          if (modalElement && flowbite.Modal) {
            const modal = new flowbite.Modal(modalElement);
            setModalInstance(modal);
            console.log('Modal initialized');
          } else {
            console.warn('Modal constructor or element not found');
          }

          // Initialize dropdowns
          document.querySelectorAll('[data-dropdown-toggle]').forEach((toggle) => {
            const dropdownId = toggle.getAttribute('data-dropdown-toggle');
            const dropdown = document.getElementById(dropdownId!);
            if (dropdown && flowbite.Dropdown && !dropdown.classList.contains('flowbite-initialized')) {
              new flowbite.Dropdown(dropdown, toggle);
              dropdown.classList.add('flowbite-initialized');
              console.log(`Dropdown ${dropdownId} initialized`);
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize Flowbite components:', error);
      }
    };

    // Check if Flowbite is loaded, retry if not
    let retries = 0;
    const maxRetries = 5;
    const retryInterval = 100;

    const checkFlowbite = () => {
      if ((window as any).flowbite || (window as any).Flowbite) {
        initializeFlowbite();
      } else if (retries < maxRetries) {
        retries++;
        console.log(`Flowbite not loaded, retrying (${retries}/${maxRetries})`);
        setTimeout(checkFlowbite, retryInterval);
      } else {
        console.error('Flowbite failed to load after max retries');
      }
    };

    checkFlowbite();
  }, [orders]);

  // Handle search
  const handleSearch = () => {
    setAppliedSearchQuery(searchQuery);
    setPage(1);
  };

  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
    setPage(1);
  };

  // Status badge function
  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
        return {
          label: 'In transit',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
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
      case 'delivered':
        return {
          label: 'Confirmed',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
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
      case 'cancelled':
        return {
          label: 'Cancelled',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
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
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
          icon: null,
        };
    }
  };

  return (
    <ErrorBoundary>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                value={selectedStatus}
              >
                <option value="all">All Statuses</option>
                <option value="pending">In transit</option>
                <option value="delivered">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 md:p-8">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Latest Orders
            </h3>
            {orders.length > 0 ? (
              orders.map((order) => {
                const statusBadge = getStatusBadge(order.status);
                const { dropdown } = getActionDropdown(order.status, order.order_id, () =>
                  setSelectedOrderId(order.order_id)
                );
                return (
                  <div
                    key={order.order_id}
                    className="flex flex-wrap items-center gap-y-4 border-b border-gray-200 py-4 pb-4 dark:border-gray-700 md:py-5"
                  >
                    <dl className="w-1/2 sm:w-48">
                      <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Order ID:</dt>
                      <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
                        <a href="#" className="hover:underline">#{order.order_id}</a>
                      </dd>
                    </dl>
                    <dl className="w-1/2 sm:w-48">
                      <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Customer Name:</dt>
                      <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
                        <a href="#" className="hover:underline">
                          {order.address.first_name} {order.address.last_name}
                        </a>
                      </dd>
                    </dl>
                    <dl className="w-1/2 sm:w-1/4 md:flex-1 lg:w-auto">
                      <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Date:</dt>
                      <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
                        {new Date(order.datetime).toLocaleDateString()}
                      </dd>
                    </dl>
                    <dl className="w-1/2 sm:w-1/5 md:flex-1 lg:w-auto">
                      <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Price:</dt>
                      <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
                        ${order.total.toFixed(2)}
                      </dd>
                    </dl>
                    <dl className="w-1/2 sm:w-1/4 sm:flex-1 lg:w-auto">
                      <dt className="text-base font-medium text-gray-500 dark:text-gray-400">Status:</dt>
                      <dd className={`mt-1.5 inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </dd>
                    </dl>
                    {dropdown}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">No orders found</p>
            )}
          </div>
          <div className="flex justify-center mt-4 gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              {page} of {pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pages}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div
          id="deleteOrderModal"
          tabIndex={-1}
          aria-hidden="true"
          className="fixed left-0 right-0 top-0 z-50 hidden h-modal w-full items-center justify-center overflow-y-auto overflow-x-hidden md:inset-0 md:h-full"
        >
          <div className="relative h-full w-full max-w-md p-4 md:h-auto">
            <div className="relative rounded-lg bg-white p-4 text-center shadow dark:bg-gray-800 sm:p-5">
              <button
                type="button"
                className="absolute right-2.5 top-2.5 ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={() => modalInstance?.hide()}
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
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                <svg
                  className="h-8 w-8 text-gray-500 dark:text-gray-400"
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
                    d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                  />
                </svg>
                <span className="sr-only">Danger icon</span>
              </div>
              <p className="mb-3.5 text-gray-900 dark:text-white">
                Are you sure you want to delete this order?
              </p>
              <p className="mb-4 text-gray-500 dark:text-gray-300">
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => modalInstance?.hide()}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600"
                >
                  No, cancel
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  className="rounded-lg bg-red-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ErrorBoundary>
  );
};

export default OrdersManagement;