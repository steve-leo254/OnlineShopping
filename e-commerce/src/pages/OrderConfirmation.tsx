import React from "react";
import { useLocation } from "react-router-dom";
import { useShoppingCart } from "../context/ShoppingCartContext";

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const { paymentMethod } = useShoppingCart();
  const {
    orderId = "Unknown",
    orderDate = "Unknown",
    name = "Unknown",
    address = "Unknown",
    phoneNumber = "Unknown",
  } = location.state || {};

  return (
    <section className="bg-white py-8 antialiased md:py-16">
      <div className="mx-auto max-w-2xl px-4 2xl:px-0">
        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl mb-2">
          Thanks for your order!
        </h2>
        <p className="text-gray-500 mb-6 md:mb-8">
          Your order{" "}
          <a
            href="#"
            className="font-medium text-gray-900 hover:underline hover:text-blue-600"
          >
            #{orderId}
          </a>{" "}
          will be processed within 24 hours during working days. We will notify
          you by email once your order has been shipped.
        </p>
        <div className="space-y-4 sm:space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-6 mb-6 md:mb-8">
          <dl className="sm:flex items-center justify-between gap-4">
            <dt className="font-normal mb-1 sm:mb-0 text-gray-500">
              Date
            </dt>
            <dd className="font-medium text-gray-900 sm:text-end">
              {orderDate}
            </dd>
          </dl>
          <dl className="sm:flex items-center justify-between gap-4">
            <dt className="font-normal mb-1 sm:mb-0 text-gray-500">
              Payment Method
            </dt>
            <dd className="font-medium text-gray-900 sm:text-end">
              {paymentMethod}
            </dd>
          </dl>
          <dl className="sm:flex items-center justify-between gap-4">
            <dt className="font-normal mb-1 sm:mb-0 text-gray-500">
              Name
            </dt>
            <dd className="font-medium text-gray-900 sm:text-end">
              {name}
            </dd>
          </dl>
          <dl className="sm:flex items-center justify-between gap-4">
            <dt className="font-normal mb-1 sm:mb-0 text-gray-500">
              Address
            </dt>
            <dd className="font-medium text-gray-900 sm:text-end">
              {address}
            </dd>
          </dl>
          <dl className="sm:flex items-center justify-between gap-4">
            <dt className="font-normal mb-1 sm:mb-0 text-gray-500">
              Phone
            </dt>
            <dd className="font-medium text-gray-900 sm:text-end">
              {phoneNumber}
            </dd>
          </dl>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="/orders-overview"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
          >
            Orders Overview
          </a>
          <a
            href="/store"
            className="py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-600 focus:z-10 focus:ring-4 focus:ring-gray-100"
          >
            Return to shopping
          </a>
        </div>
      </div>
    </section>
  );
};

export default OrderConfirmation;
