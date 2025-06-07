import React from "react";
import { useNavigate } from "react-router-dom";
import { useShoppingCart } from "../context/ShoppingCartContext";
import CartItem from "../components/CartItem";
import { formatCurrency } from "../cart/formatCurrency";
import { ShoppingBag, CreditCard, Lock, ArrowRight,Tag, Gift } from "lucide-react";

const ShoppingCart: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, cartQuantity, subtotal } = useShoppingCart();

  // Handle empty cart
  if (cartItems.length === 0) {
    return <div className="text-center">Your cart is empty.</div>;
  }

  // Navigate to checkout page
  const handleCheckout = () => {
    navigate("/checkout", {
      state: {
        subtotal: subtotal,
      },
    });
  };

  return (
    <section className="bg-white py-8 antialiased md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6">
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          <span className="text-blue-800 font-medium">Shopping Cart</span>
        </div>
        <div className="mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8">
          <div className="mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl">
            <div className="space-y-6">
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
          </div>

          <div className="mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden space-y-4  ">
              {/* ===== */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <CreditCard className="w-6 h-6" />
                  <span>Order Summary</span>
                </h2>
              </div>

              {/* === */}

              <div className="space-y-4">
                <div className="space-y-2">
                  <dl className="flex items-center justify-between gap-4">
                    <dt className="text-base font-normal text-gray-600">
                      Items total ({cartQuantity})
                    </dt>
                    <dd className="text-base font-medium text-gray-800">
                      {formatCurrency(subtotal)}
                    </dd>
                  </dl>
                </div>

                <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                  <dt className="text-base font-bold text-gray-900">
                    Subtotal
                  </dt>
                  <dd className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(subtotal)}
                  </dd>
                </dl>
              </div>

              <button
                onClick={handleCheckout}
                className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Lock className="w-5 h-5" />
                <span>Secure Checkout</span>
                    <span className="bg-white/20 px-2 py-1 rounded-lg text-sm">
                      {formatCurrency(subtotal)}
                    </span>
              </button>

              <div className=" text-center">
                <span className="text-gray-400 text-sm">or</span>
                 <a
                      href="/store"
                      className="group flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mt-2 transition-colors"
                    >
                      <span>Continue Shopping</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
              </div>
              {/* ================ */}
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
              {/* ====================== */}
               
              {/* ============================= */}
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
                      <label htmlFor="voucher" className="block text-sm font-medium text-gray-700 mb-2">
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
  );
};

export default ShoppingCart;
