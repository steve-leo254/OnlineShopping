import React from "react";
import {
  ShoppingBag,
  ArrowRight,
  Tag,
  Gift,
  Lock,
  CreditCard,
} from "lucide-react";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CartItem = ({ id, name, price, img_url, quantity }) => {
  const { increaseCartQuantity, decreaseCartQuantity } = useShoppingCart();

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              <img
                src={img_url}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {quantity}x
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {name}
              </h3>
              <p className="text-gray-600 mt-1">Premium Quality • In Stock</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Unit Price</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(price)}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => decreaseCartQuantity(id)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <span className="text-gray-600 font-bold">−</span>
                </button>
                <span className="w-8 text-center font-semibold text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={() => increaseCartQuantity(id)}
                  className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
                >
                  <span className="font-bold">+</span>
                </button>
              </div>

              <div className="text-right space-y-1">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {formatCurrency(price * quantity)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShoppingCart: React.FC = () => {
  const { cartItems, cartQuantity, subtotal } = useShoppingCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Handle empty cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your cart is empty
          </h2>
          <p className="text-gray-600">
            Looks like you haven't added any items to your cart yet.
          </p>
          <button
            onClick={() => navigate("/store")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  // Navigate to checkout page
  const handleCheckout = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      sessionStorage.setItem("checkoutData", JSON.stringify({ subtotal }));
      navigate("/login", {
        state: {
          from: "/cart",
          message: "Please log in to continue with checkout",
        },
      });
      return;
    }

    navigate("/checkout", {
      state: {
        subtotal: subtotal,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">Shopping Cart</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Your Selected
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Items
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Review your items and proceed to secure checkout
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  img_url={item.img_url}
                  quantity={item.quantity}
                />
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="mt-8 lg:mt-0 space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <CreditCard className="w-6 h-6" />
                    <span>Order Summary</span>
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Items Summary */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600">
                        Items ({cartQuantity})
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <span className="text-xl font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    className="cursor-pointer group w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <Lock className="w-5 h-5" />
                    <span>
                      {isAuthenticated
                        ? "Secure Checkout"
                        : "Login to Checkout"}
                    </span>
                    <span className="bg-white/20 px-2 py-1 rounded-lg text-sm">
                      {formatCurrency(subtotal)}
                    </span>
                  </button>

                  {/* Continue Shopping */}
                  <div className="text-center">
                    <span className="text-gray-400 text-sm">or</span>
                    <a
                      href="/store"
                      className="group flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mt-2 transition-colors"
                    >
                      <span>Continue Shopping</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>

                  {/* Trust Indicators */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Secure SSL Encryption</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>30-Day Money Back Guarantee</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Free Returns & Exchanges</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4">
                  <h3 className="font-bold text-white flex items-center space-x-2">
                    <Gift className="w-5 h-5" />
                    <span>Promo Code</span>
                  </h3>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="voucher"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Have a voucher or gift card?
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="voucher"
                          placeholder="Enter code here"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pr-12"
                        />
                        <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => console.log("Apply promo code")}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      Apply Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShoppingCart;
