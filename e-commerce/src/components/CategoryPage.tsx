import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Heart,
  ShoppingCart,
  Star,
  Grid,
  List,
  Eye,
  Smartphone,
  Laptop,
  Headphones,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Shield,
  Truck,
  Award,
  Tag,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { formatCurrency } from "../cart/formatCurrency";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { toast } from "react-toastify";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [priceRange, setPriceRange] = useState("all");
  const [favorites, setFavorites] = useState(new Set<number>());
  const [isLoading, setIsLoading] = useState(true);
  const [subcategoryCarouselIndex, setSubcategoryCarouselIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Database state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryConfig, setCategoryConfig] = useState<any>(null);

  const { addToCart, getItemQuantity } = useShoppingCart();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();

  // Get category name from URL or location state
  useEffect(() => {
    // Try to get category from navigation state first
    let categoryName = location.state?.categoryName;

    // If not in state, try to extract from URL path
    if (!categoryName) {
      const pathSegments = location.pathname.split("/");
      const categoryFromUrl = pathSegments[pathSegments.length - 1];

      // Handle /shop route - set to "All"
      if (categoryFromUrl === "shop") {
        categoryName = "All";
      } else if (categoryFromUrl && categoryFromUrl !== "category") {
        // Convert URL format back to category name (e.g., "pc-components" -> "PC Components")
        categoryName = categoryFromUrl
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
    }

    // Fallback to "All" instead of "Laptops"
    categoryName = categoryName || "All";

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

      // Handle "All" category - fetch all products
      if (categoryName.toLowerCase() === "all") {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/public/products?limit=100`
        );
        setProducts(response.data.items || []);
        setIsLoading(false);
        return;
      }

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

      // Only fetch subcategories if not "All" category
      if (selectedCategory.toLowerCase() !== "all") {
        // Find category and fetch subcategories
        const category = categories.find(
          (cat) => cat.name.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (category) {
          fetchSubcategories(category.id);
        }
      } else {
        // Clear subcategories when "All" is selected
        setSubcategories([]);
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

  // Window resize listener for responsive carousel
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get category configuration
  const getCategoryConfig = (categoryName: string) => {
    const configs: Record<string, any> = {
      All: {
        title: "Flowtech Solutions",
        subtitle: "Your Complete Tech Destination",
        description:
          "Discover our comprehensive collection of cutting-edge technology products. From laptops and smartphones to PC components and accessories, we have everything you need to stay ahead in the digital world.",
        gradient: "from-purple-600 via-pink-600 to-red-600",
        bgGradient: "from-purple-50 via-pink-50 to-red-50",
        icon: Smartphone,
        banner:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=400&fit=crop",
        features: [
          "All Categories",
          "Premium Quality",
          "Fast Shipping",
          "Expert Support",
        ],
      },
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

  const handleToggleFavorite = async (product: Product) => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to use favorites.");
      return;
    }
    const idStr = product.id.toString();
    try {
      if (isFavorite(idStr)) {
        await removeFavorite(idStr);
        toast.info(`${product.name} removed from favorites.`);
      } else {
        await addFavorite(idStr);
        toast.success(`${product.name} added to favorites!`);
      }
    } catch (err) {
      toast.error("Failed to update favorites. Please try again.");
    }
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
    // Responsive items per slide based on screen size
    const itemsPerSlide = windowWidth < 640 ? 2 : windowWidth < 1024 ? 3 : 4;
    setSubcategoryCarouselIndex((prev) =>
      prev + itemsPerSlide >= subcategories.length ? 0 : prev + itemsPerSlide
    );
  };

  const prevSubcategorySlide = () => {
    // Responsive items per slide based on screen size
    const itemsPerSlide = windowWidth < 640 ? 2 : windowWidth < 1024 ? 3 : 4;
    setSubcategoryCarouselIndex((prev) =>
      prev - itemsPerSlide < 0
        ? Math.max(0, subcategories.length - itemsPerSlide)
        : prev - itemsPerSlide
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
    // Category-specific fallback images
    const fallbackImages: Record<string, string> = {
      Laptops:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
      Smartphones:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      "PC Components":
        "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop",
      Accessories:
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
    };
    return (
      fallbackImages[product.category?.name] ||
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"
    );
  };

  // Calculate discount percentage
  const calculateDiscount = (product: Product) => {
    // Validate price values to prevent calculation errors
    const originalPrice = product.original_price || 0;
    const currentPrice = product.price || 0;

    if (originalPrice > 0 && originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return product.discount || 0;
  };

  // Enhanced stock status with better messaging
  const getStockStatus = (quantity: number) => {
    // Validate stock quantity to prevent issues with invalid values
    const validQuantity =
      isNaN(quantity) || quantity < 0 ? 0 : Math.floor(quantity);

    if (validQuantity === 0) {
      return {
        status: "out",
        message: "Out of Stock",
        color: "text-red-600 bg-red-50",
        icon: "❌",
      };
    } else if (validQuantity <= 5) {
      return {
        status: "low",
        message: `Only ${validQuantity} left`,
        color: "text-orange-600 bg-orange-50",
        icon: "⚠️",
      };
    } else if (validQuantity <= 20) {
      return {
        status: "medium",
        message: "In Stock",
        color: "text-blue-600 bg-blue-50",
        icon: "📦",
      };
    } else {
      return {
        status: "high",
        message: "In Stock",
        color: "text-green-600 bg-green-50",
        icon: "✅",
      };
    }
  };

  // Enhanced rating display
  const renderRating = (rating: number, reviewCount: number = 0) => {
    // Validate and sanitize the rating value
    const validRating = isNaN(rating) || rating < 0 ? 0 : Math.min(rating, 5);
    const fullStars = Math.floor(validRating);
    const hasHalfStar = validRating % 1 >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {[...Array(Math.max(0, fullStars))].map((_, i) => (
            <Star key={i} size={14} className="text-yellow-400 fill-current" />
          ))}
          {hasHalfStar && (
            <div className="relative">
              <Star size={14} className="text-gray-300" />
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star size={14} className="text-yellow-400 fill-current" />
              </div>
            </div>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <Star key={i} size={14} className="text-gray-300" />
          ))}
        </div>
        <span className="text-xs text-gray-600 ml-1">
          {validRating.toFixed(1)} {reviewCount > 0 && `(${reviewCount})`}
        </span>
      </div>
    );
  };

  // Product badges logic
  const getProductBadges = (product: Product) => {
    const badges: Array<{ label: string; color: string; icon: string }> = [];

    if (product.is_new) {
      badges.push({ label: "New", color: "bg-blue-500", icon: "✨" });
    }

    const discount = calculateDiscount(product);
    if (discount > 0) {
      badges.push({
        label: `${discount}% OFF`,
        color: "bg-red-500",
        icon: "🏷️",
      });
    }

    // Validate rating before checking for top rated badge
    const validRating =
      isNaN(product.rating) || product.rating < 0 ? 0 : product.rating;
    if (validRating >= 4.5) {
      badges.push({ label: "Top Rated", color: "bg-yellow-500", icon: "⭐" });
    }

    if (getStockStatus(product.stock_quantity).status === "low") {
      badges.push({ label: "Limited", color: "bg-orange-500", icon: "⚡" });
    }

    return badges;
  };

  // Format key specifications based on category
  const getKeySpecs = (product: Product) => {
    const specs: string[] = [];

    // Add brand prominently
    if (product.brand) {
      specs.push(product.brand);
    }

    // Add category-specific specs (you can expand this based on your product data structure)
    if (product.category?.name === "Laptops") {
      // For laptops, you might want to show processor, RAM, storage
      specs.push("Latest Gen CPU");
      specs.push("Fast SSD");
    } else if (product.category?.name === "Smartphones") {
      specs.push("5G Ready");
      specs.push("Pro Camera");
    } else if (product.category?.name === "PC Components") {
      specs.push("High Performance");
      specs.push("RGB Compatible");
    }

    return specs.slice(0, 3); // Limit to 3 key specs
  };

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 animate-pulse border border-white/20"
        >
          <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Enhanced Product Card Component
  const ProductCard = ({
    product,
    categoryConfig,
    onViewProduct,
    index,
  }: {
    product: Product;
    categoryConfig: any;
    onViewProduct: (productId: number) => void;
    index: number;
  }) => {
    const stockInfo = getStockStatus(product.stock_quantity);
    const discount = calculateDiscount(product);
    const badges = getProductBadges(product);
    const keySpecs = getKeySpecs(product);

    const handleAddToCart = (product: Product) => {
      const currentQuantityInCart = getItemQuantity(product.id);
      if (currentQuantityInCart >= product.stock_quantity) {
        toast.error(
          `Cannot add more than available stock (${product.stock_quantity}) for ${product.name}`
        );
        return;
      }
      try {
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          img_url: product.images?.[0]?.img_url || null,
          stockQuantity: product.stock_quantity,
        });
        toast.success(`${product.name} added to cart!`);
      } catch (error) {
        toast.error("Failed to add item to cart. Please try again.");
      }
    };

    return (
      <div
        className="group bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 hover:-translate-y-2"
        style={{
          animationDelay: `${index * 100}ms`,
          animation: "fadeInUp 0.6s ease-out forwards",
        }}
      >
        {/* Image Section */}
        <div className="relative overflow-hidden group/image">
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";
            }}
          />

          {/* Enhanced Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {badges.slice(0, 2).map((badge, i) => (
              <div
                key={i}
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${badge.color} flex items-center gap-1`}
              >
                <span>{badge.icon}</span>
                {badge.label}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <button
              onClick={() => onViewProduct(product.id)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg"
              title="View Details"
            >
              <Eye
                size={18}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              />
            </button>
            <button
              onClick={() => handleToggleFavorite(product)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg"
              title={
                isFavorite(product.id.toString())
                  ? "Remove from Favorites"
                  : "Add to Favorites"
              }
            >
              <Heart
                size={18}
                className={`transition-colors ${
                  isFavorite(product.id.toString())
                    ? "text-red-500 fill-current"
                    : "text-gray-600 hover:text-red-500"
                }`}
              />
            </button>
          </div>

          {/* Stock Status Indicator */}
          <div className="absolute bottom-4 left-4">
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${stockInfo.color} flex items-center gap-1`}
            >
              <span>{stockInfo.icon}</span>
              {stockInfo.message}
            </div>
          </div>

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
            <button
              onClick={() => onViewProduct(product.id)}
              className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto flex items-center gap-2"
            >
              <Eye size={16} />
              Quick View
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Category and Brand */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {product.category?.name || "Electronics"}
              </span>
              {product.subcategory && (
                <span className="text-xs text-gray-500">
                  {product.subcategory.name}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">ID: {product.id}</div>
          </div>

          {/* Product Name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Key Specifications */}
          {keySpecs.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {keySpecs.map((spec, i) => (
                <span
                  key={i}
                  className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Rating */}
          <div className="mb-3">
            {renderRating(product.rating, product.reviews?.length)}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(product.price)}
                </span>
                {product.original_price &&
                  product.original_price > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(product.original_price)}
                    </span>
                  )}
              </div>
              {discount > 0 && (
                <span className="text-sm text-green-600 font-medium">
                  Save {formatCurrency(product.original_price - product.price)}{" "}
                  ({discount}% off)
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              disabled={product.stock_quantity === 0}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                product.stock_quantity === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : `bg-gradient-to-r ${categoryConfig.gradient} text-white hover:shadow-lg transform hover:scale-105`
              }`}
              onClick={() => handleAddToCart(product)}
            >
              <ShoppingCart size={16} />
              {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              onClick={() => onViewProduct(product.id)}
              className="px-4 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
            >
              <Eye size={16} />
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Truck size={12} />
                Free shipping
              </span>
              <span className="flex items-center gap-1">
                <Shield size={12} />
                Warranty included
              </span>
              <span className="flex items-center gap-1">
                <Award size={12} />
                Quality assured
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Products Grid Component
  const ProductsGrid = ({
    products,
    categoryConfig,
    onViewProduct,
    viewMode,
    isLoading,
  }: {
    products: Product[];
    categoryConfig: any;
    onViewProduct: (productId: number) => void;
    viewMode: string;
    isLoading: boolean;
  }) => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or search terms
          </p>
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Search size={16} />
              Search different terms
            </span>
            <span className="flex items-center gap-1">
              <Filter size={16} />
              Clear filters
            </span>
            <span className="flex items-center gap-1">
              <Tag size={16} />
              Browse categories
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`grid gap-8 ${
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            categoryConfig={categoryConfig}
            onViewProduct={onViewProduct}
            index={index}
          />
        ))}
      </div>
    );
  };

  if (!categoryConfig) {
    return <LoadingSkeleton />;
  }

  const IconComponent = categoryConfig.icon;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${categoryConfig.bgGradient}`}
    >
      {/* Category Hero Banner */}
      <div className="relative overflow-hidden hidden md:block">
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
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Browse by Subcategory
              </h2>
              <button
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
              >
                Show All Categories
              </button>
            </div>

            {/* Subcategory Carousel */}
            <div className="relative">
              {/* Navigation Buttons - Show when there are more items than can fit */}
              {subcategories.length > 2 && (
                <>
                  <button
                    onClick={prevSubcategorySlide}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hidden sm:flex"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>

                  <button
                    onClick={nextSubcategorySlide}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hidden sm:flex"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                </>
              )}

              {/* Subcategories Grid - Responsive */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 overflow-hidden">
                {subcategories
                  .slice(
                    subcategoryCarouselIndex,
                    subcategoryCarouselIndex +
                      (windowWidth < 640 ? 2 : windowWidth < 1024 ? 3 : 4)
                  )
                  .map((subcategory) => (
                    <button
                      key={subcategory.id}
                      onClick={() => handleSubcategoryChange(subcategory.name)}
                      className={`p-3 sm:p-4 rounded-xl text-center transition-all duration-300 hover:scale-105 ${
                        selectedSubcategory === subcategory.name
                          ? `bg-gradient-to-r ${categoryConfig.gradient} text-white shadow-lg`
                          : "bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80"
                      }`}
                    >
                      <div className="text-xl sm:text-2xl mb-2">
                        {getCategoryIcon(subcategory.name)}
                      </div>
                      <h3 className="font-semibold text-xs sm:text-sm">
                        {subcategory.name}
                      </h3>
                      {subcategory.description && (
                        <p className="text-xs mt-1 opacity-75 hidden sm:block">
                          {subcategory.description}
                        </p>
                      )}
                    </button>
                  ))}
              </div>

              {/* Carousel Indicators - Responsive */}
              {subcategories.length > 2 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {Array.from({
                    length: Math.ceil(
                      subcategories.length /
                        (windowWidth < 640 ? 2 : windowWidth < 1024 ? 3 : 4)
                    ),
                  }).map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                        index ===
                        Math.floor(
                          subcategoryCarouselIndex /
                            (windowWidth < 640 ? 2 : windowWidth < 1024 ? 3 : 4)
                        )
                          ? "bg-blue-600"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      onClick={() =>
                        setSubcategoryCarouselIndex(
                          index *
                            (windowWidth < 640 ? 2 : windowWidth < 1024 ? 3 : 4)
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {/* Mobile Swipe Instructions */}
              {subcategories.length > 2 && (
                <div className="text-center mt-2 sm:hidden">
                  <p className="text-xs text-gray-500">
                    Swipe to see more categories
                  </p>
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
                  placeholder={`Search ${
                    selectedCategory === "All"
                      ? "all products"
                      : selectedCategory.toLowerCase()
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Price Filter */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Prices</option>
                <option value="under-500">Under {formatCurrency(500)}</option>
                <option value="500-1000">
                  {formatCurrency(500)} - {formatCurrency(1000)}
                </option>
                <option value="1000-2000">
                  {formatCurrency(1000)} - {formatCurrency(2000)}
                </option>
                <option value="over-2000">Over {formatCurrency(2000)}</option>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              {selectedCategory === "All"
                ? "All Products"
                : `${categoryConfig.title} Collection`}
              {selectedSubcategory && ` - ${selectedSubcategory}`}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span>{sortedProducts.length} products available</span>
              {sortedProducts.length > 0 && (
                <>
                  <span className="hidden sm:inline text-gray-400">•</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                    {formatCurrency(
                      Math.min(...sortedProducts.map((p) => p.price || 0))
                    )}{" "}
                    -{" "}
                    {formatCurrency(
                      Math.max(...sortedProducts.map((p) => p.price || 0))
                    )}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 bg-white/50 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
            Showing results for "{selectedCategory}"
            {selectedSubcategory && ` > ${selectedSubcategory}`}
          </div>
        </div>

        {/* Products Grid */}
        <ProductsGrid
          products={sortedProducts}
          categoryConfig={categoryConfig}
          onViewProduct={handleViewProduct}
          viewMode={viewMode}
          isLoading={isLoading}
        />
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
