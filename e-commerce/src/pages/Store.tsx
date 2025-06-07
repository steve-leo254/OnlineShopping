import React, { useState, useEffect } from "react";
import ProductCards from "../components/ProductCards";
import { useFetchProducts } from "../components/UseFetchProducts";

const Store: React.FC = () => {
  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
    // Use the custom hook to fetch products
  const {  totalPages } = useFetchProducts();

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handlers for navigation buttons
  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    setCurrentPage(currentPage + 1);
  };

  return (
    <>
      <section className="bg-gray-50 py-8 antialiased  md:py-12">
        <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
          {/* Heading & Filters */}
          <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Electronics
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* You can put Filters and Sort buttons here if needed */}
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Pass search state and pagination to ProductCards */}
          <ProductCards
            searchTerm={searchTerm}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />

          {/* Simple Pagination Navigation */}
          <nav
            className="flex justify-center items-center space-x-4 p-4"
            aria-label="Pagination"
          >
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`flex items-center justify-center py-1.5 px-4 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${
                currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              <svg
                className="w-6 h-6 text-gray-800 dark:text-white"
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
                  d="m15 19-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-gray-900 font-semibold text-lg">
              {currentPage}
            </span>
            <button
              onClick={handleNext}
              className="flex items-center justify-center py-1.5 px-4 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg
                className="w-6 h-6 text-gray-800 dark:text-white"
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
            </button>



            
          </nav>
        </div>
      </section>
    </>
  );
};

export default Store;
