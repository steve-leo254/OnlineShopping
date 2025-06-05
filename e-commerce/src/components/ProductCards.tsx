import React, { useEffect} from "react";
import { toast } from "react-toastify";
import { useFetchProducts } from "./UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";

interface ProductCardsProps {
  searchTerm: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const ProductCards: React.FC<ProductCardsProps> = ({ searchTerm, currentPage, setCurrentPage }) => {
     // Use the custom hook to fetch products
      const { isLoading, products, totalPages, error, fetchProducts } =
        useFetchProducts();
      // state for the cart
      const { addToCart } = useShoppingCart();
      // Define the image endpoint
      const imgEndPoint = "http://127.0.0.1:8000";
    
      const limit = 8; // Number of products per page
    
      // Fetch products when page or search term changes
      useEffect(() => {
        fetchProducts(currentPage, limit, searchTerm);
      }, [currentPage, searchTerm, fetchProducts]);
    
      // Helper function for adding to cart with toast notification
      const addToCartWithToast = (product: Product) => {
        // Add item to cart
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          img_url: imgEndPoint + product.img_url,
        });
    
        // Show toast notification
        toast.success(`${product.name} added to cart!`);
      };
    
  return (
    <>
     
          {/* Product Grid */}
          {isLoading ? (
            <div className="text-center text-gray-900 dark:text-white">
              Loading products...
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400">
              Error: {error}
            </div>
          ) : (
            <div className="mb-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="h-40 w-full">
                    <a href="#">
                      <img
                        className="mx-auto h-full w-full object-cover rounded dark:block"
                        src={imgEndPoint + product.img_url}
                        alt={product.name}
                      />
                    </a>
                  </div>
                  <div className="pt-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="bg-blue-400 me-1 rounded bg-primary-100 px-1.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                        Up to 35% off
                      </span>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          data-tooltip-target={`tooltip-quick-look-${product.id}`}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                          <span className="sr-only">Quick look</span>
                          <svg
                            className="h-4 w-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              stroke-width="2"
                              d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
                            />
                            <path
                              stroke="currentColor"
                              stroke-width="2"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          data-tooltip-target={`tooltip-add-to-favorites-${product.id}`}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                          <span className="sr-only">Add to Favorites</span>
                          <svg
                            className="h-4 w-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 6C6.5 1 1 8 5.8 13l6.2 7 6.2-7C23 8 17.5 1 12 6Z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <a
                      href="#"
                      className="text-sm font-semibold leading-tight text-gray-900 hover:underline dark:text-white line-clamp-2"
                    >
                      {product.name}
                    </a>
                    <div className="mt-1 flex items-center gap-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className="h-3 w-3 text-yellow-400"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        5.0
                      </p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        (455)
                      </p>
                    </div>
                    <ul className="mt-1 flex items-center gap-2 text-xs">
                      <li className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3 text-gray-500 dark:text-gray-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                          />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400">
                          Fast
                        </p>
                      </li>
                      <li className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3 text-gray-500 dark:text-gray-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-width="2"
                            d="M8 7V6c0-.6.4-1 1-1h11c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1h-1M3 18v-7c0-.6.4-1 1-1h11c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1H4a1 1 0 0 1-1-1Zm8-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                          />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400">
                          Best Price
                        </p>
                      </li>
                    </ul>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-base font-extrabold leading-tight text-gray-900 dark:text-white">
                        {formatCurrency(product.price)}
                      </p>
                      <button
                        type="button"
                        className="bg-blue-600 inline-flex items-center rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                        onClick={() => addToCartWithToast(product)}
                      >
                        <svg
                          className="-ms-1 me-1 h-4 w-4"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4h1.5L8 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm.75-3H7.5M11 7H6.312M17 4v6m-3-3h6"
                          />
                        </svg>
                        Add to cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`mx-1 rounded-lg px-3 py-1 ${
                      currentPage === page
                        ? "bg-primary-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
    </>
  );
};

export default ProductCards;