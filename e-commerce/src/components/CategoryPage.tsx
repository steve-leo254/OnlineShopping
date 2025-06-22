import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Heart,
  ShoppingCart,
  Star,
  Grid,
  List,
  ChevronDown,
  Eye,
  Zap,
  Smartphone,
  Laptop,
  Headphones,
  Monitor,
  HardDrive,
  Cpu,
  Wifi,
  Mouse,
  Keyboard,
  Gamepad2,
  Camera,
  Tablet,
  Speaker,
  Battery,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useLocation, useParams } from "react-router-dom";

// Define types for our data
type Category = {
  id: number;
  name: string;
  description: string | null;
};

type Subcategory = {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
};

type Product = {
  id: number;
  name: string;
  price: number;
  original_price: number;
  rating: number;
  stock_quantity: number;
  category_id: number;
  subcategory_id: number | null;
  brand: string;
  description: string;
  discount: number;
  is_new: boolean;
  category: Category;
  subcategory?: Subcategory;
  images: Array<{
    id: number;
    img_url: string;
  }>;
  reviews: Array<{
    id: number;
    rating: number;
    comment: string;
  }>;
};

const CategoryProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [priceRange, setPriceRange] = useState("all");
  const [favorites, setFavorites] = useState(new Set<number>());
  const [isLoading, setIsLoading] = useState(true);
  const [subcategoryCarouselIndex, setSubcategoryCarouselIndex] = useState(0);

  // Database state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryConfig, setCategoryConfig] = useState<any>(null);

  // Get category name from URL or location state
  useEffect(() => {
    // Try to get category from navigation state first
    let categoryName = location.state?.categoryName;

    // If not in state, try to extract from URL path
    if (!categoryName) {
      const pathSegments = location.pathname.split("/");
      const categoryFromUrl = pathSegments[pathSegments.length - 1];
      if (categoryFromUrl && categoryFromUrl !== "category") {
        // Convert URL format back to category name (e.g., "pc-components" -> "PC Components")
        categoryName = categoryFromUrl
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }

    // Fallback to default
    categoryName = categoryName || "Laptops";

    console.log(
      "CategoryPage: Setting category to:",
      categoryName,
      "from state:",
      location.state
    );
    setSelectedCategory(categoryName);
  }, [location.state, location.pathname]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log("CategoryPage: selectedCategory changed to:", selectedCategory);
  }, [selectedCategory]);

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      const response = await axios.get<Category[]>(
        `${import.meta.env.VITE_API_BASE_URL}/public/categories`
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch products by category and subcategory
  const fetchProductsByCategory = async (
    categoryName: string,
    subcategoryName?: string
  ) => {
    try {
      setIsLoading(true);

      // First, find the category ID
      const category = categories.find(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      // Build query parameters
      let url = `${
        import.meta.env.VITE_API_BASE_URL
      }/public/products?category_id=${category.id}&limit=50`;

      // Add subcategory filter if specified
      if (subcategoryName) {
        const subcategory = subcategories.find(
          (sub) =>
            sub.name.toLowerCase() === subcategoryName.toLowerCase() &&
            sub.category_id === category.id
        );
        if (subcategory) {
          url += `&subcategory_id=${subcategory.id}`;
        }
      }

      const response = await axios.get(url);
      setProducts(response.data.items || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subcategories for the selected category
  const fetchSubcategories = async (categoryId: number) => {
    try {
      const response = await axios.get<Subcategory[]>(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/categories/${categoryId}/subcategories`
      );
      setSubcategories(response.data || []);
      console.log("Fetched subcategories:", response.data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      await fetchCategories();
    };
    initializeData();
  }, []);

  // Fetch products when category changes
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      fetchProductsByCategory(selectedCategory, selectedSubcategory);

      // Find category and fetch subcategories
      const category = categories.find(
        (cat) => cat.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (category) {
        fetchSubcategories(category.id);
      }
    }
  }, [selectedCategory, categories, selectedSubcategory]);

  // Set category configuration based on selected category
  useEffect(() => {
    if (selectedCategory) {
      const config = getCategoryConfig(selectedCategory);
      setCategoryConfig(config);
    }
  }, [selectedCategory]);

  // Get category configuration
  const getCategoryConfig = (categoryName: string) => {
    const configs: Record<string, any> = {
      Laptops: {
        title: "Laptops & Notebooks",
        subtitle: "Powerful computing for work and play",
        description:
          "From ultrabooks to gaming powerhouses, find the perfect laptop for your needs. Premium processors, stunning displays, and all-day battery life.",
        gradient: "from-blue-600 via-indigo-600 to-purple-800",
        bgGradient: "from-blue-50 via-indigo-50 to-purple-50",
        icon: Laptop,
        banner:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=400&fit=crop",
        features: [
          "Intel/AMD Processors",
          "SSD Storage",
          "Full HD+ Displays",
          "2-Year Warranty",
        ],
      },
      Smartphones: {
        title: "Smartphones & Mobile",
        subtitle: "Stay connected with cutting-edge mobile technology",
        description:
          "Latest smartphones with advanced cameras, lightning-fast processors, and innovative features. Android and iOS options available.",
        gradient: "from-green-500 via-emerald-500 to-teal-600",
        bgGradient: "from-green-50 via-emerald-50 to-teal-50",
        icon: Smartphone,
        banner:
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=400&fit=crop",
        features: [
          "5G Connectivity",
          "Pro Cameras",
          "Fast Charging",
          "Premium Materials",
        ],
      },
      "PC Components": {
        title: "PC Components & Hardware",
        subtitle: "Build your dream computer",
        description:
          "High-performance components for custom PC builds. CPUs, GPUs, motherboards, and more from top manufacturers.",
        gradient: "from-red-500 via-orange-500 to-yellow-600",
        bgGradient: "from-red-50 via-orange-50 to-yellow-50",
        icon: Cpu,
        banner:
          "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1200&h=400&fit=crop",
        features: [
          "Latest Chipsets",
          "RGB Lighting",
          "Overclocking Support",
          "Expert Assembly",
        ],
      },
      Accessories: {
        title: "Electronics Accessories",
        subtitle: "Complete your tech setup",
        description:
          "Essential accessories to enhance your electronics experience. From audio gear to input devices and connectivity solutions.",
        gradient: "from-purple-500 via-pink-500 to-rose-600",
        bgGradient: "from-purple-50 via-pink-50 to-rose-50",
        icon: Headphones,
        banner:
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&h=400&fit=crop",
        features: [
          "Premium Audio",
          "Wireless Technology",
          "Ergonomic Design",
          "Multi-Device Support",
        ],
      },
    };

    return (
      configs[categoryName] || {
        title: categoryName,
        subtitle: `Explore our ${categoryName} collection`,
        description: `Discover the best ${categoryName.toLowerCase()} products with premium quality and competitive prices.`,
        gradient: "from-blue-600 via-indigo-600 to-purple-800",
        bgGradient: "from-blue-50 via-indigo-50 to-purple-50",
        icon: Laptop,
        banner:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=400&fit=crop",
        features: [
          "Premium Quality",
          "Fast Shipping",
          "Best Prices",
          "Customer Support",
        ],
      }
    );
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice =
      priceRange === "all" ||
      (priceRange === "under-500" && product.price < 500) ||
      (priceRange === "500-1000" &&
        product.price >= 500 &&
        product.price <= 1000) ||
      (priceRange === "1000-2000" &&
        product.price >= 1000 &&
        product.price <= 2000) ||
      (priceRange === "over-2000" && product.price > 2000);
    return matchesSearch && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort(
    (a: Product, b: Product) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    }
  );

  const toggleFavorite = (productId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const handleViewProduct = (productId: number) => {
    console.log(`Navigating to product details for product ID: ${productId}`);
    navigate(`/product/${productId}`);
  };

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategory(""); // Reset subcategory when category changes
    // Don't navigate, just filter the products
    fetchProductsByCategory(categoryName);

    // Find category and fetch subcategories
    const category = categories.find(
      (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (category) {
      fetchSubcategories(category.id);
    }
  };

  const handleSubcategoryChange = (subcategoryName: string) => {
    setSelectedSubcategory(subcategoryName);
    fetchProductsByCategory(selectedCategory, subcategoryName);
  };

  const resetFilters = () => {
    setSelectedSubcategory("");
    setSearchTerm("");
    setPriceRange("all");
    setSortBy("featured");
    fetchProductsByCategory(selectedCategory);
  };

  // Subcategory carousel navigation
  const nextSubcategorySlide = () => {
    setSubcategoryCarouselIndex((prev) =>
      prev + 4 >= subcategories.length ? 0 : prev + 4
    );
  };

  const prevSubcategorySlide = () => {
    setSubcategoryCarouselIndex((prev) =>
      prev - 4 < 0 ? Math.max(0, subcategories.length - 4) : prev - 4
    );
  };

  // Get product image URL
  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0].img_url;
      return imageUrl.startsWith("http")
        ? imageUrl
        : `${import.meta.env.VITE_API_BASE_URL}${imageUrl}`;
    }
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"; // Default image
  };

  // Calculate discount percentage
  const calculateDiscount = (product: Product) => {
    if (product.original_price && product.original_price > product.price) {
      return Math.round(
        ((product.original_price - product.price) / product.original_price) *
          100
      );
    }
    return 0;
  };

  // Format product specifications into a readable string
  const formatProductSpecs = (product: Product) => {
    const specs: string[] = [];

    // Add brand if available
    if (product.brand) {
      specs.push(product.brand);
    }

    // Add stock information
    if (product.stock_quantity > 0) {
      specs.push(`In Stock (${product.stock_quantity})`);
    } else {
      specs.push("Out of Stock");
    }

    // Add discount information
    if (product.original_price && product.original_price > product.price) {
      const discount = calculateDiscount(product);
      specs.push(`${discount}% OFF`);
    }

    // Add rating information
    if (product.rating > 0) {
      specs.push(`${product.rating.toFixed(1)}★`);
    }

    return specs.join(" • ");
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
          <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );

  if (!categoryConfig) {
    return <LoadingSkeleton />;
  }

  const IconComponent = categoryConfig.icon;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${categoryConfig.bgGradient}`}
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {categoryConfig.title}
              </h1>
              <nav className="hidden md:flex space-x-6">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryChange(category.name)}
                    className={`px-4 py-2 rounded-full transition-all duration-300 ${
                      selectedCategory === category.name
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Category Hero Banner */}
      <div className="relative overflow-hidden">
        <div
          className="h-80 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${categoryConfig.banner})` }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
          <div
            className={`absolute inset-0 bg-gradient-to-r ${categoryConfig.gradient} opacity-75`}
          ></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <IconComponent size={32} />
                </div>
                <h1 className="text-5xl font-bold">{categoryConfig.title}</h1>
              </div>
              <p className="text-xl mb-6 text-white/90">
                {categoryConfig.subtitle}
              </p>
              <p className="text-lg mb-8 text-white/80">
                {categoryConfig.description}
              </p>
              <div className="flex flex-wrap gap-4">
                {categoryConfig.features.map(
                  (feature: string, index: number) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
                    >
                      ✓ {feature}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subcategories Section */}
        {subcategories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Browse by Subcategory
              </h2>
              <button
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Show All Categories
              </button>
            </div>

            {/* Subcategory Carousel */}
            <div className="relative">
              {/* Navigation Buttons */}
              {subcategories.length > 4 && (
                <>
                  <button
                    onClick={prevSubcategorySlide}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>

                  <button
                    onClick={nextSubcategorySlide}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                </>
              )}

              {/* Subcategories Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden">
                {subcategories
                  .slice(subcategoryCarouselIndex, subcategoryCarouselIndex + 4)
                  .map((subcategory) => (
                    <button
                      key={subcategory.id}
                      onClick={() => handleSubcategoryChange(subcategory.name)}
                      className={`p-4 rounded-xl text-center transition-all duration-300 hover:scale-105 ${
                        selectedSubcategory === subcategory.name
                          ? `bg-gradient-to-r ${categoryConfig.gradient} text-white shadow-lg`
                          : "bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80"
                      }`}
                    >
                      <div className="text-2xl mb-2">
                        {getCategoryIcon(subcategory.name)}
                      </div>
                      <h3 className="font-semibold text-sm">
                        {subcategory.name}
                      </h3>
                      {subcategory.description && (
                        <p className="text-xs mt-1 opacity-75">
                          {subcategory.description}
                        </p>
                      )}
                    </button>
                  ))}
              </div>

              {/* Carousel Indicators */}
              {subcategories.length > 4 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {Array.from({
                    length: Math.ceil(subcategories.length / 4),
                  }).map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === Math.floor(subcategoryCarouselIndex / 4)
                          ? "bg-blue-600"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      onClick={() => setSubcategoryCarouselIndex(index * 4)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder={`Search ${selectedCategory.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Subcategory Filter */}
              {subcategories.length > 0 && (
                <select
                  value={selectedSubcategory}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">All Subcategories</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.name}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Price Filter */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Prices</option>
                <option value="under-500">Under $500</option>
                <option value="500-1000">$500 - $1,000</option>
                <option value="1000-2000">$1,000 - $2,000</option>
                <option value="over-2000">Over $2,000</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {categoryConfig.title} Collection
              {selectedSubcategory && ` - ${selectedSubcategory}`}
            </h2>
            <p className="text-gray-600">
              {sortedProducts.length} products available
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Showing results for "{selectedCategory}"
            {selectedSubcategory && ` > ${selectedSubcategory}`}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div
            className={`grid gap-8 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {sortedProducts.map((product, index) => (
              <div
                key={product.id}
                className="group bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 hover:-translate-y-2"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.6s ease-out forwards",
                }}
              >
                <div className="relative overflow-hidden group/image">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Product Badge */}
                  {product.is_new && (
                    <div
                      className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${categoryConfig.gradient} text-white`}
                    >
                      New
                    </div>
                  )}

                  <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <button
                      onClick={() => handleViewProduct(product.id)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg"
                      title="View Details"
                    >
                      <Eye
                        size={20}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      />
                    </button>
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg"
                      title="Add to Favorites"
                    >
                      <Heart
                        size={20}
                        className={`transition-colors ${
                          favorites.has(product.id)
                            ? "text-red-500 fill-current"
                            : "text-gray-600 hover:text-red-500"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
                    <button
                      onClick={() => handleViewProduct(product.id)}
                      className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto"
                    >
                      Quick View
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 font-medium">
                      {formatProductSpecs(product)}
                    </span>
                    {product.is_new && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${categoryConfig.gradient} text-white font-medium`}
                      >
                        New
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3">
                    {formatProductSpecs(product)}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${
                            i < Math.floor(product.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({product.rating})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      ${product.price.toLocaleString()}
                    </span>
                    <button
                      className={`px-6 py-2 bg-gradient-to-r ${categoryConfig.gradient} text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300`}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedProducts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get category icon
const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, string> = {
    Electronics: "📱",
    Fashion: "👗",
    "Home & Garden": "🏠",
    Sports: "⚽",
    Books: "📚",
    Beauty: "💄",
    Laptops: "💻",
    Smartphones: "📱",
    "PC Components": "🔧",
    Accessories: "🎧",
    "Gaming Laptops": "🎮",
    "Business Laptops": "💼",
    Ultrabooks: "💻",
    Workstations: "🖥️",
    "Android Phones": "📱",
    iPhones: "📱",
    "Budget Phones": "📱",
    Processors: "🔧",
    "Graphics Cards": "🎮",
    "Memory & Storage": "💾",
    Motherboards: "🔌",
    "Audio & Headphones": "🎧",
    "Keyboards & Mice": "⌨️",
    "Monitors & Displays": "🖥️",
    Networking: "📡",
  };
  return iconMap[categoryName] || "📦";
};

export default CategoryProductsPage;
