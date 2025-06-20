import React, { useState, useEffect } from "react";
import { Heart, ShoppingCart, X, Star, Eye, Share2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useFetchProducts } from "../components/UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../cart/formatCurrency";

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  rating?: number;
  category?: string | { id: string; name: string };
  images?: { img_url: string }[];
  // ...other fields
}

interface Favorite {
  id: number;
  product_id: number;
  user_id: number;
}

const WishList: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const { addToCart, getItemQuantity } = useShoppingCart();
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]); // for removing
  const [wishlistProducts, setWishlistProducts] = useState<ApiProduct[]>([]);
  const navigate = useNavigate();

  // Fetch favorite product IDs on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !token) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/favorites`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const ids = res.data.map((fav: Favorite) => fav.product_id.toString());
        setFavoriteProductIds(ids);
        setFavoriteIds(res.data.map((fav: Favorite) => fav.id));
        // Fetch all products by IDs in one request
        if (ids.length > 0) {
          const productsRes = await axios.get(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/public/products?ids=${ids.join(",")}`
          );
          setWishlistProducts(productsRes.data.items);
        } else {
          setWishlistProducts([]);
        }
      } catch (err) {
        setFavoriteProductIds([]);
        setFavoriteIds([]);
        setWishlistProducts([]);
      }
    };
    fetchFavorites();
  }, [isAuthenticated, token]);

  const removeFromWishlist = async (productId: string) => {
    const favIndex = wishlistProducts.findIndex((p) => p.id === productId);
    const favoriteId = favoriteIds[favIndex];
    setFavoriteProductIds((prev) => prev.filter((id) => id !== productId));
    setFavoriteIds((prev) => prev.filter((_, idx) => idx !== favIndex));
    setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
    if (!isAuthenticated || !token || !favoriteId) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/favorites/${favoriteId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Removed from wishlist!");
    } catch (err) {
      toast.error("Failed to remove from wishlist.");
    }
  };

  // Helper to calculate average rating from reviews
  const getAverageRating = (product: ApiProduct) => {
    if (
      Array.isArray((product as any).reviews) &&
      (product as any).reviews.length > 0
    ) {
      const reviews = (product as any).reviews;
      const total = reviews.reduce(
        (sum: number, r: any) => sum + (r.rating || 0),
        0
      );
      return (total / reviews.length).toFixed(1);
    }
    return product.rating?.toFixed
      ? product.rating.toFixed(1)
      : product.rating || "-";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white fill-current" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              My Wish List
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg px-4">
            {wishlistProducts.length} items saved for later
          </p>
        </div>

        {/* Filters */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <p className="text-gray-500 text-xs sm:text-sm lg:text-base px-4">
            Manage your saved items and add them to cart when ready
          </p>
        </div>

        {/* Empty State */}
        {wishlistProducts.length === 0 && (
          <div className="text-center py-12 sm:py-16 lg:py-20 xl:py-24 px-4">
            <div className="relative mb-6 sm:mb-8">
              {/* Floating hearts animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-300 absolute -top-4 sm:-top-6 -left-4 sm:-left-6 transform rotate-12" />
                  <Heart className="w-2 h-2 sm:w-3 sm:h-3 text-rose-300 absolute -top-6 sm:-top-8 right-2 sm:right-4 transform -rotate-12" />
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-200 absolute bottom-1 sm:bottom-2 -right-6 sm:-right-8 transform rotate-45" />
                </div>
              </div>

              {/* Main heart icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <Heart className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 text-pink-400" />
              </div>
            </div>

            <div className="max-w-sm sm:max-w-md mx-auto px-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 mb-2 sm:mb-3 lg:mb-4">
                Your wishlist awaits
              </h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 lg:mb-8 leading-relaxed">
                Save items you love and create your perfect collection. Your
                future self will thank you!
              </p>

              {/* Call to action */}
              <div className="space-y-3 sm:space-y-4">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Start Exploring
                </button>

                <div className="flex items-center justify-center gap-3 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-gray-400 mt-4 sm:mt-6 lg:mt-8">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-300 rounded-full"></div>
                    <span>Save favorites</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-300 rounded-full"></div>
                    <span>Track prices</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-300 rounded-full"></div>
                    <span>Quick checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 px-2 sm:px-0">
          {wishlistProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden">
                <img
                  src={
                    Array.isArray(product.images) && product.images.length > 0
                      ? product.images[0].img_url.startsWith("http")
                        ? product.images[0].img_url
                        : `${import.meta.env.VITE_API_BASE_URL}${
                            product.images[0].img_url
                          }`
                      : ""
                  }
                  alt={product.name}
                  className="w-full h-40 sm:h-48 lg:h-56 xl:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Overlay Actions - Only show on hover for larger screens */}
                <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="flex gap-2 pointer-events-auto">
                    <button
                      onClick={() => navigate(`/product-details/${product.id}`)}
                      className="p-2 lg:p-3 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                    </button>
                    <button className="p-2 lg:p-3 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                      <Share2 className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Remove Button - Always visible on mobile, hover on desktop */}
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 p-1.5 sm:p-2 bg-white rounded-full shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 hover:scale-110 z-10"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                </button>

                {/* Discount Badge */}
                {product.original_price && (
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 lg:top-4 lg:left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium">
                    {Math.round(
                      ((product.original_price - product.price) /
                        product.original_price) *
                        100
                    )}
                    % OFF
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 lg:p-5 xl:p-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 sm:py-1 rounded-full truncate flex-shrink-0">
                    {typeof product.category === "string"
                      ? product.category
                      : product.category &&
                        typeof product.category === "object" &&
                        "name" in product.category
                      ? product.category.name
                      : ""}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      {getAverageRating(product)}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2 leading-tight">
                  {product.name}
                </h3>

                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {product.original_price && (
                    <span className="text-xs sm:text-sm lg:text-base text-gray-500 line-through">
                      {formatCurrency(product.original_price)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      addToCart({
                        id:
                          typeof product.id === "string"
                            ? parseInt(product.id)
                            : product.id,
                        name: product.name,
                        price: product.price,
                        img_url:
                          Array.isArray(product.images) &&
                          product.images.length > 0
                            ? product.images[0].img_url.startsWith("http")
                              ? product.images[0].img_url
                              : `${import.meta.env.VITE_API_BASE_URL}${
                                  product.images[0].img_url
                                }`
                            : null,
                        stockQuantity: (product as any).stock_quantity || 1,
                      });
                      toast.success(`${product.name} added to cart!`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 lg:py-3 px-2 sm:px-3 lg:px-4 rounded-lg lg:rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:scale-105 text-xs sm:text-sm lg:text-base"
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Add to Cart</span>
                  </button>

                  {/* Mobile action buttons */}
                  <div className="flex gap-1 sm:hidden">
                    <button
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={() => navigate(`/product-details/${product.id}`)}
                    >
                      <Eye className="w-3 h-3 text-gray-600" />
                    </button>
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      <Share2 className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        {wishlistProducts.length > 0 && (
          <div className="mt-6 sm:mt-8 lg:mt-12 text-center px-4">
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
              <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:scale-105 transition-transform duration-300 shadow-lg text-sm sm:text-base">
                Share Wishlist
              </button>
              <button
                onClick={() => navigate("/store")}
               className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-white text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors duration-300 border border-gray-200 text-sm sm:text-base">
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishList;
