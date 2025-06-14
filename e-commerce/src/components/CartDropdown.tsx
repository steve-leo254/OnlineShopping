import React, { useState, useEffect } from "react";
import axios from "axios";
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

  return (
    <div
      id="myCartDropdown1"
      className="hidden z-10 mx-auto max-w-sm space-y-4 overflow-hidden rounded-lg bg-white p-4 antialiased shadow-lg "
    >
      {cartProducts.length > 0 ? (
        cartProducts.map((cartProduct) => (
          <div key={cartProduct.product.id} className="grid grid-cols-2">
            <div>
              <a
                href="#"
                className="truncate text-sm font-semibold leading-none hover:underline font-bold text-gray-900 transition-colors"
              >
                {cartProduct.product.name}
              </a>
              <p className="mt-0.5 truncate text-sm font-normal text-gray-500 dark:text-gray-400">
                {formatCurrency(cartProduct.product.price)}
              </p>
            </div>
            <div className="flex items-center justify-end gap-6">
              <p className="text-sm font-normal leading-none text-gray-500 dark:text-gray-400">
                Qty: {cartProduct.quantity}
              </p>
              <button
                onClick={() => removeFromCart(cartProduct.product.id)}
                className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600"
              >
                <span className="sr-only">Remove</span>
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm7.7-3.7a1 1 0 0 0-1.4 1.4l2.3 2.3-2.3 2.3a1 1 0 1 0 1.4 1.4l2.3-2.3 2.3 2.3a1 1 0 0 0 1.4-1.4L13.4 12l2.3-2.3a1 1 0 0 0-1.4-1.4L12 10.6 9.7 8.3Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your cart is empty.
        </p>
      )}
      <a
        href="/shopping-cart"
        className="mb-2 me-2 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-blue-100  focus:outline-none focus:ring-4 focus:ring-blue-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        role="button"
      >
        Open Cart
      </a>
    </div>
  );
};

export default CartDropdown;
