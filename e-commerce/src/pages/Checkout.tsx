import { useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import {
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Lock,
  CheckCircle,
} from "lucide-react";
import DeliveryDetails from "../components/DeliveryDetails";

import DeliveryOptions from "../components/deliveryOptions";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../cart/formatCurrency";

// Define types
type CartItem = {
  id: number;
  name: string;
  price: number;
  img_url: string | null;
  quantity: number;
};

type Address = {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  city: string;
  region: string;
  is_default: boolean;
};

type OrderConfirmationData = {
  orderId: number;
  orderDate: string;
  name: string;
  address: string;
  phoneNumber: string;
  deliveryFee: number;
  subtotal: number;
  total: number;
  deliveryMethod: string;
  paymentMethod: string;
};

type SavedOrderDetails = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: Address | null;
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  additionalInfo: string;
  city: string;
  county: string;
  isDefault: boolean;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
  paymentMethod: string;
  mpesaPhone: string;
};

const Checkout = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [orderConfirmationData, setOrderConfirmationData] = useState<OrderConfirmationData | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const {
    cartItems,
    selectedAddress,
    deliveryFee,
    subtotal,
    total,
    clearCart,
    deliveryMethod,
  } = useShoppingCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    additionalInfo: "",
    city: "",
    county: "",
    isDefault: false,
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
    paymentMethod: "mpesa",
    mpesaPhone: "",
  });
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Add state to preserve order details after cart is cleared
  const [savedOrderDetails, setSavedOrderDetails] = useState<SavedOrderDetails>({
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    total: 0,
    address: null,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const createOrder = async () => {
    // Save order details before clearing cart
    setSavedOrderDetails({
      items: [...cartItems],
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: total,
      address: selectedAddress,
    });

    const cartPayload = {
      cart: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
      address_id: selectedAddress?.id,
      delivery_fee: deliveryFee,
    };
    const response = await fetch("http://localhost:8000/create_order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cartPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      // Handle specific error cases
      if (
        response.status === 400 &&
        errorData?.detail?.includes("Insufficient stock")
      ) {
        const error = new Error(
          "Insufficient stock for some items in your cart"
        );
        (error as any).details = errorData.detail;
        throw error;
      } else if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (response.status === 404) {
        throw new Error("Order service not available. Please try again later.");
      } else if (response.status >= 500) {
        throw new Error("Server error. Please try again in a few minutes.");
      } else {
        throw new Error(
          errorData?.detail || errorData?.message || "Failed to create order"
        );
      }
    }
    clearCart();
    const data = await response.json();
    return data.order_id;
  };

  const initiateTransaction = async (orderId: number, phoneNumber: string, amount: number) => {
    const transactionData = {
      order_id: orderId,
      phone_number: phoneNumber,
      amount: amount,
    };
    const response = await fetch(
      "http://localhost:8000/payments/lnmo/transact",
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

  const checkTransactionStatus = async (orderId: number) => {
    const response = await fetch(
      "http://localhost:8000/payments/transactions",
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

  const handleInitiatePayment = async () => {
    try {
      setPaymentStatus("processing");
      setErrorMessage("");

      const phoneRegex = /^(?:254[17]\d{8}|0[17]\d{8})$/;
      if (!phoneRegex.test(formData.mpesaPhone)) {
        throw new Error("Please enter a valid Kenyan phone number");
      }

      let formattedPhone = formData.mpesaPhone;
      if (formData.mpesaPhone.startsWith("0")) {
        formattedPhone = "254" + formData.mpesaPhone.substring(1);
      }

      const orderId = await createOrder();
      setOrderId(orderId);

      await initiateTransaction(
        orderId,
        formattedPhone,
        total
      );
      let attempts = 0;
      const maxAttempts = 24; // 2 minutes with 5-second intervals

      const interval = setInterval(async () => {
        attempts++;
        const status = await checkTransactionStatus(orderId);
        if (status === 4) {
          // ACCEPTED
          clearInterval(interval);
          // Update order status to "processing" after payment confirmation
          const response = await fetch(
            `http://localhost:8000/update-order-status/${orderId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: "processing" }),
            }
          );
          if (!response.ok) {
            throw new Error("Failed to update order status");
          }
          setPaymentStatus("success");
          handleStepChange(3); // Move to Review step
        } else if (status === 3 || status === 2) {
          // REJECTED or CANCELLED
          clearInterval(interval);
          setPaymentStatus("error");
          setErrorMessage("Payment was rejected or cancelled");
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentStatus("error");
          setErrorMessage("Payment confirmation timed out");
        }
      }, 5000);
    } catch (err: unknown) {
      setPaymentStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to initiate payment");
    }
  };

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (formData.paymentMethod === "mpesa" && orderId) {
      // For M-Pesa, show order confirmation modal with complete information
      const confirmationData: OrderConfirmationData = {
        orderId,
        orderDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        name: selectedAddress
          ? `${selectedAddress.first_name} ${selectedAddress.last_name}`
          : `${formData.firstName} ${formData.lastName}`,
        address:
          deliveryMethod === "delivery" && selectedAddress
            ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.region}`
            : deliveryMethod === "delivery"
            ? `${formData.address}, ${formData.city}, ${formData.county}`
            : "Store Pickup - Main Branch",
        phoneNumber: selectedAddress?.phone_number || formData.phone || "N/A",
        deliveryFee: deliveryFee || 0,
        subtotal: savedOrderDetails.subtotal || subtotal || 0,
        total: savedOrderDetails.total || total || 0,
        deliveryMethod: deliveryMethod || "delivery",
        paymentMethod: formData.paymentMethod,
      };

      setOrderConfirmationData(confirmationData);
      setShowOrderConfirmation(true);
    } else if (formData.paymentMethod === "cod") {
      try {
        const newOrderId = await createOrder();

        if (newOrderId) {
          // For COD, show order confirmation modal with complete information
          const confirmationData: OrderConfirmationData = {
            orderId: newOrderId,
            orderDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            name: selectedAddress
              ? `${selectedAddress.first_name} ${selectedAddress.last_name}`
              : `${formData.firstName} ${formData.lastName}`,
            address:
              deliveryMethod === "delivery" && selectedAddress
                ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.region}`
                : deliveryMethod === "delivery"
                ? `${formData.address}, ${formData.city}, ${formData.county}`
                : "Store Pickup - Main Branch",
            phoneNumber:
              selectedAddress?.phone_number || formData.phone || "N/A",
            deliveryFee: deliveryFee || 0,
            subtotal: subtotal || 0,
            total: total || 0,
            deliveryMethod: deliveryMethod || "delivery",
            paymentMethod: formData.paymentMethod,
          };

          setOrderConfirmationData(confirmationData);
          setShowOrderConfirmation(true);
        }
      } catch (err) {
        setErrorMessage("Failed to place order");
      }
    }
  };

  // Use current cart data or saved data depending on availability
  const displayItems =
    cartItems.length > 0 ? cartItems : savedOrderDetails.items;
  const displaySubtotal =
    cartItems.length > 0 ? subtotal : savedOrderDetails.subtotal;
  const displayDeliveryFee =
    cartItems.length > 0 ? deliveryFee : savedOrderDetails.deliveryFee;
  const displayTotal = cartItems.length > 0 ? total : savedOrderDetails.total;
  const displayAddress =
    cartItems.length > 0 ? selectedAddress : savedOrderDetails.address;

  const OrderConfirmationModal = () => {
    if (!showOrderConfirmation || !orderConfirmationData) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-20 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowOrderConfirmation(false);
            navigate(`/order-details/${orderConfirmationData.orderId}`);
          }
        }}
      >
        <div className="bg-white  rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh]  border border-gray-100">
          <div className="p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setShowOrderConfirmation(false);
                navigate(`/order-details/${orderConfirmationData.orderId}`);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {/* Header with Thank You Message */}
            <div className="text-center mb-6">
              {" "}
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                Thank You!
              </h3>
              <p className="text-gray-600 text-base">
                Your order has been successfully placed
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50  p-5 rounded-xl mb-6 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-gray-900 ">
                    Order #{orderConfirmationData.orderId}
                  </p>
                  <p className="text-sm text-gray-600">
                    {orderConfirmationData.orderDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(orderConfirmationData.total)}
                  </p>
                  <p className="text-xs text-gray-500">Total Amount</p>
                </div>
              </div>
            </div>

            {/* What's Next Section */}
            <div className="mb-6 p-4 bg-blue-50  rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll receive order updates via SMS/email</li>
                <li>
                  • Our team will prepare your order for{" "}
                  {orderConfirmationData.deliveryMethod === "delivery"
                    ? "delivery"
                    : "pickup"}
                </li>
                <li>• Estimated delivery: 2-4 business days</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOrderConfirmation(false);
                  navigate("/store");
                }}
                className="flex-1 bg-gray-100 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium border border-gray-200 "
              >
                Continue Shopping
              </button>
              <button
                onClick={() => {
                  setShowOrderConfirmation(false);
                  navigate("/orders-overview");
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Complete Your Order
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Secure checkout process
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto pb-4">
            {[
              { step: 1, label: "Delivery", icon: Truck },
              { step: 2, label: "Payment", icon: CreditCard },
              { step: 3, label: "Review", icon: CheckCircle },
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep >= step
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon size={16} className="sm:w-5 sm:h-5" />
                </div>
                <span
                  className={`ml-1 sm:ml-2 font-medium text-xs sm:text-sm ${
                    currentStep >= step ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
                {step < 3 && (
                  <div
                    className={`w-8 sm:w-12 lg:w-16 h-1 ml-2 sm:ml-4 rounded-full ${
                      currentStep > step
                        ? "bg-gradient-to-r from-blue-600 to-purple-600"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {currentStep === 1 && (
              <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center mb-4 sm:mb-6">
                  <MapPin className="text-blue-600 mr-2 sm:mr-3" size={20} />
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Delivery Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <DeliveryDetails />
                  {/* <AddDeliveryDetails /> */}

                  <DeliveryOptions />
                </div>

                <div className="flex justify-end mt-6 sm:mt-8">
                  <div className="relative inline-block">
                    <button
                      type="button"
                      disabled={!selectedAddress}
                      onClick={() => handleStepChange(2)}
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="disabled:opacity-50 disabled:cursor-not-allowed px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
                    >
                      Continue to Payment
                    </button>

                    {!selectedAddress && showTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                        Please select an address to continue
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-red-600"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center mb-4 sm:mb-6">
                  <CreditCard
                    className="text-blue-600 mr-2 sm:mr-3"
                    size={20}
                  />
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Payment Information
                  </h2>
                </div>

                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { id: "mpesa", label: "M-Pesa", icon: Phone },
                      { id: "cod", label: "Cash on Delivery", icon: Truck },
                    ].map(({ id, label, icon: Icon }) => (
                      <label key={id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={id}
                          checked={formData.paymentMethod === id}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div
                          className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-300 ${
                            formData.paymentMethod === id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon
                              className={`mr-2 sm:mr-3 ${
                                formData.paymentMethod === id
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                              size={18}
                            />
                            <span
                              className={`font-medium text-sm sm:text-base ${
                                formData.paymentMethod === id
                                  ? "text-blue-600"
                                  : "text-gray-700"
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.paymentMethod === "mpesa" && (
                  <div className="p-4 sm:p-6 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <Phone
                        className="text-green-600 mr-2 sm:mr-3"
                        size={20}
                      />
                      <h3 className="text-base sm:text-lg font-medium text-green-900">
                        M-Pesa Payment
                      </h3>
                    </div>
                    {paymentStatus === "processing" ? (
                      <div className="space-y-2">
                        <p className="text-green-700 text-sm sm:text-base">
                          Awaiting payment confirmation...
                        </p>
                        <div className="flex justify-center">
                          <svg
                            className="animate-spin h-5 w-5 text-green-600"
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
                    ) : (
                      <>
                        <p className="text-green-700 mb-3 sm:mb-4 text-sm sm:text-base">
                          Enter your phone number to receive an M-Pesa prompt.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-2">
                            M-Pesa Phone Number *
                          </label>
                          <input
                            type="tel"
                            name="mpesaPhone"
                            value={formData.mpesaPhone}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
                            placeholder="e.g., 0712345678 or 254712345678"
                            style={{
                              color: "#000000",
                              backgroundColor: "#ffffff",
                              border: "1px solid #ccc",
                              padding: "12px",
                              fontSize: "16px",
                              borderRadius: "4px",
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleInitiatePayment}
                          className="w-full bg-green-500 hover:bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 mt-4 sm:mt-5 text-sm sm:text-base"
                        >
                          Pay now
                        </button>
                      </>
                    )}
                    {paymentStatus === "error" && (
                      <p className="text-red-600 mt-3 sm:mt-4 text-sm sm:text-base">
                        {errorMessage}
                      </p>
                    )}
                  </div>
                )}

                {formData.paymentMethod === "cod" && (
                  <div className="p-4 sm:p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <Truck
                        className="text-yellow-600 mr-2 sm:mr-3"
                        size={20}
                      />
                      <h3 className="text-base sm:text-lg font-medium text-yellow-900">
                        Cash on Delivery
                      </h3>
                    </div>
                    <p className="text-yellow-700 text-sm sm:text-base">
                      Pay with cash when your order is delivered. Additional
                      delivery charges may apply.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
                  <button
                    type="button"
                    onClick={() => handleStepChange(1)}
                    className="px-6 sm:px-8 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base order-2 sm:order-1"
                  >
                    Back to Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepChange(3)}
                    disabled={
                      formData.paymentMethod === "mpesa" &&
                      paymentStatus !== "success"
                    }
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center mb-4 sm:mb-6">
                  <CheckCircle
                    className="text-blue-600 mr-2 sm:mr-3"
                    size={20}
                  />
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Review Your Order
                  </h2>
                </div>

                <div className="space-y-4 mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    Delivery Information
                  </h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <p className="font-medium text-sm sm:text-base">
                      {displayAddress
                        ? `${displayAddress.first_name} ${displayAddress.last_name}`
                        : `${formData.firstName} ${formData.lastName}`}
                    </p>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {displayAddress
                        ? displayAddress.phone_number
                        : formData.phone}
                    </p>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {displayAddress
                        ? displayAddress.address
                        : formData.address}
                    </p>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {displayAddress
                        ? `${displayAddress.city}, ${displayAddress.region}`
                        : `${formData.city}, ${formData.county}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    Payment Method
                  </h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <p className="font-medium capitalize text-sm sm:text-base text-gray-500">
                      {formData.paymentMethod === "mpesa" && "M-Pesa"}
                      {formData.paymentMethod === "cod" && "Cash on Delivery"}
                    </p>
                    {formData.paymentMethod === "mpesa" && orderId && (
                      <p className="text-green-600 text-sm sm:text-base">
                        Payment Confirmed
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
                  <button
                    type="button"
                    onClick={() => handleStepChange(2)}
                    className="px-6 sm:px-8 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base order-2 sm:order-1"
                  >
                    Back to Payment
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base order-1 sm:order-2"
                  >
                    {orderId ? "Finish" : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 lg:sticky lg:top-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                Order Summary
              </h3>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                {displayItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={item.img_url || undefined}
                      alt={item.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {item.name}
                      </h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs sm:text-sm text-gray-500">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-sm sm:text-base">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 sm:space-y-3 border-t border-gray-200 pt-3 sm:pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm sm:text-base">
                    Subtotal
                  </span>
                  <span className="font-medium text-gray-600 text-sm sm:text-base">
                    {formatCurrency(displaySubtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm sm:text-base">
                    Delivery Fee
                  </span>
                  <span className="font-medium text-gray-600 text-sm sm:text-base">
                    {formatCurrency(displayDeliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold border-t border-gray-200 pt-2 sm:pt-3 text-gray-900">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(displayTotal)}
                  </span>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-500">
                <Lock size={14} className="sm:w-4 sm:h-4" />
                <span>Secure checkout protected by SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <OrderConfirmationModal />
    </div>
  );
};

export default Checkout;