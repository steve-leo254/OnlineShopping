import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import axios from "axios";
import { useFetchProducts } from "../components/UseFetchProducts";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify"; // Import toast
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useRef } from "react";

interface Category {
  id: string | null;
  name: string;
}

interface ReviewObject {
  rating: number;
  comment: string;
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  created_at: string;
}

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  cost?: number;
  rating?: number | ReviewObject[];
  reviews?: number | ReviewObject[];
  img_url?: string;
  category?: { id: string; name: string };
  brand?: string;
  stock_quantity: number;
  discount?: number;
  is_new?: boolean;
  is_favorite?: boolean;
  description?: string;
  created_at: string;
  images?: { img_url: string }[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  images: string[];
  img_url: string;
  category: string;
  brand: string;
  inStock: boolean;
  discount: number;
  isNew: boolean;
  isFavorite: boolean;
  description: string;
  stockQuantity: number;
  createdAt: string;
}

// Transform API product to match component's expected format
const transformProduct = (apiProduct: ApiProduct): Product => {
  const discount =
    apiProduct.original_price && apiProduct.original_price > apiProduct.price
      ? Math.round(
          ((apiProduct.original_price - apiProduct.price) /
            apiProduct.original_price) *
            100
        )
      : apiProduct.discount || 0;

  const isNew =
    apiProduct.is_new !== undefined
      ? apiProduct.is_new
      : new Date().getTime() - new Date(apiProduct.created_at).getTime() <
        30 * 24 * 60 * 60 * 1000;

  // --- FIXED: Use reviews array for average rating if present ---
  let ratingValue = 0;
  if (Array.isArray(apiProduct.reviews) && apiProduct.reviews.length > 0) {
    const ratings = apiProduct.reviews
      .map((r: any) => (typeof r.rating === "number" ? r.rating : null))
      .filter((r: number | null) => r !== null) as number[];
    if (ratings.length > 0) {
      ratingValue = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }
  } else if (typeof apiProduct.rating === "number") {
    ratingValue = apiProduct.rating;
  }

  // Handle reviews count: if reviews is an array, use its length
  let reviewsCount = 0;
  if (typeof apiProduct.reviews === "number") {
    reviewsCount = apiProduct.reviews;
  } else if (
    Array.isArray(apiProduct.reviews) &&
    apiProduct.reviews &&
    apiProduct.reviews.length > 0
  ) {
    reviewsCount = apiProduct.reviews.length;
  }

  // Build images array from API
  let images: string[] = [];
  if (
    apiProduct.images &&
    Array.isArray(apiProduct.images) &&
    apiProduct.images.length > 0
  ) {
    images = apiProduct.images.map((img) =>
      img.img_url.startsWith("http")
        ? img.img_url
        : `${import.meta.env.VITE_API_BASE_URL}${img.img_url}`
    );
  }

  // Fallback: if no images, use uploads folder
  if (images.length === 0) {
    images = ["http://127.0.0.1:8000/uploads/"];
  }

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    price: apiProduct.price,
    originalPrice:
      apiProduct.original_price ||
      (apiProduct.price > (apiProduct.cost ?? 0)
        ? apiProduct.price
        : apiProduct.cost ?? 0),
    rating: ratingValue,
    reviews: reviewsCount,
    images,
    img_url: images[0],
    category: apiProduct.category?.name || "Uncategorized",
    brand: apiProduct.brand || "Unknown",
    inStock: apiProduct.stock_quantity > 0,
    discount: discount,
    isNew: isNew,
    isFavorite: apiProduct.is_favorite || false,
    stockQuantity: apiProduct.stock_quantity,
    description: apiProduct.description || "",
    createdAt: apiProduct.created_at,
  };
};

