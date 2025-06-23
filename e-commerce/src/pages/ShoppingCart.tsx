import React from "react";
import {
  ShoppingBag,
  ArrowRight,
  Tag,
  Gift,
  Lock,
  CreditCard,
  Truck,
  Package,
} from "lucide-react";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

interface CartItem {
  id: number;
  name: string;
  price: number;
  img_url: string | string[] | null;
  quantity: number;
  stockQuantity: number;
}

// Modify CartItem to accept stockQuantity
interface CartItemProps {
  id: number;
  name: string;
  price: number;
  img_url: string | string[] | null;
  quantity: number;
  stockQuantity: number;
}

const CartItem = ({
  id,
  name,
  price,
  img_url,
  quantity,
  stockQuantity,
}: CartItemProps) => {
  const { increaseCartQuantity, decreaseCartQuantity } = useShoppingCart();

  // Determine the image to display
  let displayImg = "";
  if (Array.isArray(img_url)) {
    displayImg = img_url.length > 0 ? img_url[0] : "";
  } else if (typeof img_url === "string") {
    displayImg = img_url;
  }

  // Function to handle quantity increase with stock check
  const handleIncreaseQuantity = () => {
    if (quantity >= stockQuantity) {
      toast.warning(
        `Cannot add more than available stock (${stockQuantity}) for ${name}`
      );
      return; // Prevent increasing quantity
    }
    increaseCartQuantity(id);
    toast.success(`${name} quantity increased to ${quantity + 1}!`);
  };

  // Function to handle quantity decrease with alert
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      decreaseCartQuantity(id);
      toast.warning(`${name} quantity decreased to ${quantity - 1}!`);
    } else {
      decreaseCartQuantity(id);
      toast.info(`${name} removed from cart!`);
    }
  };

  return (
    <div className="group bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1 relative animate-fade-in-up">
      <div className="p-6 md:p-8">
        {" "}
        {/* Increased padding */}
        <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-center">
          {" "}
          {/* Aligned items better */}
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <div className="w-full sm:w-40 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner">
              {" "}
              {/* Larger, rounded image */}
              <img
                src={displayImg}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-base font-bold px-3 py-1.5 rounded-full shadow-md animate-bounce-subtle">
              {" "}
              {/* Larger quantity badge with animation */}
              {quantity}x
            </div>
          </div>
          {/* Product Details */}
          <div className="flex-1 space-y-4 text-center sm:text-left">
            {" "}
            {/* Centered text for small screens */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {name}
              </h3>
              <p className="text-gray-600 mt-2 flex items-center justify-center sm:justify-start gap-2">
                {" "}
                {/* Added icons */}
                <Package className="w-4 h-4 text-green-500" />
                <span>In Stock: {stockQuantity} available</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4">
              {" "}
              {/* Better alignment */}
              <div className="space-y-1 mb-4 sm:mb-0">
                <p className="text-sm text-gray-500">Unit Price</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(price)}
                </p>
              </div>
              {/* Quantity Controls */}
              <div className="flex items-center space-x-3 bg-gray-100 rounded-full p-1.5 shadow-inner">
                {" "}
                {/* Styled quantity controls */}
                <button
                  onClick={handleDecreaseQuantity}
                  className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all duration-300 hover:scale-110 transform active:scale-95"
                >
                  <span className="font-bold text-xl">−</span>
                </button>
                <span className="w-10 text-center font-bold text-gray-900 text-lg">
                  {quantity}
                </span>
                <button
                  onClick={handleIncreaseQuantity}
                  disabled={quantity >= stockQuantity} // Disable button if quantity is at or above stock
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 transform active:scale-95 ${
                    quantity >= stockQuantity
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                  }`}
                >
                  <span className="font-bold text-xl">+</span>
                </button>
              </div>
              <div className="text-center sm:text-right space-y-1 mt-4 sm:mt-0">
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4 py-16">
        <div className="text-center space-y-8 max-w-lg mx-auto p-8 bg-white rounded-3xl shadow-xl border border-gray-100 animate-fade-in">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
            <ShoppingBag
              className="w-16 h-16 text-blue-600"
              strokeWidth={1.5}
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Your cart is feeling a bit lonely...
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Looks like you haven't added any items to your cart yet. Let's fill
            it with some awesome products!
          </p>
          <button
            onClick={() => navigate("/store")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center mx-auto space-x-2"
          >
            <ArrowRight className="w-5 h-5" />
            <span>Start Exploring Products</span>
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
      <section className="py-12 lg:py-20">
        {" "}
        {/* Increased vertical padding */}
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            {" "}
            {/* Increased bottom margin */}
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6 shadow-md">
              {" "}
              {/* Added shadow to badge */}
              <ShoppingBag className="w-5 h-5 text-blue-600" />{" "}
              {/* Larger icon */}
              <span className="text-blue-800 font-semibold text-lg">
                Your Shopping Cart
              </span>{" "}
              {/* Bolder text */}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
              {" "}
              {/* Larger, bolder, tighter leading */}
              Ready to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Checkout?
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {" "}
              {/* Wider, more relaxed text */}
              Review your items and proceed to our secure checkout process.
              Fast, simple, and secure!
            </p>
          </div>
          <div className="lg:grid lg:grid-cols-3 lg:gap-10">
            {" "}
            {/* Increased gap */}
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              {" "}
              {/* Increased vertical spacing */}
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  img_url={item.img_url}
                  quantity={item.quantity}
                  stockQuantity={item.stockQuantity} // Pass stockQuantity
                />
              ))}
            </div>
            {/* Order Summary Sidebar */}
            <div className="mt-10 lg:mt-0 space-y-8 animate-fade-in-right">
              {" "}
              {/* Increased vertical spacing, added animation */}
              {/* Order Summary */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center space-x-3">
                  {" "}
                  {/* Added space for icon */}
                  <CreditCard className="w-7 h-7 text-white" />{" "}
                  {/* Larger icon */}
                  <h2 className="text-2xl font-bold text-white">
                    Order Summary
                  </h2>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                  {" "}
                  {/* Increased padding */}
                  {/* Items Summary */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 text-lg">
                        Items ({cartQuantity})
                      </span>
                      <span className="font-semibold text-gray-900 text-xl">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-4">
                      <span className="text-2xl font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>
                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    className="cursor-pointer group w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center space-x-3 shadow-lg"
                  >
                    <Lock className="w-6 h-6" /> {/* Larger icon */}
                    <span>
                      {isAuthenticated
                        ? "Secure Checkout"
                        : "Login to Checkout"}
                    </span>
                    <span className="bg-white/20 px-3 py-1.5 rounded-xl text-base">
                      {" "}
                      {/* Larger badge */}
                      {formatCurrency(subtotal)}
                    </span>
                  </button>
                  {/* Continue Shopping */}
                  <div className="text-center pt-4">
                    {" "}
                    {/* Added padding top */}
                    <p className="text-gray-400 text-sm mb-3">or</p>
                    <a
                      href="/store"
                      className="group flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-lg transition-colors"
                    >
                      <span>Continue Shopping</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />{" "}
                      {/* Larger icon */}
                    </a>
                  </div>
                  {/* Trust Indicators */}
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-3 mt-6">
                    {" "}
                    {/* Increased padding, margin-top */}
                    <div className="flex items-center space-x-3 text-base text-gray-700">
                      {" "}
                      {/* Larger text, darker color */}
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>{" "}
                      {/* Larger dot */}
                      <span>Secure SSL Encryption</span>
                    </div>
                    <div className="flex items-center space-x-3 text-base text-gray-700">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span>7-Day Money Back Guarantee</span>
                    </div>
                    <div className="flex items-center space-x-3 text-base text-gray-700">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span>Free Returns & Exchanges</span>
                    </div>
                    <div className="flex items-center space-x-3 text-base text-gray-700">
                      {" "}
                      {/* New trust indicator */}
                      <Truck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span>Fast & Reliable Shipping</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Promo Code */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-5 flex items-center space-x-3">
                  {" "}
                  {/* Increased padding, added space for icon */}
                  <Gift className="w-6 h-6 text-white" /> {/* Larger icon */}
                  <h3 className="font-bold text-white text-xl">
                    Have a Promo Code?
                  </h3>
                </div>
                <div className="p-6 md:p-8">
                  {" "}
                  {/* Increased padding */}
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="voucher"
                        className="block text-base font-medium text-gray-700 mb-2"
                      >
                        Unlock exclusive savings!
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="voucher"
                          placeholder="Enter your code here"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 pr-12 text-gray-700 text-lg" // Larger text, thicker border
                        />
                        <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />{" "}
                        {/* Larger icon */}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        console.log("Apply promo code");
                        toast.info("Promo code functionality coming soon!");
                      }}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-md"
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
