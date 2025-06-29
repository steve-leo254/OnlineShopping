import React, { useState, useEffect } from "react";
import {
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Share2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Truck,
  RotateCcw,
  CheckCircle,
  X,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useAuth } from "../context/AuthContext";
import { useUserStats } from "../context/UserStatsContext";
import { useFavorites } from "../context/FavoritesContext";
import { toast } from "react-toastify";

// Types
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  images: string[];
  category: string;
  brand: string;
  inStock: boolean;
  discount?: number;
  isNew?: boolean;
  isFavorite?: boolean;
  stockQuantity: number;
  description: string;
  barcode?: string;
  createdAt?: string;
  specifications: Record<string, string | number>;
}

// Backend Review type
interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id: number;
  rating: number;
  comment: string;
  created_at: string;
  username?: string;
}

type TabType = "description" | "specifications" | "reviews";

// Static Data

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-KE", {
  currency: "KES",
  style: "currency",
  currencyDisplay: "symbol",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(number: number) {
  // Format the number and replace all "KSh" or "KSH" (with or without space) with "Ksh "
  return CURRENCY_FORMATTER.format(number)
    .replace(/KSh|KSH/gi, "Ksh")
    .replace(/\s*Ksh/, " Ksh"); // Ensure a space before Ksh
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const {
    addToCart,
    increaseCartQuantity,
    decreaseCartQuantity,
    getItemQuantity,
    removeFromCart,
  } = useShoppingCart();
  const { isAuthenticated, token } = useAuth();
  const { refreshStats } = useUserStats();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isProcessingFavorite, setIsProcessingFavorite] =
    useState<boolean>(false);

  const calculateAverageRating = (reviews: Review[]): number => {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      if (!id) {
        setError("No product ID provided.");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/public/products/${id}`);
        const data = res.data;

        // Transform images
        let images: string[] = [];
        if (
          data.images &&
          Array.isArray(data.images) &&
          data.images.length > 0
        ) {
          images = data.images.map((img: any) =>
            img.img_url.startsWith("http")
              ? img.img_url
              : `${API_BASE_URL}${img.img_url}`
          );
        }

        // Transform specifications
        let specifications: Record<string, string | number> = {};
        if (
          data.product_specifications &&
          Array.isArray(data.product_specifications)
        ) {
          data.product_specifications.forEach((spec: any) => {
            if (spec.specification && spec.specification.name) {
              specifications[spec.specification.name] = spec.value;
            }
          });
        }

        // Fetch reviews first to calculate rating
        let fetchedReviews: Review[] = [];
        try {
          const reviewsRes = await axios.get(
            `${API_BASE_URL}/products/${data.id}/reviews`
          );
          fetchedReviews = reviewsRes.data;
          setReviews(fetchedReviews);
        } catch {
          setReviews([]);
        }

        // Calculate rating from reviews
        const calculatedRating = calculateAverageRating(fetchedReviews);

        // Compose product object with calculated rating
        const prod: Product = {
          id: data.id,
          name: data.name,
          price: data.price,
          originalPrice: data.original_price,
          rating: calculatedRating, // Use calculated rating
          reviews: fetchedReviews.length, // Use actual review count
          images,
          category: data.category?.name || "Uncategorized",
          brand: data.brand || "Unknown",
          inStock: data.stock_quantity > 0,
          discount: data.discount || 0,
          isNew: data.is_new || false,
          isFavorite: false,
          stockQuantity: data.stock_quantity,
          description: data.description || "",
          barcode: data.barcode,
          createdAt: data.created_at,
          specifications,
        };

        setProduct(prod);

        // Fetch related products with ratings
        if (data.category && data.category.id) {
          const relRes = await axios.get(`${API_BASE_URL}/public/products`, {
            params: { category_id: data.category.id, limit: 8 },
          });
          const relItems = relRes.data.items.filter(
            (p: any) => p.id !== data.id
          );

          // Fetch reviews for each related product to calculate ratings
          const relatedProductsWithRatings = await Promise.all(
            relItems.map(async (item: any) => {
              let itemRating = 0;
              let itemReviewCount = 0;

              try {
                const itemReviewsRes = await axios.get(
                  `${API_BASE_URL}/products/${item.id}/reviews`
                );
                const itemReviews = itemReviewsRes.data;
                itemRating = calculateAverageRating(itemReviews);
                itemReviewCount = itemReviews.length;
              } catch {
                // If reviews fetch fails, keep default values
                itemRating = 0;
                itemReviewCount = 0;
              }

              return {
                id: item.id,
                name: item.name,
                price: item.price,
                originalPrice: item.original_price,
                rating: itemRating, // Use calculated rating
                reviews: itemReviewCount, // Use actual review count
                images:
                  item.images && item.images.length > 0
                    ? item.images.map((img: any) =>
                        img.img_url.startsWith("http")
                          ? img.img_url
                          : `${API_BASE_URL}${img.img_url}`
                      )
                    : [
                        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop",
                      ],
                category: item.category?.name || "Uncategorized",
                brand: item.brand || "Unknown",
                inStock: item.stock_quantity > 0,
                discount: item.discount || 0,
                isNew: item.is_new || false,
                isFavorite: false,
                stockQuantity: item.stock_quantity,
                description: item.description || "",
                barcode: item.barcode,
                createdAt: item.created_at,
                specifications: {},
              };
            })
          );

          setRelatedProducts(relatedProductsWithRatings);
        } else {
          setRelatedProducts([]);
        }
      } catch (err: any) {
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, API_BASE_URL, isAuthenticated, token]);

  const handleAddToCart = (): void => {
    if (!product) return;
    if (getItemQuantity(product.id) >= product.stockQuantity) {
      toast.error(
        `Cannot add more than available stock (${product.stockQuantity})`
      );
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      img_url: product.images[0] || null,
      stockQuantity: product.stockQuantity,
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleRemoveFromCart = (): void => {
    if (!product) return;
    removeFromCart(product.id);
    toast.info(`${product.name} removed from cart.`);
  };

  const handleShare = async (): Promise<void> => {
    if (!product) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this amazing product: ${product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      toast.info("Product link copied to clipboard!");
    }
  };

  const handleImageNavigation = (direction: "prev" | "next"): void => {
    if (!product) return;

    setSelectedImageIndex((prevIndex) => {
      if (direction === "prev") {
        return prevIndex === 0 ? product.images.length - 1 : prevIndex - 1;
      } else {
        return prevIndex === product.images.length - 1 ? 0 : prevIndex + 1;
      }
    });
  };

  const handleRelatedProductClick = (relatedProduct: Product): void => {
    navigate(`/product-details/${relatedProduct.id}`);
  };

  const renderStars = (rating: number) => {
    const numericRating = Number(rating) || 0;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          const isFullStar = i < Math.floor(numericRating);
          const isHalfStar =
            i === Math.floor(numericRating) && numericRating % 1 >= 0.5;

          return (
            <Star
              key={i}
              className={`w-4 h-4 ${
                isFullStar
                  ? "text-yellow-400 fill-yellow-400"
                  : isHalfStar
                  ? "text-yellow-400 fill-yellow-200"
                  : "text-gray-300"
              }`}
            />
          );
        })}
      </div>
    );
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated || !token || !product) {
      toast.error("You must be logged in to use favorites.");
      return;
    }
    setIsProcessingFavorite(true);
    const isFav = isFavorite(product.id.toString());
    try {
      if (!isFav) {
        await addFavorite(product.id.toString());
        toast.success("Added to favorites!");
      } else {
        await removeFavorite(product.id.toString());
        toast.info("Removed from favorites");
      }
      refreshStats();
    } catch (err) {
      toast.error("Failed to update favorites.");
    } finally {
      setIsProcessingFavorite(false);
    }
  };

  const getProductsPerSlide = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) return 4; // lg screens
      if (window.innerWidth >= 768) return 2; // md screens
      return 1; // mobile
    }
    return 4; // default fallback
  };

  const getTotalSlides = () => {
    const productsPerSlide = getProductsPerSlide();
    return Math.ceil(relatedProducts.length / productsPerSlide);
  };

  // Updated navigation functions:
  const handleNextSlide = (): void => {
    const totalSlides = getTotalSlides();
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const handlePrevSlide = (): void => {
    const totalSlides = getTotalSlides();
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  // Add this useEffect to handle screen resize:
  useEffect(() => {
    const handleResize = () => {
      const totalSlides = getTotalSlides();
      if (currentSlide >= totalSlides) {
        setCurrentSlide(0);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentSlide, relatedProducts.length]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Product not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-lg overflow-hidden shadow-lg">
              <img
                src={product.images[selectedImageIndex]}
                alt={product.name}
                className="w-full h-96 object-cover cursor-pointer"
                onClick={() => setShowImageModal(true)}
              />

              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageNavigation("prev")}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleImageNavigation("next")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:scale-[1.02] active:scale-[0.98] px-2 py-1 rounded text-xs font-medium">
                    NEW
                  </span>
                )}
                {product.discount && product.discount > 0 && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    -{product.discount}%
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {product.category}
                </span>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600 mb-4">{product.brand}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                {renderStars(product.rating)}
                <span className="text-gray-700 font-semibold">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-gray-600">({product.reviews})</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice &&
                  product.originalPrice > product.price && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">
                    In Stock ({product.stockQuantity} available)
                  </span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => decreaseCartQuantity(product.id)}
                    disabled={getItemQuantity(product.id) <= 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">
                    {getItemQuantity(product.id)}
                  </span>
                  <button
                    onClick={() => {
                      if (getItemQuantity(product.id) < product.stockQuantity) {
                        increaseCartQuantity(product.id);
                      }
                    }}
                    disabled={
                      getItemQuantity(product.id) >= product.stockQuantity
                    }
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {getItemQuantity(product.id) > 0 ? (
                <button
                  onClick={handleRemoveFromCart}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-red-200 hover:shadow-red-300 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Remove from Cart
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 text-sm relative overflow-hidden ${
                    !product.inStock
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold">Add to Cart</span>
                  {/* Ripple effect */}
                  {product.inStock && (
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  )}
                </button>
              )}

              <button
                onClick={handleFavoriteToggle}
                disabled={isProcessingFavorite}
                className={`p-3 rounded-lg border transition-colors flex items-center justify-center ${
                  isFavorite(product.id.toString())
                    ? "bg-red-500 border-red-200 text-white shadow-red-200"
                    : "bg-white border-gray-300 text-gray-600 hover:text-red-600"
                } ${
                  isProcessingFavorite ? "opacity-60 cursor-not-allowed" : ""
                }`}
                title={
                  isFavorite(product.id.toString())
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-200 ${
                    isProcessingFavorite ? "animate-pulse" : ""
                  }`}
                  fill={
                    isFavorite(product.id.toString()) ? "currentColor" : "none"
                  }
                />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-5 h-5" />
                <span>Home delivery service</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-5 h-5" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw className="w-5 h-5" />
                <span>7-Day Return</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {(["description", "specifications", "reviews"] as TabType[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between py-2 border-b border-gray-100"
                  >
                    <span className="font-medium text-gray-900">{key}:</span>
                    <span className="text-gray-600">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white p-6 rounded-lg shadow-sm border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {review.username
                              ? review.username
                              : `User #${review.user_id}`}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No reviews yet. Be the first to review by completing an
                      order!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Related Products
              </h2>
              {getTotalSlides() > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevSlide}
                    className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                }}
              >
                {Array.from({ length: getTotalSlides() }, (_, slideIndex) => {
                  const productsPerSlide = getProductsPerSlide();
                  const startIndex = slideIndex * productsPerSlide;
                  const slideProducts = relatedProducts.slice(
                    startIndex,
                    startIndex + productsPerSlide
                  );

                  return (
                    <div
                      key={slideIndex}
                      className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                    >
                      {slideProducts.map((relatedProduct) => (
                        <div
                          key={relatedProduct.id}
                          onClick={() =>
                            handleRelatedProductClick(relatedProduct)
                          }
                          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full"
                        >
                          <img
                            src={relatedProduct.images[0]}
                            alt={relatedProduct.name}
                            className="w-full h-40 md:h-48 object-cover"
                          />
                          <div className="p-3 md:p-4">
                            <h3 className="font-medium text-gray-900 mb-2 text-sm md:text-base line-clamp-2">
                              {relatedProduct.name}
                            </h3>
                            <div className="flex items-center gap-1 md:gap-2 mb-2">
                              <div className="flex">
                                {renderStars(relatedProduct.rating)}
                              </div>
                              <span className="text-gray-700 font-semibold text-xs md:text-sm">
                                {relatedProduct.rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({relatedProduct.reviews})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm md:text-base">
                                {formatCurrency(relatedProduct.price)}
                              </span>
                              {relatedProduct.originalPrice &&
                                relatedProduct.originalPrice >
                                  relatedProduct.price && (
                                  <span className="text-xs md:text-sm text-gray-500 line-through">
                                    {formatCurrency(
                                      relatedProduct.originalPrice
                                    )}
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Slide Indicators */}
            {getTotalSlides() > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {Array.from({ length: getTotalSlides() }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentSlide === index ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={product.images[selectedImageIndex]}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
