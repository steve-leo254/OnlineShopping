import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";

type Product = {
  id: number;
  name: string;
  price: number;
};

type CartProduct = {
  product: Product;
  quantity: number;
};

const CartDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart } = useShoppingCart();
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);

  useEffect(() => {
    const fetchCartProducts = async () => {
      const promises = cartItems.map(async (item) => {
        try {
          const res = await axios.get<Product>(
            `${import.meta.env.VITE_API_BASE_URL}/public/products/${item.id}`
          );
          return { product: res.data, quantity: item.quantity };
        } catch (error) {
          console.error(`Error fetching product ${item.id}:`, error);
          return null;
        }
      });
      const results = await Promise.all(promises);
      const validProducts = results.filter(
        (result) => result !== null
      ) as CartProduct[];
      setCartProducts(validProducts);
    };

    if (cartItems.length > 0) {
      fetchCartProducts();
    } else {
      setCartProducts([]);
    }
  }, [cartItems]);

  const totalAmount = cartProducts.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const totalItems = cartProducts.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const handleProductClick = (productId: number) => {
    navigate(`/product-details/${productId}`);
  };

  const handleRemoveClick = (e: React.MouseEvent, productId: number) => {
    e.stopPropagation(); // Prevent navigation when clicking remove button
    removeFromCart(productId);
  };

  return (
    <div
      id="myCartDropdown1"
      className="hidden absolute right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden backdrop-blur-sm"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13l-1.1 5m0 0h12M6 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            <span className="hidden xs:inline">Shopping </span>Cart
          </h3>
          {cartProducts.length > 0 && (
            <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-full">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-h-60 sm:max-h-80 overflow-y-auto">
        {cartProducts.length > 0 ? (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {cartProducts.map((cartProduct) => (
              <div
                key={cartProduct.product.id}
                onClick={() => handleProductClick(cartProduct.product.id)}
                className="group relative bg-gradient-to-r from-gray-50 to-white rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-200 cursor-pointer"
              >
                {/* Product Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-sm font-semibold text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
                      {cartProduct.product.name}
                    </h4>
                    <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-3 text-sm space-y-1 xs:space-y-0">
                      <span className="text-blue-600 font-bold">
                        {formatCurrency(cartProduct.product.price)}
                      </span>
                      <span className="text-gray-500">
                        × {cartProduct.quantity}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-medium text-gray-600">
                      Subtotal:{" "}
                      {formatCurrency(
                        cartProduct.product.price * cartProduct.quantity
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) =>
                      handleRemoveClick(e, cartProduct.product.id)
                    }
                    className="flex-shrink-0 p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 group-hover:scale-110"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Quantity Indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {cartProduct.quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13l-1.1 5m0 0h12M6 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-medium mb-2 text-sm sm:text-base">
              Your cart is empty
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Add some items to get started!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {cartProducts.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 p-3 sm:p-4">
          {/* Total */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-sm font-medium text-gray-600">Total:</span>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <a
              href="/shopping-cart"
              className="block w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white text-center py-2.5 sm:py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <span className="flex items-center justify-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2"
                  />
                </svg>
                <span className="hidden xs:inline">View Full </span>Cart
              </span>
            </a>
          </div>
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-4 translate-x-4"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-400/10 to-blue-400/10 rounded-full translate-y-4 -translate-x-4"></div>
    </div>
  );
};

export default CartDropdown;
