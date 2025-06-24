import React, { useState } from "react";
import { Star, Heart, Eye, ShoppingCart, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../cart/formatCurrency";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import { useUserStats } from "../context/UserStatsContext";
import { useFavorites } from "../context/FavoritesContext";
import { toast } from "react-toastify";

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

interface ProductCardProps {
  product: Product;
  onFavoriteChange?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onFavoriteChange,
}) => {
  const navigate = useNavigate();
  const { addToCart, getItemQuantity, removeFromCart } = useShoppingCart();
  const { token, isAuthenticated } = useAuth();
  const { refreshStats } = useUserStats();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  let userId: number | null = null;
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      userId = decoded.id;
    } catch {}
  }

  const handleAddToCart = () => {
    addToCart({
      id: parseInt(product.id),
      name: product.name,
      price: product.price,
      img_url: product.img_url,
      stockQuantity: product.stockQuantity,
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !token || !userId) {
      toast.error("You must be logged in to use favorites.");
      return;
    }
    setIsProcessing(true);
    const isFav = isFavorite(product.id.toString());
    try {
      if (!isFav) {
        await addFavorite(product.id.toString());
      } else {
        await removeFavorite(product.id.toString());
      }
      if (onFavoriteChange) onFavoriteChange();
      refreshStats();
    } catch (err) {
      // Optionally handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/product-details/${product.id}`);
  };

  const handleCardClick = () => {
    navigate(`/product-details/${product.id}`);
  };

  const handleRemoveFromCart = () => {
    removeFromCart(parseInt(product.id));
    toast.info(`${product.name} removed from cart.`);
  };

  const isInCart = getItemQuantity(parseInt(product.id)) > 0;
  const isFavorited = isFavorite(product.id.toString());
  const isOutOfStock = !product.inStock;
  const isMaxQuantity =
    getItemQuantity(parseInt(product.id)) >= product.stockQuantity;

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 flex flex-col cursor-pointer transform hover:-translate-y-1 will-change-transform"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {/* Image */}
        <img
          src={product.img_url}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 ${
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          } group-hover:scale-110`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop";
            setImageLoaded(true);
          }}
        />

        {/* Image Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}

        {/* Badges Container */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          {product.isNew && (
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
              New
            </div>
          )}
          {product.discount > 0 && (
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
              -{product.discount}%
            </div>
          )}
        </div>

        {/* Action Buttons - Always visible on mobile, hover on desktop */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-30">
          <button
            onClick={handleFavoriteClick}
            disabled={isProcessing}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center backdrop-blur-md hover:scale-110 active:scale-95 ${
              isFavorited
                ? "bg-red-500 text-white shadow-red-200"
                : "bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white shadow-gray-200"
            }`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-200 ${
                isProcessing ? "animate-pulse" : ""
              }`}
              fill={isFavorited ? "currentColor" : "none"}
            />
          </button>

          <button
            onClick={handleViewClick}
            className="w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-md text-gray-600 hover:text-blue-600 hover:bg-white rounded-full shadow-lg shadow-gray-200 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
            title="Quick view"
          >
            <Eye className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center z-10">
            <div className="bg-white/95 backdrop-blur-sm text-gray-900 font-semibold px-4 py-2 rounded-full shadow-lg">
              Out of Stock
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1 space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {product.category}
            </span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {product.brand}
            </span>
          </div>

          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 text-base leading-tight">
            {product.name}
          </h3>
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => {
              const rating = product.rating || 0;
              const isFilled = i < Math.floor(rating);
              const isHalfFilled =
                i === Math.floor(rating) && rating % 1 >= 0.5;

              return (
                <div key={i} className="relative">
                  <Star
                    className={`w-4 h-4 ${
                      isFilled
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 fill-gray-300"
                    }`}
                  />
                  {isHalfFilled && (
                    <Star
                      className="absolute inset-0 w-4 h-4 text-yellow-400 fill-yellow-400"
                      style={{
                        clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {product.rating ? product.rating.toFixed(1) : "0.0"}
          </span>
          <span className="text-xs text-gray-500">
            ({(product.reviews || 0).toLocaleString()})
          </span>
        </div>

        {/* Stock Info */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              product.stockQuantity > 10
                ? "bg-green-400"
                : product.stockQuantity > 0
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
          />
          <span className="text-xs text-gray-600">
            {product.stockQuantity > 0
              ? `${product.stockQuantity} in stock`
              : "Out of stock"}
          </span>
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Truck className="w-3 h-3" />
            <span>Convenient delivery options</span>
          </div>
        </div>

        {/* Add to Cart or Remove Button */}
        {isInCart ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFromCart();
            }}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 text-sm relative overflow-hidden bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 hover:shadow-red-300`}
          >
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">Remove from Cart</span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={isOutOfStock || isMaxQuantity}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 text-sm relative overflow-hidden ${
              isOutOfStock || isMaxQuantity
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">
              {isOutOfStock
                ? "Out of Stock"
                : isMaxQuantity
                ? "Max Quantity Reached"
                : "Add to Cart"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
