import React, { useState } from 'react';
import { Heart, ShoppingCart, X, Star, Eye, Share2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  category: string;
}

const WishList: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([
    {
      id: '1',
      name: 'Premium Wireless Headphones',
      price: 299.99,
      originalPrice: 399.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
      rating: 4.8,
      category: 'Electronics'
    },
    {
      id: '2',
      name: 'Designer Leather Jacket',
      price: 450.00,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop',
      rating: 4.6,
      category: 'Fashion'
    },
    {
      id: '3',
      name: 'Smart Fitness Watch',
      price: 199.99,
      originalPrice: 249.99,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
      rating: 4.7,
      category: 'Wearables'
    },
    {
      id: '4',
      name: 'Minimalist Desk Lamp',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop',
      rating: 4.5,
      category: 'Home & Garden'
    }
  ]);

  const removeFromWishlist = (productId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  };

  const addToCart = (product: Product) => {
    // Simulate adding to cart
    console.log(`Added ${product.name} to cart`);
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
            {wishlistItems.length} items saved for later
          </p>
        </div>

        {/* Filters */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <p className="text-gray-500 text-xs sm:text-sm lg:text-base px-4">
            Manage your saved items and add them to cart when ready
          </p>
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 && (
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
                Save items you love and create your perfect collection. Your future self will thank you!
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
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-40 sm:h-48 lg:h-56 xl:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Overlay Actions - Only show on hover for larger screens */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 hidden sm:flex items-center justify-center">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="p-2 lg:p-3 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                      <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                    </button>
                    <button className="p-2 lg:p-3 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                      <Share2 className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Remove Button - Always visible on mobile, hover on desktop */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 p-1.5 sm:p-2 bg-white rounded-full shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 hover:scale-110 z-10"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                </button>

                {/* Discount Badge */}
                {item.originalPrice && (
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 lg:top-4 lg:left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium">
                    {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 lg:p-5 xl:p-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 sm:py-1 rounded-full truncate flex-shrink-0">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    <span className="text-xs sm:text-sm text-gray-600">{item.rating}</span>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2 leading-tight">
                  {item.name}
                </h3>

                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900">
                    ${item.price.toFixed(2)}
                  </span>
                  {item.originalPrice && (
                    <span className="text-xs sm:text-sm lg:text-base text-gray-500 line-through">
                      ${item.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => addToCart(item)}
                    className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 lg:py-3 px-2 sm:px-3 lg:px-4 rounded-lg lg:rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:scale-105 text-xs sm:text-sm lg:text-base"
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Add to Cart</span>
                  </button>
                  
                  {/* Mobile action buttons */}
                  <div className="flex gap-1 sm:hidden">
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
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
        {wishlistItems.length > 0 && (
          <div className="mt-6 sm:mt-8 lg:mt-12 text-center px-4">
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
              <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:scale-105 transition-transform duration-300 shadow-lg text-sm sm:text-base">
                Share Wishlist
              </button>
              <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-white text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors duration-300 border border-gray-200 text-sm sm:text-base">
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