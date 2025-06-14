import React, { useState } from "react";
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

// Static data
const staticProduct = {
  id: 1,
  name: "Premium Wireless Headphones",
  price: 199.99,
  originalPrice: 249.99,
  rating: 4.5,
  reviews: 324,
  images: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&h=800&fit=crop",
  ],
  category: "Electronics",
  brand: "AudioTech",
  inStock: true,
  discount: 20,
  isNew: true,
  isFavorite: false,
  stockQuantity: 15,
  description: "Experience premium sound quality with these wireless headphones featuring active noise cancellation, 30-hour battery life, and premium comfort padding. Perfect for music lovers, professionals, and anyone who values high-quality audio.",
  barcode: "AT-WH-001",
  createdAt: "2024-01-01T00:00:00Z",
  specifications: {
    Brand: "AudioTech",
    Category: "Electronics",
    SKU: "AT-WH-001",
    "Battery Life": "30 hours",
    "Connectivity": "Bluetooth 5.0",
    "Noise Cancellation": "Active",
    "Weight": "250g",
    "Warranty": "2 years",
    "In Stock": "Yes",
    "Stock Quantity": "15",
    "Date Added": "January 1, 2024",
  },
};

const staticReviews = [
  {
    id: 1,
    user: "John D.",
    rating: 5,
    comment: "Excellent product! The sound quality is amazing and the noise cancellation works perfectly. Highly recommended!",
    date: "2024-01-15",
    verified: true,
  },
  {
    id: 2,
    user: "Sarah M.",
    rating: 4,
    comment: "Good quality headphones. The battery life is impressive, though I wish they were a bit lighter.",
    date: "2024-01-10",
    verified: true,
  },
  {
    id: 3,
    user: "Mike R.",
    rating: 5,
    comment: "Amazing value for money. The sound is crisp and clear, and they're very comfortable for long listening sessions.",
    date: "2024-01-08",
    verified: false,
  },
];

const relatedProducts = [
  {
    id: 2,
    name: "Wireless Earbuds Pro",
    price: 129.99,
    originalPrice: 149.99,
    rating: 4.3,
    reviews: 156,
    images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop"],
  },
  {
    id: 3,
    name: "Gaming Headset RGB",
    price: 89.99,
    originalPrice: 99.99,
    rating: 4.7,
    reviews: 89,
    images: ["https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=400&fit=crop"],
  },
  {
    id: 4,
    name: "Studio Monitor Speakers",
    price: 299.99,
    originalPrice: 349.99,
    rating: 4.6,
    reviews: 203,
    images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop"],
  },
  {
    id: 5,
    name: "Bluetooth Speaker",
    price: 79.99,
    originalPrice: 99.99,
    rating: 4.4,
    reviews: 445,
    images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop"],
  },
];

type TabType = "description" | "specifications" | "reviews";
type NotificationType = "success" | "error" | "info";

const ProductDetail: React.FC = () => {
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const showNotification = (message: string, type: NotificationType = "success"): void => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleAddToCart = (): void => {
    if (quantity > staticProduct.stockQuantity) {
      showNotification(
        `Cannot add more than available stock (${staticProduct.stockQuantity})`,
        "error"
      );
      return;
    }
    showNotification(`${quantity} ${staticProduct.name}(s) added to cart!`, "success");
  };

  const handleQuantityChange = (newQuantity: number): void => {
    if (newQuantity >= 1 && newQuantity <= staticProduct.stockQuantity) {
      setQuantity(newQuantity);
    }
  };

  const toggleFavorite = (): void => {
    setIsFavorite(!isFavorite);
    showNotification(
      isFavorite ? "Removed from favorites" : "Added to favorites!",
      isFavorite ? "info" : "success"
    );
  };

  const handleShare = async (): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: staticProduct.name,
          text: `Check out this amazing product: ${staticProduct.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification("Product link copied to clipboard!", "info");
    }
  };

  const handleImageNavigation = (direction: 'prev' | 'next'): void => {
    setSelectedImageIndex(prevIndex => {
      if (direction === 'prev') {
        return prevIndex === 0 ? staticProduct.images.length - 1 : prevIndex - 1;
      } else {
        return prevIndex === staticProduct.images.length - 1 ? 0 : prevIndex + 1;
      }
    });
  };

  const renderStars = (rating: number): JSX.Element => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderNotification = (): JSX.Element | null => {
    if (!notification.show) return null;

    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }[notification.type];

    return (
      <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`}>
        {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
        {notification.type === 'error' && <X className="w-5 h-5" />}
        {notification.type === 'info' && <Eye className="w-5 h-5" />}
        <span>{notification.message}</span>
        <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNotification()}
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
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
                src={staticProduct.images[selectedImageIndex]}
                alt={staticProduct.name}
                className="w-full h-96 object-cover cursor-pointer"
                onClick={() => setShowImageModal(true)}
              />
              
              {staticProduct.images.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageNavigation('prev')}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleImageNavigation('next')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {staticProduct.isNew && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    NEW
                  </span>
                )}
                {staticProduct.discount > 0 && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    -{staticProduct.discount}%
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {staticProduct.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {staticProduct.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${staticProduct.name} ${index + 1}`}
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
                <span className="text-sm text-gray-500">{staticProduct.category}</span>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{staticProduct.name}</h1>
              <p className="text-gray-600 mb-4">{staticProduct.brand}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                {renderStars(staticProduct.rating)}
                <span className="text-gray-600">({staticProduct.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(staticProduct.price)}
                </span>
                {staticProduct.originalPrice > staticProduct.price && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(staticProduct.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {staticProduct.inStock ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">
                    In Stock ({staticProduct.stockQuantity} available)
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
            {staticProduct.inStock && (
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
                    disabled={quantity >= staticProduct.stockQuantity}
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
                disabled={!staticProduct.inStock}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              
              <button
                onClick={toggleFavorite}
                className={`p-3 rounded-lg border transition-colors ${
                  isFavorite
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-white border-gray-300 text-gray-600 hover:text-red-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
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
              {(['description', 'specifications', 'reviews'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{staticProduct.description}</p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(staticProduct.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">{key}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {staticReviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{review.user}</span>
                        {review.verified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct.id}
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
                    <span className="text-sm text-gray-500">({relatedProduct.reviews})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {formatCurrency(relatedProduct.price)}
                    </span>
                    {relatedProduct.originalPrice > relatedProduct.price && (
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
              src={staticProduct.images[selectedImageIndex]}
              alt={staticProduct.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;