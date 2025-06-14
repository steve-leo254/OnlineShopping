import React, { useState, useEffect } from "react";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
};

interface PaymentData {
  order_id: number;
  phone_number: string;
  amount: number;
}

const Payment = () => {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { deliveryFee, selectedAddress } = useShoppingCart();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [checkoutRequestID, setCheckoutRequestID] = useState<string | null>(null);
  const [pollingTimeout, setPollingTimeout] = useState(false);

  const { orderId, orderCreated, subtotal } = location.state || {};
  const total = subtotal + deliveryFee;

  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate phone number (must be 10 digits starting with 0 or 12 digits starting with 254)
    const phoneRegex = /^(?:254[17]\d{8}|0[17]\d{8})$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError("Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)");
      setLoading(false);
      return;
    }

    // Format phone number to 254xxxxxxxxx
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith("0")) {
      formattedPhone = "254" + phoneNumber.substring(1);
    }

    // Ensure formatted phone number is 12 digits
    if (formattedPhone.length !== 12) {
      setError("Invalid phone number length after formatting.");
      setLoading(false);
      return;
    }

    const paymentData: PaymentData = {
      order_id: orderId,
      phone_number: formattedPhone,
      amount: Math.floor(total), // Ensure whole number
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/lnmo/transact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to initiate payment");
      }

      const result = await response.json();
      setCheckoutRequestID(result.CheckoutRequestID);
      setLoading(false); // Stop loading when payment is initiated
      setPolling(true);
      alert("Please check your phone to complete the M-Pesa payment.");
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (polling && orderId && token) {
      console.log("Starting polling for order ID:", orderId);

      // Set timeout for polling (2 minutes = 120,000ms)
      timeout = setTimeout(() => {
        console.log("Polling timeout reached");
        setPolling(false);
        setPollingTimeout(true);
        setError("Payment confirmation timed out. Please try again or contact support if payment was deducted.");
      }, 120000); // 2 minutes

      interval = setInterval(async () => {
        console.log("Polling payment status for order:", orderId);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/transactions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ order_id: orderId.toString() }),
          });

          if (!response.ok) {
            console.error("Failed to fetch payment status, status:", response.status);
            const errorText = await response.text();
            console.error("Error response:", errorText);
            throw new Error(`Failed to fetch payment status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Payment status response:", data);

          // Check if transaction exists and has a status
          if (data.transaction && typeof data.transaction.status !== "undefined") {
            const status = data.transaction.status;
            console.log("Transaction status:", status);

            if (status === 4) {
              // Payment successful
              console.log("Payment successful");
              setPolling(false);
              clearInterval(interval);
              clearTimeout(timeout);

              try {
                // Update order status to processing
                const updateStatusResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/update-order-status/${orderId}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ status: "processing" }),
                });

                if (!updateStatusResponse.ok) {
                  console.error("Failed to update order status:", updateStatusResponse.status);
                  const errorText = await updateStatusResponse.text();
                  console.error("Order status update error:", errorText);
                } else {
                  console.log("Order status successfully updated to PROCESSING");
                }
              } catch (updateError) {
                console.error("Error updating order status:", updateError);
              }

              // Navigate to confirmation page
              navigate("/order-confirmation", {
                state: {
                  orderId,
                  total,
                  orderDate: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  phoneNumber,
                  name: selectedAddress ? `${selectedAddress.first_name} ${selectedAddress.last_name}` : "No name provided",
                  address: selectedAddress ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.region}` : "No address selected",
                  transactionId: data.transaction.transaction_id || checkoutRequestID,
                  mpesaCode: data.transaction.transaction_code,
                },
              });
            } else if (status === 3) {
              // Payment failed/rejected
              console.log("Payment was rejected");
              setPolling(false);
              clearInterval(interval);
              clearTimeout(timeout);
              setError("Payment was rejected or failed. Please try again.");
            } else if (status === 2) {
              // Payment cancelled by user
              console.log("Payment was cancelled");
              setPolling(false);
              clearInterval(interval);
              clearTimeout(timeout);
              setError("Payment was cancelled. Please try again.");
            } else if (status === 1) {
              // Payment pending - continue polling
              console.log("Payment still pending, status:", status);
            } else {
              // Unknown status
              console.log("Unknown payment status:", status);
            }
          } else {
            // No transaction found yet - continue polling
            console.log("No transaction found yet, continuing to poll...");
          }
        } catch (err: any) {
          console.error("Error checking payment status:", err);
          if (err.message.includes("401") || err.message.includes("403")) {
            setPolling(false);
            clearInterval(interval);
            clearTimeout(timeout);
            setError("Authentication error. Please refresh and try again.");
          }
        }
      }, 8000); // Poll every 8 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [polling, orderId, navigate, checkoutRequestID, selectedAddress, total, phoneNumber, token]);

  if (!orderId || !subtotal) {
    return (
      <section className="bg-white py-8 antialiased md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Payment Error
            </h2>
            <p className="mt-4 text-gray-600">
              Order information is missing. Please go back to checkout and try again.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-8 antialiased md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            M-Pesa Payment
          </h2>

          <div className="mt-6 sm:mt-8 lg:flex lg:items-start lg:gap-12">
            <div className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:max-w-xl lg:p-8">
              <div className="mb-6">
                <label
                  htmlFor="phone_number"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  M-Pesa Phone Number*
                </label>
                <input
                  type="text"
                  id="phone_number"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={loading || polling}
                />
                <p className="mt-2 text-sm text-gray-600">
                  Amount to Pay: {formatCurrency(total)}
                </p>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                {polling && !error && (
                  <div className="mt-2">
                    <p className="text-sm text-blue-600">
                      Awaiting payment confirmation...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Please complete the payment on your phone. This may take up to 2 minutes.
                    </p>
                  </div>
                )}
                {pollingTimeout && (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => {
                        setPollingTimeout(false);
                        setError("");
                        setPhoneNumber("");
                      }}
                      className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => navigate("/orders")}
                      className="w-full rounded-lg bg-gray-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
                    >
                      Check Order Status
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleMpesaPayment}
                disabled={loading || polling || pollingTimeout}
                className="flex w-full items-center justify-center rounded-lg bg-green-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                ) : null}
                {loading
                  ? "Initiating Payment..."
                  : polling
                  ? "Awaiting Payment..."
                  : "Pay with M-Pesa"}
              </button>
            </div>

            <div className="mt-6 grow sm:mt-8 lg:mt-0">
              <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Order ID: {orderId}
                  </p>
                </div>
                <dl className="flex items-center justify-between gap-4">
                  <dt className="text-base font-normal text-gray-500">
                    Subtotal
                  </dt>
                  <dd className="text-base font-medium text-gray-900">
                    {formatCurrency(subtotal)}
                  </dd>
                </dl>
                <dl className="flex items-center justify-between gap-4">
                  <dt className="text-base font-normal text-gray-500">
                    Delivery Fee
                  </dt>
                  <dd className="text-base font-medium text-gray-900">
                    {formatCurrency(deliveryFee)}
                  </dd>
                </dl>

                <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2">
                  <dt className="text-base font-bold text-gray-900">
                    Total
                  </dt>
                  <dd className="text-base font-bold text-gray-900">
                    {formatCurrency(total)}
                  </dd>
                </dl>
              </div>

              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <span className="font-medium text-green-800">
                    M-Pesa
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-green-500 sm:mt-8">
            Payment processed via{" "}
            <a
              href="https://www.safaricom.co.ke/"
              className="font-medium text-green-600 underline hover:no-underline"
            >
              M-Pesa
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Payment;
