import React from "react";
import { useShoppingCart } from "../context/ShoppingCartContext";

const DeliveryOptions: React.FC = () => {
  const { deliveryMethod, setDeliveryMethod } = useShoppingCart();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
        Delivery Methods
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Free Pickup from Store */}
        <div 
          className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border transform hover:-translate-y-1 cursor-pointer ${
            deliveryMethod === "pickup"
              ? 'border-blue-200 ring-2 ring-blue-100'
              : 'border-gray-100 hover:border-blue-200'
          }`}
          onClick={() => setDeliveryMethod("pickup")}
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex items-center mt-1">
                <input
                  id="pickup"
                  type="radio"
                  name="delivery-method"
                  value="pickup"
                  checked={deliveryMethod === "pickup"}
                  onChange={(e) => setDeliveryMethod(e.target.value as "pickup" | "delivery")}
                  className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <label 
                    htmlFor="pickup" 
                    className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Free Pickup from Store
                  </label>
                </div>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Collect your order at our store for free. Perfect for those who prefer to pick up their items personally.
                </p>
                <div className="flex items-center">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">
                    FREE
                  </span>
                  <span className="ml-2 text-sm text-gray-500">• Available during store hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery (at a fee) */}
        <div 
          className={`group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border transform hover:-translate-y-1 cursor-pointer ${
            deliveryMethod === "delivery"
              ? 'border-blue-200 ring-2 ring-blue-100'
              : 'border-gray-100 hover:border-blue-200'
          }`}
          onClick={() => setDeliveryMethod("delivery")}
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex items-center mt-1">
                <input
                  id="delivery"
                  type="radio"
                  name="delivery-method"
                  value="delivery"
                  checked={deliveryMethod === "delivery"}
                  onChange={(e) => setDeliveryMethod(e.target.value as "pickup" | "delivery")}
                  className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414A1 1 0 0117.414 13H20" />
                    </svg>
                  </div>
                  <label 
                    htmlFor="delivery" 
                    className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    Home Delivery
                  </label>
                </div>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Have your order delivered directly to your address. Convenient and reliable delivery service.
                </p>
                <div className="flex items-center">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-sm font-bold bg-clip-text text-transparent border border-blue-200">
                    Fee applies
                  </span>
                  <span className="ml-2 text-sm text-gray-500">• 1-3 business days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOptions;