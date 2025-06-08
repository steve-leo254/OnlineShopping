import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  Lock,
  CheckCircle,
} from "lucide-react";
import DeliveryDetails from "../components/DeliveryDetails";
import AddDeliveryDetails from "../components/AddDeliveryDetails";
import DeliveryOptions from "../components/deliveryOptions";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../cart/formatCurrency";

const Checkout = () => {
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
    paymentMethod,
  } = useShoppingCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
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
    paymentMethod: "mpesa", // Default to mpesa for this task
    mpesaPhone: "",
  });
  const [orderId, setOrderId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Add state to preserve order details after cart is cleared
  const [savedOrderDetails, setSavedOrderDetails] = useState({
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    total: 0,
    address: null,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStepChange = (step) => {
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
      throw new Error("Failed to create order");
    }
    clearCart();
    const data = await response.json();
    return data.order_id;
  };

  const initiateTransaction = async (orderId, phoneNumber, amount) => {
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

  const checkTransactionStatus = async (orderId) => {
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

      const checkoutRequestID = await initiateTransaction(
        orderId,
        formattedPhone,
        total // Use saved total instead
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
    } catch (err) {
      setPaymentStatus("error");
      setErrorMessage(err.message || "Failed to initiate payment");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.paymentMethod === "mpesa" && orderId) {
      navigate("/order-confirmation", { state: { orderId } });
    } else if (formData.paymentMethod === "cod") {
      try {
        const orderId = await createOrder();
        navigate("/order-confirmation", {
          state: {
            orderId,
            orderDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            name: selectedAddress
              ? `${selectedAddress.first_name} ${selectedAddress.last_name}`
              : "Store Pickup",
            address:
              deliveryMethod === "delivery" && selectedAddress
                ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.region}`
                : "Store Pickup",
            phoneNumber: selectedAddress?.phone_number || "N/A",
            deliveryMethod,
            paymentMethod,
          },
          replace: true,
        });
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
                  <AddDeliveryDetails />
                  <div className="w-full">
                    <button
                      type="button"
                      className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5"
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
                          d="M5 12h14m-7 7V5"
                        />
                      </svg>
                      <span>Add new address</span>
                    </button>
                  </div>
                  <DeliveryOptions />
                </div>

                <div className="flex justify-end mt-6 sm:mt-8">
                  <button
                    type="button"
                    onClick={() => handleStepChange(2)}
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
                  >
                    Continue to Payment
                  </button>
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
                      src={item.img_url}
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
    </div>
  );
};

export default Checkout;
