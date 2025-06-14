import React from "react";
import { useShoppingCart } from "../context/ShoppingCartContext";

const PaymentOptions: React.FC = () => {
  const { paymentMethod, setPaymentMethod } = useShoppingCart();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
        Payment Options
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Pay Now Option */}
        <div 
          className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border transform hover:-translate-y-1 cursor-pointer ${
            paymentMethod === "pay-online"
              ? 'border-blue-200 ring-2 ring-blue-100'
              : 'border-gray-100 hover:border-blue-200'
          }`}
          onClick={() => setPaymentMethod("pay-online")}
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex items-center mt-1">
                <input
                  id="pay-online"
                  type="radio"
                  name="payment-method"
                  value="pay-online"
                  checked={paymentMethod === "pay-online"}
                  onChange={(e) => setPaymentMethod(e.target.value as "pay-online" | "pay-later")}
                  className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <label 
                    htmlFor="pay-online" 
                    className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Pay Now with M-Pesa
                  </label>
                </div>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Pay instantly via M-Pesa mobile money. Quick, secure, and convenient digital payment.
                </p>
                <div className="flex items-center">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">
                    INSTANT
                  </span>
                  <span className="ml-2 text-sm text-gray-500">• Secure & Fast</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pay Later Option */}
        <div 
          className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border transform hover:-translate-y-1 cursor-pointer ${
            paymentMethod === "pay-online"
              ? 'border-blue-200 ring-2 ring-blue-100'
              : 'border-gray-100 hover:border-blue-200'
          }`}
          onClick={() => setPaymentMethod("pay-online")}
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex items-center mt-1">
                <input
                  id="pay-online"
                  type="radio"
                  name="payment-method"
                  value="pay-online"
                  checked={paymentMethod === "pay-online"}
                  onChange={(e) => setPaymentMethod(e.target.value as "pay-online" | "pay-later")}
                  className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <label 
                    htmlFor="pay-online" 
                    className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Pay on Delivery/Pickup
                  </label>
                </div>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Pay when you receive or pick up your order. Cash or mobile money accepted upon delivery.
                </p>
                <div className="flex items-center">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-600 to-yellow-600 px-3 py-1 text-sm font-bold bg-clip-text text-transparent border border-orange-200">
                    FLEXIBLE
                  </span>
                  <span className="ml-2 text-sm text-gray-500">• Cash or M-Pesa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptions;