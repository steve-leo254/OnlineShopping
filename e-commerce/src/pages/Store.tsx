import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  
  Star,
  Heart,
  Eye,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import axios from "axios";
import { useFetchProducts } from "../components/UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify"; // Import toast

interface Category {
  id: string | null;
  name: string;
}

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  cost?: number;
  rating?: number;
  reviews?: number;
  img_url?: string;
  category?: { id: string; name: string };
  brand?: string;
  stock_quantity: number;
  discount?: number;
  is_new?: boolean;
  is_favorite?: boolean;
  description?: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
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

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    price: apiProduct.price,
    originalPrice:
      apiProduct.original_price ||
      (apiProduct.price > (apiProduct.cost ?? 0)
        ? apiProduct.price
        : apiProduct.cost ?? 0),
    rating: apiProduct.rating || 4.5,
    reviews: apiProduct.reviews || 100,
    img_url: apiProduct.img_url
      ? `${import.meta.env.VITE_API_BASE_URL}${apiProduct.img_url}`
      : "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop",
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

// Custom hook for debounced search
const useDebounce = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Store = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { addToCart, getItemQuantity } = useShoppingCart();
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
  const [viewMode] = useState<string>("grid");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  const productsPerPage = 8;

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const transformedProducts: Product[] = useMemo(
    () => apiProducts.map(transformProduct),
    [apiProducts]
  );

  const getFilteredAndSortedProducts = useCallback(
    (productsToFilter: Product[]) => {
      let filtered = productsToFilter;

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = productsToFilter.filter(
          (product) =>
            product.name.toLowerCase().includes(searchLower) ||
            product.category.toLowerCase().includes(searchLower) ||
            product.brand.toLowerCase().includes(searchLower) ||
            (product.description &&
              product.description.toLowerCase().includes(searchLower))
        );
      }

      const priceFiltered = filtered.filter(
        (product) =>
          product.price >= priceRange[0] && product.price <= priceRange[1]
      );

      const sorted = [...priceFiltered].sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          case "rating":
            return b.rating - a.rating;
          case "newest":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          default:
            return 0;
        }
      });

      return sorted;
    },
    [searchTerm, priceRange, sortBy]
  );

  const displayedProducts = useMemo(
    () => getFilteredAndSortedProducts(transformedProducts),
    [transformedProducts, getFilteredAndSortedProducts]
  );

  const handleCategoryChange = async (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
    setIsFiltering(true);
    try {
      await fetchProducts(1, productsPerPage, debouncedSearchTerm, categoryId);
    } catch (error) {
      console.error("Error filtering by category:", error);
      toast.error("Failed to filter products. Please try again.");
    } finally {
      setIsFiltering(false);
    }
  };

  const toggleFavorite = (productId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
      toast.info("Removed from favorites");
    } else {
      newFavorites.add(productId);
      toast.success("Added to favorites!");
    }
    setFavorites(newFavorites);
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

  const handleAddToCart = (product: Product) => {
    const currentQuantityInCart = getItemQuantity(parseInt(product.id));
    if (currentQuantityInCart >= product.stockQuantity) {
      toast.error(
        `Cannot add more than available stock (${product.stockQuantity}) for ${product.name}`
      );
      return;
    }

    try {
      addToCart({
        id: parseInt(product.id),
        name: product.name,
        price: product.price,
        img_url: product.img_url,
        stockQuantity: product.stockQuantity,
      });
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error("Failed to add item to cart. Please try again.");
    }
  };

  useEffect(() => {
    fetchProducts(
      currentPage,
      productsPerPage,
      debouncedSearchTerm,
      selectedCategoryId
    );
  }, [currentPage, debouncedSearchTerm, selectedCategoryId, fetchProducts]);

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Premium Electronics
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Discover the latest technology at unbeatable prices
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Shipping Fee</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>30-Day Returns</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>2-Year Warranty</span>
            </div>
          </div>
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
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {/* <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-colors bg-gray-200 ${
                        viewMode === "grid"
                          ? "bg-white shadow-sm"
                          : "hover:bg-gray-400"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-colors bg-gray-200 ${
                        viewMode === "list"
                          ? "bg-white shadow-sm"
                          : "hover:bg-gray-400"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button> */}
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

            <div
              className={`mb-8 ${
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  : "space-y-4"
              }`}
            >
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 ${
                    viewMode === "list"
                      ? "flex items-center p-4"
                      : "flex flex-col h-full"
                  }`}
                >
                  <div
                    className={`relative overflow-hidden ${
                      viewMode === "list"
                        ? "w-32 h-32 flex-shrink-0 rounded-lg"
                        : "aspect-square"
                    }`}
                  >
                    <img
                      src={product.img_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target;
                        ("https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop");
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {product.isNew && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          New
                        </span>
                      )}
                      {product.discount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className={`p-2 rounded-full shadow-lg transition-colors ${
                          favorites.has(product.id) || product.isFavorite
                            ? "bg-red-500 text-white"
                            : "bg-white text-gray-600 hover:text-red-500"
                        }`}
                      >
                        <Heart
                          className="w-4 h-4"
                          fill={
                            favorites.has(product.id) || product.isFavorite
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                      <button className="p-2 bg-white text-gray-600 hover:text-blue-600 rounded-full shadow-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`${
                      viewMode === "list"
                        ? "ml-4 flex-1"
                        : "p-4 flex-1 flex flex-col"
                    } ${viewMode === "list" ? "" : "justify-between h-full"}`}
                  >
                    {viewMode === "list" ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                            {product.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {product.brand}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(product.rating)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {product.rating}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({product.reviews})
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs text-gray-500">
                            Stock: {product.stockQuantity} available
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-gray-900">
                                {formatCurrency(product.price)}
                              </span>
                              {product.originalPrice > product.price && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatCurrency(product.originalPrice)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <span>Free shipping</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={
                              !product.inStock ||
                              getItemQuantity(parseInt(product.id)) >=
                                product.stockQuantity
                            } // Disable if already at max stock
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                              product.inStock &&
                              getItemQuantity(parseInt(product.id)) <
                                product.stockQuantity
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="hidden sm:inline">
                              Add to Cart
                            </span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                              {product.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {product.brand}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm sm:text-base">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(product.rating)
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {product.rating}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({product.reviews})
                            </span>
                          </div>
                          <div className="mb-3">
                            <span className="text-xs text-gray-500">
                              Stock: {product.stockQuantity} available
                            </span>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-lg sm:text-xl font-bold text-gray-900">
                                  {formatCurrency(product.price)}
                                </span>
                                {product.originalPrice > product.price && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatCurrency(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span>Delivered at a fee</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={
                                !product.inStock ||
                                getItemQuantity(parseInt(product.id)) >=
                                  product.stockQuantity
                              } // Disable if already at max stock
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                                product.inStock &&
                                getItemQuantity(parseInt(product.id)) <
                                  product.stockQuantity
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                              <span>Add to Cart</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
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
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCategoryId
                ? `No products found in ${getCurrentCategoryName()} category`
                : "Try adjusting your search or filters"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;