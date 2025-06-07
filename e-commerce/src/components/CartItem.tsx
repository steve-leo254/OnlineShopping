import React from "react";
import { toast } from "react-toastify";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";

type CartItemProps = {
  id: number;
  name: string;
  price: number;
  img_url: string | null;
  quantity: number;
};

const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  price,
  img_url,
  quantity,
}) => {
  // state for the cart
  const {
    increaseCartQuantity,
    decreaseCartQuantity,
    removeFromCart,
  } = useShoppingCart();

  // Handler functions with toast notifications
  const handleIncreaseQuantity = () => {
    increaseCartQuantity(id);
    toast.success("Increased cart item quantity!");
  };

  const handleDecreaseQuantity = () => {
    decreaseCartQuantity(id);
    toast.info("Decreased cart item quantity!");
  };

  const handleRemoveFromCart = () => {
    removeFromCart(id);
    toast.error("Removed item from cart!");
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
        {/* Product Image */}
        <a href="#" className="shrink-0 md:order-1">
          <img className="h-20 w-20 dark" src={img_url} alt={name} />
        </a>

        {/* Quantity Controls and Price */}
        <label htmlFor={`counter-input-${id}`} className="sr-only">
          Choose quantity:
        </label>
        <div className="flex items-center justify-between md:order-3 md:justify-end">
          <div className="flex items-center">
            <button
              onClick={handleDecreaseQuantity}
              type="button"
              id={`decrement-button-${id}`}
              data-input-counter-decrement={`counter-input-${id}`}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
             <span className="text-gray-600 font-bold">−</span>
            </button>
            <input
              type="text"
              id={`counter-input-${id}`}
              data-input-counter
              className="w-10 shrink-0 border-0 bg-transparent text-center text-sm font-medium text-gray-900 focus:outline-none focus:ring-0"
              value={quantity}
              readOnly
            />
            <button
              onClick={handleIncreaseQuantity}
              type="button"
              id={`increment-button-${id}`}
              data-input-counter-increment={`counter-input-${id}`}
              className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
            >
              <span className="font-bold">+</span>
            </button>
          </div>
          <div className="text-end md:order-4 md:w-32">
            <p className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatCurrency(price * quantity)}{" "}
            </p>
          </div>
        </div>

        {/* Product Name and Actions */}
        <div className="w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md">
          <a
            href="#"
            className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors"
          >
            {name}
          </a>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 hover:underline dark:text-gray-400"
            >
              <svg
                className="me-1.5 h-5 w-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z"
                />
              </svg>
              Add to Favorites
            </button>
            <button
              onClick={handleRemoveFromCart}
              type="button"
              className="inline-flex items-center text-sm font-medium text-red-600 hover:underline dark:text-red-500"
            >
              <svg
                className="me-1.5 h-5 w-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18 17.94 6M18 18 6.06 6"
                />
              </svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;