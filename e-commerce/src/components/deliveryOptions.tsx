// deliveryOptions.tsx
import React from "react";
import { useShoppingCart } from "../context/ShoppingCartContext";

const DeliveryOptions: React.FC = () => {
  const { deliveryMethod, setDeliveryMethod } = useShoppingCart();

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery Methods</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Free Pickup from Store */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="pickup"
                type="radio"
                name="delivery-method"
                value="pickup"
                checked={deliveryMethod === "pickup"}
                onChange={(e) => setDeliveryMethod(e.target.value as "pickup" | "delivery")}
                className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
              />
            </div>
            <div className="ms-4 text-sm">
              <label htmlFor="pickup" className="font-medium leading-none text-gray-900 dark:text-white">
                Free Pickup from Store
              </label>
              <p className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                Collect your order at our store for free.
              </p>
            </div>
          </div>
        </div>
        {/* Delivery (at a fee) */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="delivery"
                type="radio"
                name="delivery-method"
                value="delivery"
                checked={deliveryMethod === "delivery"}
                onChange={(e) => setDeliveryMethod(e.target.value as "pickup" | "delivery")}
                className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
              />
            </div>
            <div className="ms-4 text-sm">
              <label htmlFor="delivery" className="font-medium leading-none text-gray-900 dark:text-white">
                Delivery (at a fee)
              </label>
              <p className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                Have your order delivered to your address (fee applies).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOptions;