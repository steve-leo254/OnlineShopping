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
import axios from "axios";
import { useParams } from "react-router-dom";

// Types
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
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
  favorites?: any[];
}

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

type TabType = "description" | "specifications" | "reviews";
type NotificationType = "success" | "error" | "info";

const ProductDetail: React.FC = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
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

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/public/products/${productId}`
        );
        setProduct(res.data);
        setIsFavorite(res.data.isFavorite || false);
        // Fetch reviews
        const reviewsRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/products/${productId}/reviews`
        );
        setReviews(reviewsRes.data);
      } catch (err) {
        setProduct(null);
      }
      setLoading(false);
    };
    if (productId) fetchProduct();
  }, [productId]);

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

    if (quantity > product.stockQuantity) {
      showNotification(
        `Cannot add more than available stock (${product.stockQuantity})`,
        "error"
      );
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification(
        `${quantity} ${product.name}(s) added to cart!`,
        "success"
      );
    }, 500);
  };

  const handleQuantityChange = (newQuantity: number): void => {
    if (product && newQuantity >= 1 && newQuantity <= product.stockQuantity) {
      setQuantity(newQuantity);
    }
  };

  const toggleFavorite = async (): Promise<void> => {
    if (!product) return;
    try {
      if (!isFavorite) {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/favorites`, {
          product_id: product.id,
        });
        setIsFavorite(true);
        showNotification("Added to favorites!", "success");
      } else {
        // Optionally implement remove favorite endpoint
        setIsFavorite(false);
        showNotification("Removed from favorites", "info");
      }
    } catch (err) {
      showNotification("Error updating favorite", "error");
    }
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
    showNotification(`Viewing ${relatedProduct.name}`, "info");
  };

  const handleBackToProducts = (): void => {
    showNotification("Navigating back to products", "info");
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
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

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {notification.show && <div>{notification.message}</div>}

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
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stockQuantity}
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
                onClick={toggleFavorite}
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
              <div>
                <h4>Specifications</h4>
                <table>
                  <tbody>
                    {Object.entries(product.specifications).map(
                      ([key, value]) => (
                        <tr key={key}>
                          <td>{key}</td>
                          <td>{value}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <h4>Reviews</h4>
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div key={r.id}>
                      <strong>{r.rating}★</strong> {r.comment}
                    </div>
                  ))
                ) : (
                  <p>No reviews yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {/* ... existing related products code ... */}
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
