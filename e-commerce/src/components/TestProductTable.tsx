import React, { useState, useEffect } from "react";
import { Search, Filter, Grid, List, Star, Heart, Eye, ShoppingCart, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

// Mock data for demonstration
const mockProducts = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    price: 1199,
    originalPrice: 1299,
    rating: 4.8,
    reviews: 2847,
    img_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
    category: "Smartphones",
    brand: "Apple",
    inStock: true,
    discount: 8,
    isNew: true,
    isFavorite: false
  },
  {
    id: 2,
    name: "MacBook Pro 16-inch M3",
    price: 2499,
    originalPrice: 2699,
    rating: 4.9,
    reviews: 1523,
    img_url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop",
    category: "Laptops",
    brand: "Apple",
    inStock: true,
    discount: 7,
    isNew: false,
    isFavorite: false
  },
  {
    id: 3,
    name: "Sony WH-1000XM5 Headphones",
    price: 329,
    originalPrice: 399,
    rating: 4.7,
    reviews: 3921,
    img_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Audio",
    brand: "Sony",
    inStock: true,
    discount: 18,
    isNew: false,
    isFavorite: true
  },
  {
    id: 4,
    name: "Samsung Galaxy S24 Ultra",
    price: 1099,
    originalPrice: 1199,
    rating: 4.6,
    reviews: 1847,
    img_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    category: "Smartphones",
    brand: "Samsung",
    inStock: false,
    discount: 8,
    isNew: true,
    isFavorite: false
  },
  {
    id: 5,
    name: "iPad Pro 12.9-inch",
    price: 899,
    originalPrice: 999,
    rating: 4.8,
    reviews: 2134,
    img_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
    category: "Tablets",
    brand: "Apple",
    inStock: true,
    discount: 10,
    isNew: false,
    isFavorite: false
  },
  {
    id: 6,
    name: "Dell XPS 13 Plus",
    price: 1299,
    originalPrice: 1499,
    rating: 4.5,
    reviews: 987,
    img_url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    category: "Laptops",
    brand: "Dell",
    inStock: true,
    discount: 13,
    isNew: false,
    isFavorite: false
  },
  {
    id: 7,
    name: "Apple Watch Series 9",
    price: 399,
    originalPrice: 449,
    rating: 4.7,
    reviews: 5621,
    img_url: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop",
    category: "Wearables",
    brand: "Apple",
    inStock: true,
    discount: 11,
    isNew: true,
    isFavorite: true
  },
  {
    id: 8,
    name: "Nintendo Switch OLED",
    price: 299,
    originalPrice: 349,
    rating: 4.6,
    reviews: 4532,
    img_url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
    category: "Gaming",
    brand: "Nintendo",
    inStock: true,
    discount: 14,
    isNew: false,
    isFavorite: false
  }
];

const Store = () => {
  const [products, setProducts] = useState(mockProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  
  const productsPerPage = 8;
  const categories = ["all", "Smartphones", "Laptops", "Audio", "Tablets", "Gaming", "Wearables"];
  const brands = ["All", "Apple", "Samsung", "Sony", "Dell", "Nintendo"];

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return b.isNew - a.isNew;
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const displayedProducts = sortedProducts.slice(startIndex, startIndex + productsPerPage);

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const toggleFavorite = (productId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const addToCart = (product) => {
    // Add your cart logic here
    console.log("Added to cart:", product);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Premium Electronics
          </h1>
          <p className="text-xl text-blue-100 mb-8">Discover the latest technology at unbeatable prices</p>
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Free Shipping</span>
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
        {/* Search and Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>

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

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + productsPerPage, sortedProducts.length)} of {sortedProducts.length} products
          </p>
          {searchTerm && (
            <p className="text-sm text-blue-600">
              Search results for "{searchTerm}"
            </p>
          )}
        </div>

        {/* Products Grid */}
        <div className={`mb-8 ${
          viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
            : "space-y-4"
        }`}>
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 ${
                viewMode === "list" ? "flex items-center p-4" : "flex flex-col"
              }`}
            >
              {/* Product Image */}
              <div className={`relative overflow-hidden ${
                viewMode === "list" ? "w-32 h-32 flex-shrink-0 rounded-lg" : "aspect-square"
              }`}>
                <img
                  src={product.img_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Badges */}
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

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className={`p-2 rounded-full shadow-lg transition-colors ${
                      favorites.has(product.id) || product.isFavorite
                        ? "bg-red-500 text-white"
                        : "bg-white text-gray-600 hover:text-red-500"
                    }`}
                  >
                    <Heart className="w-4 h-4" fill={favorites.has(product.id) || product.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button className="p-2 bg-white text-gray-600 hover:text-blue-600 rounded-full shadow-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock Status */}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className={`${viewMode === "list" ? "ml-4 flex-1" : "p-4"} flex flex-col justify-between h-full`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                    <span className="text-xs text-gray-500">{product.brand}</span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Rating */}
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
                    <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                    <span className="text-xs text-gray-500">({product.reviews})</span>
                  </div>
                </div>

                {/* Price and Actions */}
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
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      product.inStock
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden sm:inline">Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
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
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {displayedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setPriceRange([0, 3000]);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;