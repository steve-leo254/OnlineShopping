import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ShoppingCart,
  Search,
  CreditCard,
  DollarSign,
  Trash2,
  Plus,
  Minus,
  Package,
  Users,
  BarChart3,
} from "lucide-react";
import { useFetchProducts } from "../../components/UseFetchProducts";
import { formatCurrency } from "../../cart/formatCurrency";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const POSApp = () => {
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([
    { id: "all", name: "All Items", icon: "📦" },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showPayment, setShowPayment] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "" });

  // Use the custom hook to fetch products
  const { products, isLoading, fetchProducts } = useFetchProducts();

  // Fetch products and categories from API
  useEffect(() => {
    fetchProducts(
      1,
      100,
      "",
      selectedCategory !== "all" ? selectedCategory : null
    );
    // Fetch categories
    axios
      .get(`${API_BASE_URL}/public/categories`)
      .then((res) =>
        setCategories([
          { id: "all", name: "All Items", icon: "📦" },
          ...res.data.map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: "📦", // You can customize icons per category if you want
          })),
        ])
      )
      .catch((err) => console.error("Failed to fetch categories", err));
    // eslint-disable-next-line
  }, []);

  // Refetch products when category or search changes
  useEffect(() => {
    fetchProducts(
      1,
      100,
      searchTerm,
      selectedCategory !== "all" ? selectedCategory : null
    );
    // eslint-disable-next-line
  }, [searchTerm, selectedCategory]);

  const filteredProducts = products; // Filtering is handled by the hook's fetch

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, change) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTax = () => {
    return calculateTotal() * 0.08; // 8% tax
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateTax();
  };

  const clearCart = () => {
    setCart([]);
    setShowPayment(false);
    setCustomerInfo({ name: "", phone: "" });
  };

  const processPayment = () => {
    // Simulate payment processing
    alert(
      `Payment of $${calculateGrandTotal().toFixed(
        2
      )} processed successfully via ${paymentMethod}!`
    );
    clearCart();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Products */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Point of Sale
            </h1>
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Category Filters */}
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          {/* Products Grid */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center text-gray-500">
                Loading products...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="text-center">
                      {/* Use first image if available, else fallback */}
                      <div className="text-4xl mb-2">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={`${API_BASE_URL}${product.images[0].img_url}`}
                            alt={product.name}
                            className="mx-auto h-16 object-contain"
                          />
                        ) : (
                          <span role="img" aria-label="product">
                            📦
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Stock: {product.stock_quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Right Panel - Cart */}
      <div className="w-96 bg-white shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
            <div className="flex items-center text-blue-600">
              <ShoppingCart className="w-5 h-5 mr-2" />
              <span className="font-semibold">
                {cart.reduce((total, item) => total + item.quantity, 0)} items
              </span>
            </div>
          </div>
        </div>
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {cart.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 text-red-600 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Order Total */}
        {cart.length > 0 && (
          <div className="border-t p-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%):</span>
                <span>{formatCurrency(calculateTax())}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">
                  {formatCurrency(calculateGrandTotal())}
                </span>
              </div>
            </div>
            {/* Customer Info */}
            <div className="space-y-2 mb-4">
              <input
                type="text"
                placeholder="Customer name (optional)"
                value={customerInfo.name}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={customerInfo.phone}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-2 rounded-lg border text-sm font-medium ${
                    paymentMethod === "cash"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  <DollarSign className="w-4 h-4 mx-auto mb-1" />
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-2 rounded-lg border text-sm font-medium ${
                    paymentMethod === "card"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1" />
                  Card
                </button>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Clear Cart
              </button>
              <button
                onClick={processPayment}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Pay {formatCurrency(calculateGrandTotal())}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSApp;