const Store = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const {
    isLoading,
    products: apiProducts,
    totalPages: apiTotalPages,
    error,
    fetchProducts,
  } = useFetchProducts();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const productsPerPage = 8;

  const navigate = useNavigate();

  const transformedProducts: Product[] = useMemo(
    () => apiProducts.map(transformProduct),
    [apiProducts]
  );

  const getAverageRating = (product: Product) => {
    // In the Product interface, reviews is a number (count), not an array
    // The actual rating is already calculated in the transformProduct function
    return product.rating || 0;
  };

  const displayedProducts = useMemo(() => {
    // Only include products with at least one review
    const reviewed = transformedProducts.filter((p) =>
      Array.isArray((p as any).reviews)
        ? (p as any).reviews.length > 0
        : p.reviews > 0
    );
    // Sort by average rating descending
    return reviewed.sort((a, b) => getAverageRating(b) - getAverageRating(a));
  }, [transformedProducts]);

  const handleCategoryChange = async (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
    setIsFiltering(true);
    try {
      await fetchProducts(1, productsPerPage, searchTerm, categoryId);
    } catch (error) {
      console.error("Error filtering by category:", error);
      toast.error("Failed to filter products. Please try again.");
    } finally {
      setIsFiltering(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get<Category[]>(
        `${API_BASE_URL}/public/categories`
      );

      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const allCategory = { id: null, name: "All" };
        const categories = [allCategory, ...response.data];
        setCategories(categories);
      } else {
        const uniqueCategories = [
          { id: null, name: "All" },
          ...Array.from(
            new Map(
              apiProducts
                .filter((p: ApiProduct) => p.category?.id && p.category?.name)
                .map(
                  (p: ApiProduct) =>
                    [
                      p.category!.id,
                      { id: p.category!.id, name: p.category!.name },
                    ] as [string, Category]
                )
            ).values()
          ),
        ];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      if (categories.length === 0) {
        toast.error("Failed to load product categories.");
        const uniqueCategories = [
          { id: null, name: "All" },
          ...Array.from(
            new Map(
              apiProducts
                .filter((p: ApiProduct) => p.category?.id && p.category?.name)
                .map(
                  (p: ApiProduct) =>
                    [
                      p.category!.id,
                      { id: p.category!.id, name: p.category!.name },
                    ] as [string, Category]
                )
            ).values()
          ),
        ];
        setCategories(uniqueCategories);
      }
    }
  }, [apiProducts, categories.length, API_BASE_URL]); // Added API_BASE_URL to dependency array

  const getCurrentCategoryName = () => {
    const category = categories.find(
      (cat: Category) => cat.id === selectedCategoryId
    );
    return category ? category.name : "All";
  };

  useEffect(() => {
    fetchProducts(currentPage, productsPerPage, searchTerm, selectedCategoryId);
  }, [currentPage, searchTerm, selectedCategoryId, fetchProducts]);

  useEffect(() => {
    if (searchTerm.trim()) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (
      searchInputRef.current &&
      document.activeElement !== searchInputRef.current
    ) {
      searchInputRef.current.focus();
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent drop-shadow-lg">
            Top Reviewed Products
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-2 font-medium">
            Discover what customers love most. Explore the best-rated products,
            reviewed by real shoppers like you!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {(isLoading || isFiltering) && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() =>
                fetchProducts(
                  currentPage,
                  productsPerPage,
                  "",
                  selectedCategoryId
                )
              }
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isFiltering && !error && (
          <>
            <div className="mb-8 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    ref={searchInputRef}
                    className="text-gray-600 w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-gray-600 flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  <div className="text-gray-600">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="featured">Featured</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                      <option value="newest">Newest</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category: Category) => (
                  <button
                    key={category.id || "all"}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCategoryId === category.id
                        ? "bg-blue-600 text-white shadow-lg transform scale-105"
                        : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
                    }`}
                  >
                    {category.name.charAt(0).toUpperCase() +
                      category.name.slice(1)}
                  </button>
                ))}
              </div>
              {showFilters && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Advanced Filters
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range: {formatCurrency(priceRange[0])} -{" "}
                      {formatCurrency(priceRange[1])}
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="500000"
                        step="1000"
                        value={priceRange[0]}
                        onChange={(e) =>
                          setPriceRange([
                            parseInt(e.target.value),
                            priceRange[1],
                          ])
                        }
                        className="flex-1"
                      />
                      <input
                        type="range"
                        min="0"
                        max="500000"
                        step="1000"
                        value={priceRange[1]}
                        onChange={(e) =>
                          setPriceRange([
                            priceRange[0],
                            parseInt(e.target.value),
                          ])
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Showing {displayedProducts.length} of {displayedProducts.length}{" "}
                products
                {selectedCategoryId && (
                  <span className="text-blue-600 ml-1">
                    in {getCurrentCategoryName()}
                  </span>
                )}
              </p>
              {searchTerm && (
                <p className="text-sm text-blue-600">
                  Search results for "{searchTerm}"
                </p>
              )}
            </div>

            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {apiTotalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <div className="flex space-x-1">
                  {[...Array(Math.min(5, apiTotalPages))].map((_, i) => {
                    let pageNum;
                    if (apiTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= apiTotalPages - 2) {
                      pageNum = apiTotalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(apiTotalPages, currentPage + 1))
                  }
                  disabled={currentPage === apiTotalPages}
                  className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </>
        )}

        {displayedProducts.length === 0 && !isLoading && !isFiltering && (
          <div className="text-center py-16 flex flex-col items-center justify-center">
            <div className="w-24 h-24 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-200 via-purple-200 to-blue-100 shadow-lg">
              <span className="text-6xl">📝</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No products have been reviewed yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Be the first to review by completing an order! Your feedback helps
              others discover the best products.
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all text-lg"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;
