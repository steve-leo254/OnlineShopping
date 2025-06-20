import React, { useState } from "react";
import { Star, Heart, Eye, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../cart/formatCurrency";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

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
  favorites: Set<string>;
  toggleFavorite: (productId: string) => void;
  onFavoriteChange?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  favorites,
  toggleFavorite,
  onFavoriteChange,
}) => {
  const navigate = useNavigate();
  const { addToCart, getItemQuantity } = useShoppingCart();
  const { token, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

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
  };

  const handleFavoriteClick = async () => {
    if (!isAuthenticated || !token || !userId) return;
    setIsProcessing(true);
    const isFav = favorites.has(product.id) || product.isFavorite;
    // Optimistically update UI
    toggleFavorite(product.id);
    try {
      if (!isFav) {
        // Add to favorites
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/favorites`,
          { product_id: parseInt(product.id), user_id: userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Remove from favorites: need favorite id, so assume API supports DELETE by product_id
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/favorites`, {
          data: { product_id: parseInt(product.id) },
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (onFavoriteChange) onFavoriteChange();
    } catch (err) {
      // Revert optimistic update on error
      toggleFavorite(product.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 flex flex-col h-full">
      <div className="relative overflow-hidden aspect-square">
        <img
          src={product.img_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop";
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
            onClick={handleFavoriteClick}
            disabled={isProcessing}
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
          <button
            onClick={() => navigate(`/product-details/${product.id}`)}
            className="p-2 bg-white text-gray-600 hover:text-blue-600 rounded-full shadow-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between h-full">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
              {product.category}
            </span>
            <span className="text-xs text-gray-500">{product.brand}</span>
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
            <span className="text-xs text-gray-500">({product.reviews})</span>
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
              onClick={handleAddToCart}
              disabled={
                !product.inStock ||
                getItemQuantity(parseInt(product.id)) >= product.stockQuantity
              }
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                product.inStock &&
                getItemQuantity(parseInt(product.id)) < product.stockQuantity
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="w-4 h-4 flex-shrink-0" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
