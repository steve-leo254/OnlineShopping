import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
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
  Eye,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useShoppingCart } from "../context/ShoppingCartContext";

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
}

type TabType = "description" | "specifications" | "reviews";
type NotificationType = "success" | "error" | "info";

// Static Data
const staticProduct: Product = {
  id: 1,
  name: "Wireless Bluetooth Headphones Pro Max",
  price: 299.99,
  originalPrice: 399.99,
  rating: 4.5,
  reviews: 1247,
  images: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&h=600&fit=crop",
  ],
  category: "Electronics",
  brand: "AudioTech",
  inStock: true,
  discount: 25,
  isNew: true,
  isFavorite: false,
  stockQuantity: 15,
  description:
    "Experience premium sound quality with our flagship wireless headphones. Featuring advanced noise cancellation technology, 40-hour battery life, and crystal-clear audio reproduction. Perfect for music enthusiasts, professionals, and everyday use. The ergonomic design ensures comfortable wear for extended periods, while the premium materials provide durability and style.",
  specifications: {
    "Driver Size": "40mm",
    "Frequency Response": "20Hz - 20kHz",
    "Battery Life": "40 hours",
    "Charging Time": "2 hours",
    Weight: "280g",
    Connectivity: "Bluetooth 5.0",
    "Noise Cancellation": "Active ANC",
    Microphone: "Built-in",
    Warranty: "2 years",
  },
};

const staticReviews: Review[] = [
  {
    id: 1,
    user_id: 1,
    product_id: 1,
    order_id: 1,
    rating: 5,
    comment:
      "Absolutely amazing headphones! The sound quality is incredible and the noise cancellation works perfectly. I use them daily for work calls and music.",
    created_at: "2024-01-15",
  },
  {
    id: 2,
    user_id: 2,
    product_id: 1,
    order_id: 2,
    rating: 4,
    comment:
      "Great build quality and comfortable to wear. Battery life is excellent. Only minor complaint is that they're a bit heavy for long sessions.",
    created_at: "2024-01-10",
  },
  {
    id: 3,
    user_id: 3,
    product_id: 1,
    order_id: 3,
    rating: 5,
    comment:
      "Best purchase I've made this year. The audio is crystal clear and the ANC is top-notch. Highly recommend!",
    created_at: "2024-01-08",
  },
];

const staticRelatedProducts: Product[] = [
  {
    id: 2,
    name: "Wireless Earbuds Pro",
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.3,
    reviews: 892,
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
    ],
    category: "Electronics",
    brand: "AudioTech",
    inStock: true,
    discount: 20,
    stockQuantity: 25,
    description: "Compact wireless earbuds with great sound",
    specifications: {},
  },
  {
    id: 3,
    name: "Gaming Headset RGB",
    price: 149.99,
    rating: 4.1,
    reviews: 445,
    images: [
      "https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=400&fit=crop",
    ],
    category: "Electronics",
    brand: "GameTech",
    inStock: true,
    stockQuantity: 18,
    description: "Professional gaming headset with RGB lighting",
    specifications: {},
  },
  {
    id: 4,
    name: "Studio Monitor Headphones",
    price: 399.99,
    rating: 4.7,
    reviews: 234,
    images: [
      "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400&h=400&fit=crop",
    ],
    category: "Electronics",
    brand: "StudioPro",
    inStock: false,
    stockQuantity: 0,
    description: "Professional studio monitoring headphones",
    specifications: {},
  },
  {
    id: 5,
    name: "Noise Cancelling Headphones",
    price: 249.99,
    originalPrice: 299.99,
    rating: 4.4,
    reviews: 678,
    images: [
      "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=400&h=400&fit=crop",
    ],
    category: "Electronics",
    brand: "QuietTech",
    inStock: true,
    discount: 17,
    stockQuantity: 12,
    description: "Advanced noise cancelling technology",
    specifications: {},
  },
];

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
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: NotificationType;
  }>({
    show: false,
    message: "",
    type: "success",
  });
  const {
    addToCart,
    increaseCartQuantity,
    decreaseCartQuantity,
    getItemQuantity,
  } = useShoppingCart();

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
        setIsFavorite(false);
  
        // Fetch related products
        if (data.category && data.category.id) {
          const relRes = await axios.get(`${API_BASE_URL}/public/products`, {
            params: { category_id: data.category.id, limit: 8 },
          });
          const relItems = relRes.data.items.filter(
            (p: any) => p.id !== data.id
          );
          setRelatedProducts(
            relItems.map((item: any) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              originalPrice: item.original_price,
              rating: item.rating || 0, // You might want to calculate this too
              reviews: item.reviews ? item.reviews.length : 0,
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
            }))
          );
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
  }, [id, API_BASE_URL]);

  useEffect(() => {
    if (product) setIsFavorite(product.isFavorite || false);
  }, [product]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const showNotification = (
    message: string,
    type: NotificationType = "success"
  ): void => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleAddToCart = (): void => {
    if (!product) return;
    if (getItemQuantity(product.id) >= product.stockQuantity) {
      showNotification(
        `Cannot add more than available stock (${product.stockQuantity})`,
        "error"
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
    showNotification(`${product.name} added to cart!`, "success");
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
      showNotification("Product link copied to clipboard!", "info");
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

  const handleBackToProducts = (): void => {
    showNotification("Navigating back to products", "info");
  };

  const renderStars = (rating: number) => {
    const numericRating = Number(rating) || 0;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          const isFullStar = i < Math.floor(numericRating);
          const isHalfStar = i === Math.floor(numericRating) && numericRating % 1 >= 0.5;
          
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
  

  const renderNotification = () => {
    if (!notification.show) return null;

    const bgColor = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
    }[notification.type];

    return (
      <div
        className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`}
      >
        {notification.type === "success" && <CheckCircle className="w-5 h-5" />}
        {notification.type === "error" && <X className="w-5 h-5" />}
        {notification.type === "info" && <Eye className="w-5 h-5" />}
        <span>{notification.message}</span>
        <button
          onClick={() => setNotification((prev) => ({ ...prev, show: false }))}
          className="ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

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
      {renderNotification()}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleBackToProducts}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </button>
        </div>
      </div>

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
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
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
                <span className="text-gray-600">
                  ({product.reviews} reviews)
                </span>
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
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>

              <button
                onClick={() => {
                  // Simulate API call
                  setTimeout(() => {
                    setIsFavorite(!isFavorite);
                    showNotification(
                      isFavorite
                        ? "Removed from favorites"
                        : "Added to favorites!",
                      isFavorite ? "info" : "success"
                    );
                  }, 300);
                }}
                className={`p-3 rounded-lg border transition-colors ${
                  isFavorite
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-white border-gray-300 text-gray-600 hover:text-red-600"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-5 h-5" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-5 h-5" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw className="w-5 h-5" />
                <span>30-Day Return</span>
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
                            {`User #${review.user_id}`}
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
                      No reviews yet. Be the first to review this product!
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  onClick={() => handleRelatedProductClick(relatedProduct)}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <img
                    src={relatedProduct.images[0]}
                    alt={relatedProduct.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(relatedProduct.rating)}
                      <span className="text-sm text-gray-500">
                        ({relatedProduct.reviews})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        {formatCurrency(relatedProduct.price)}
                      </span>
                      {relatedProduct.originalPrice &&
                        relatedProduct.originalPrice > relatedProduct.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(relatedProduct.originalPrice)}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
