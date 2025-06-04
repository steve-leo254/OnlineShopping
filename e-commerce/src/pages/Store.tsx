import React, { useState, useEffect } from "react";
import type { Product } from "../components/UseFetchProducts";
import { useFetchProducts } from "../components/UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify";
import ProductCards from "../components/ProductCards";

type StoreItemProps = {
  id: number;
  name: string;
  price: number;
  imgUrl: string;
};

const Store: React.FC = () => {
  // Use the custom hook to fetch products
  const { isLoading, products, totalPages, error, fetchProducts } =
    useFetchProducts();
  // state for the cart
  // const { addToCart } = useShoppingCart();
  // Define the image endpoint
  // const imgEndPoint = "http://127.0.0.1:8000";

  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10; // Number of products per page

  // Fetch products when page or search term changes
  useEffect(() => {
    fetchProducts(currentPage, limit, searchTerm);
  }, [currentPage, searchTerm, fetchProducts]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Helper function for adding to cart with toast notification
  // const addToCartWithToast = (product: Product) => {
  //   // Add item to cart
  //   addToCart({
  //     id: product.id,
  //     name: product.name,
  //     price: product.price,
  //     img_url: imgEndPoint + product.img_url,
  //   });

  //   // Show toast notification
  //   toast.success(`${product.name} added to cart!`);
  // };

  return (
    <>
      <section className="bg-gray-50 py-8 antialiased dark:bg-gray-900 md:py-12">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          {/* Heading & Filters */}
          <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                  <li className="inline-flex items-center">
                    <a
                      href="#"
                      className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white"
                    >
                      <svg
                        className="me-2.5 h-3 w-3"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                      </svg>
                      Home
                    </a>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg
                        className="h-5 w-5 text-gray-400 rtl:rotate-180"
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
                          d="m9 5 7 7-7 7"
                        />
                      </svg>
                      <a
                        href="#"
                        className="ms-1 text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white md:ms-2"
                      >
                        Products
                      </a>
                    </div>
                  </li>
                  <li aria-current="page">
                    <div className="flex items-center">
                      <svg
                        className="h-5 w-5 text-gray-400 rtl:rotate-180"
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
                          d="m9 5 7 7-7 7"
                        />
                      </svg>
                      <span className="ms-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ms-2">
                        Electronics
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Electronics
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button
                data-modal-toggle="filterModal"
                data-modal-target="filterModal"
                type="button"
                className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 sm:w-auto"
              >
                <svg
                  className="-ms-0.5 me-2 h-4 w-4"
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
                    stroke-width="2"
                    d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874a.5.5 0 0 0 .2.4l3 2.25a.5.5 0 0 0 .8-.4v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z"
                  />
                </svg>
                Filters
                <svg
                  className="-me-0.5 ms-2 h-4 w-4"
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
                    d="m19 9-7 7-7-7"
                  />
                </svg>
              </button>
              <button
                id="sortDropdownButton1"
                data-dropdown-toggle="dropdownSort1"
                type="button"
                className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 sm:w-auto"
              >
                <svg
                  className="-ms-0.5 me-2 h-4 w-4"
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
                    d="M7 4v16M7 4l3 3M7 4 4 7m9-3h6l-6 6h6m-6.5 10 3.5-7 3.5 7M14 18h4"
                  />
                </svg>
                Sort
                <svg
                  className="-me-0.5 ms-2 h-4 w-4"
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
                    d="m19 9-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                id="dropdownSort1"
                className="z-50 hidden w-40 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700"
                data-popper-placement="bottom"
              >
                <ul
                  className="p-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                  aria-labelledby="sortDropdownButton"
                >
                  <li>
                    <a
                      href="#"
                      className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      The most popular
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Newest
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Increasing price
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Decreasing price
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      No. reviews
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="group inline-flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Discount %
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
            />
          </div>
          <ProductCards />

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

          {/* Filter Modal */}
          <form
            action="#"
            method="get"
            id="filterModal"
            tabIndex={-1}
            aria-hidden="true"
            className="fixed left-0 right-0 top-0 z-50 hidden h-modal w-full overflow-y-auto overflow-x-hidden p-4 md:inset-0 md:h-full"
          >
            {/* Filter modal content remains unchanged */}
            <div className="relative h-full w-full max-w-xl md:h-auto">
              <div className="relative rounded-lg bg-white shadow dark:bg-gray-800">
                <div className="flex items-start justify-between rounded-t p-4 md:p-5">
                  <h3 className="text-lg font-normal text-gray-500 dark:text-gray-400">
                    Filters
                  </h3>
                  <button
                    type="button"
                    className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                    data-modal-toggle="filterModal"
                  >
                    <svg
                      className="h-5 w-5"
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
                        d="M6 18 17.94 6M18 18 6.06 6"
                      />
                    </svg>
                    <span className="sr-only">Close modal</span>
                  </button>
                </div>
                {/* Modal body and footer remain as in the original */}
                <div className="px-4 md:px-5">
                  <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                    <ul
                      className="-mb-px flex flex-wrap text-center text-sm font-medium"
                      id="myTab"
                      data-tabs-toggle="#myTabContent"
                      role="tablist"
                    >
                      <li className="mr-1" role="presentation">
                        <button
                          className="inline-block pb-2 pr-1"
                          id="brand-tab"
                          data-tabs-target="#brand"
                          type="button"
                          role="tab"
                          aria-controls="profile"
                          aria-selected="false"
                        >
                          Brand
                        </button>
                      </li>
                      <li className="mr-1" role="presentation">
                        <button
                          className="inline-block px-2 pb-2 hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300"
                          id="advanced-filers-tab"
                          data-tabs-target="#advanced-filters"
                          type="button"
                          role="tab"
                          aria-controls="advanced-filters"
                          aria-selected="false"
                        >
                          Advanced Filters
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div id="myTabContent">
                    <div
                      className="grid grid-cols-2 gap-4 md:grid-cols-3"
                      id="brand"
                      role="tabpanel"
                      aria-labelledby="brand-tab"
                    >
                      {/* Brand filter content remains unchanged */}
                      <div className="space-y-2">
                        <h5 className="text-lg font-medium uppercase text-black dark:text-white">
                          A
                        </h5>
                        <div className="flex items-center">
                          <input
                            id="apple"
                            type="checkbox"
                            value=""
                            className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-primary-600 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
                          />
                          <label
                            htmlFor="apple"
                            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                          >
                            Apple (56)
                          </label>
                        </div>
                        {/* Additional brand checkboxes as in the original */}
                      </div>
                      {/* Other brand sections (B, C, D, E, etc.) remain unchanged */}
                    </div>
                    <div
                      className="space-y-4"
                      id="advanced-filters"
                      role="tabpanel"
                      aria-labelledby="advanced-filters-tab"
                    >
                      {/* Advanced filters content remains unchanged */}
                      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="min-price"
                              className="block text-sm font-medium text-gray-900 dark:text-white"
                            >
                              Min Price
                            </label>
                            <input
                              id="min-price"
                              type="range"
                              min="0"
                              max="7000"
                              value="300"
                              step="1"
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="max-price"
                              className="block text-sm font-medium text-gray-900 dark:text-white"
                            >
                              Max Price
                            </label>
                            <input
                              id="max-price"
                              type="range"
                              min="0"
                              max="7000"
                              value="3500"
                              step="1"
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-between space-x-2">
                            <input
                              type="number"
                              id="min-price-input"
                              value="300"
                              min="0"
                              max="7000"
                              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                              placeholder=""
                              required
                            />
                            <div className="shrink-0 text-sm font-medium dark:text-gray-300">
                              to
                            </div>
                            <input
                              type="number"
                              id="max-price-input"
                              value="3500"
                              min="0"
                              max="7000"
                              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                              placeholder=""
                              required
                            />
                          </div>
                        </div>
                        {/* Additional advanced filters (delivery time, condition, etc.) remain unchanged */}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 rounded-b p-4 dark:border-gray-600 md:p-5">
                  <button
                    type="submit"
                    className="rounded-lg bg-primary-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-700 dark:hover:bg-primary-800 dark:focus:ring-primary-800"
                  >
                    Show 50 results
                  </button>
                  <button
                    type="reset"
                    className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default Store;
