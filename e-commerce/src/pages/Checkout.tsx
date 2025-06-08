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
  const { cartItems, selectedAddress, deliveryFee, subtotal, total } = useShoppingCart();

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
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

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
    const cartPayload = {
      cart: cartItems.map(item => ({ id: item.id, quantity: item.quantity })),
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
    const data = await response.json();
    return data.order_id;
  };

  const initiateTransaction = async (orderId: number, phoneNumber: string, amount: number) => {
    const transactionData = {
      order_id: orderId,
      phone_number: phoneNumber,
      amount: amount,
    };
    const response = await fetch("http://localhost:8000/payments/lnmo/transact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });
    if (!response.ok) {
      throw new Error("Failed to initiate transaction");
    }
    const data = await response.json();
    return data.CheckoutRequestID;
  };

  const checkTransactionStatus = async (orderId: number) => {
    const response = await fetch("http://localhost:8000/payments/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id: orderId.toString() }),
    });
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

      await initiateTransaction(orderId, formattedPhone, total);

      const interval = setInterval(async () => {
        const status = await checkTransactionStatus(orderId);
        if (status === 4) { // ACCEPTED
          clearInterval(interval);
          setPaymentStatus("success");
          handleStepChange(3);
        } else if (status === 3 || status === 2) { // REJECTED or CANCELLED
          clearInterval(interval);
          setPaymentStatus("error");
          setErrorMessage("Payment was rejected or cancelled");
        }
      }, 5000);

      setTimeout(() => {
        clearInterval(interval);
        if (paymentStatus === "processing") {
          setPaymentStatus("error");
          setErrorMessage("Payment confirmation timed out");
        }
      }, 120000);

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
        navigate("/order-confirmation", { state: { orderId } });
      } catch (err) {
        setErrorMessage("Failed to place order");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 ">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Complete Your Order
          </h1>
          <p className="text-gray-600">Secure checkout process</p>
        </div>

        <div className="mb-8  ">
          <div className="flex items-center justify-center space-x-8 ">
            {[
              { step: 1, label: "Delivery", icon: Truck },
              { step: 2, label: "Payment", icon: CreditCard },
              { step: 3, label: "Review", icon: CheckCircle },
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep >= step
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <span
                  className={`ml-2 font-medium ${
                    currentStep >= step ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 ml-4 rounded-full ${
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <MapPin className="text-blue-600 mr-3" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Delivery Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:col-span-2">
                  <DeliveryDetails />
                  <AddDeliveryDetails />
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <svg
                        className="h-5 w-5"
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
                      Add new address
                    </button>
                  </div>
                  <DeliveryOptions />
                </div>

                <div className="flex justify-end mt-8">
                  <button
                    type="button"
                    onClick={() => handleStepChange(2)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <CreditCard className="text-blue-600 mr-3" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Payment Information
                  </h2>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            formData.paymentMethod === id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon
                              className={`mr-3 ${
                                formData.paymentMethod === id
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                              size={20}
                            />
                            <span
                              className={`font-medium ${
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
                  <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center mb-4">
                      <Phone className="text-green-600 mr-3" size={24} />
                      <h3 className="text-lg font-medium text-green-900">
                        M-Pesa Payment
                      </h3>
                    </div>
                    {paymentStatus === "processing" ? (
                      <div className="space-y-2">
                        <p className="text-green-700">Awaiting payment confirmation...</p>
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
                        <p className="text-green-700 mb-4">
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
                            className="w-full px-4 py-3 rounded-lg border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            placeholder="e.g., 0712345678 or 254712345678"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleInitiatePayment}
                          className="w-full bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 mt-5"
                        >
                          Initiate Payment
                        </button>
                      </>
                    )}
                    {paymentStatus === "error" && (
                      <p className="text-red-600 mt-4">{errorMessage}</p>
                    )}
                  </div>
                )}

                {formData.paymentMethod === "cod" && (
                  <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center mb-4">
                      <Truck className="text-yellow-600 mr-3" size={24} />
                      <h3 className="text-lg font-medium text-yellow-900">
                        Cash on Delivery
                      </h3>
                    </div>
                    <p className="text-yellow-700">
                      Pay with cash when your order is delivered. Additional
                      delivery charges may apply.
                    </p>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => handleStepChange(1)}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
                  >
                    Back to Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepChange(3)}
                    disabled={formData.paymentMethod === "mpesa" && paymentStatus !== "success"}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center mb-6">
                  <CheckCircle className="text-blue-600 mr-3" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Review Your Order
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delivery Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">
                      {selectedAddress ? `${selectedAddress.first_name} ${selectedAddress.last_name}` : `${formData.firstName} ${formData.lastName}`}
                    </p>
                    <p className="text-gray-600">{selectedAddress ? selectedAddress.phone_number : formData.phone}</p>
                    <p className="text-gray-600">{selectedAddress ? selectedAddress.address : formData.address}</p>
                    <p className="text-gray-600">
                      {selectedAddress ? `${selectedAddress.city}, ${selectedAddress.region}` : `${formData.city}, ${formData.county}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Payment Method
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium capitalize">
                      {formData.paymentMethod === "mpesa" && "M-Pesa"}
                      {formData.paymentMethod === "cod" && "Cash on Delivery"}
                    </p>
                    {formData.paymentMethod === "mpesa" && orderId && (
                      <p className="text-green-600">Payment Confirmed</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={() => handleStepChange(2)}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
                  >
                    Back to Payment
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-25">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h3>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={item.img_url}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {item.name}
                      </h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-600">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium text-gray-600">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3 text-gray-900">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Lock size={16} />
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