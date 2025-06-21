import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, Star, ArrowRight, Heart, User, Truck, Shield, Headphones, RotateCcw } from 'lucide-react';

const ModernEcommerceHomepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistItems, setWishlistItems] = useState(new Set());

  const heroSlides = [
    {
      title: "Summer Collection 2025",
      subtitle: "Discover the latest trends",
      cta: "Shop Now",
      bg: "from-purple-600 via-pink-600 to-blue-600",
      image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop"
    },
    {
      title: "Premium Quality",
      subtitle: "Crafted for perfection",
      cta: "Explore",
      bg: "from-emerald-600 via-teal-600 to-cyan-600",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop"
    },
    {
      title: "Exclusive Deals",
      subtitle: "Up to 70% off",
      cta: "Save Now",
      bg: "from-orange-600 via-red-600 to-pink-600",
      image: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&h=600&fit=crop"
    }
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: 299,
      originalPrice: 399,
      rating: 4.8,
      reviews: 1250,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      tag: "Best Seller"
    },
    {
      id: 2,
      name: "Smart Watch Pro",
      price: 199,
      originalPrice: 299,
      rating: 4.9,
      reviews: 892,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      tag: "New"
    },
    {
      id: 3,
      name: "Designer Sunglasses",
      price: 149,
      originalPrice: 199,
      rating: 4.7,
      reviews: 634,
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
      tag: "Trending"
    },
    {
      id: 4,
      name: "Leather Backpack",
      price: 129,
      originalPrice: 179,
      rating: 4.6,
      reviews: 445,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      tag: "Limited"
    },
    {
      id: 5,
      name: "Wireless Earbuds Pro",
      price: 179,
      originalPrice: 229,
      rating: 4.9,
      reviews: 1456,
      image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop",
      tag: "Top Rated"
    },
    {
      id: 6,
      name: "Gaming Mechanical Keyboard",
      price: 159,
      originalPrice: 199,
      rating: 4.8,
      reviews: 789,
      image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop",
      tag: "Popular"
    },
    {
      id: 7,
      name: "Ultra HD Webcam",
      price: 89,
      originalPrice: 129,
      rating: 4.7,
      reviews: 523,
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop",
      tag: "Bestseller"
    },
    {
      id: 8,
      name: "Portable Power Bank",
      price: 49,
      originalPrice: 69,
      rating: 4.6,
      reviews: 1123,
      image: "https://images.unsplash.com/photo-1609592827849-3c06c4682003?w=400&h=400&fit=crop",
      tag: "Value"
    }
  ];

  const categories = [
    { name: "Electronics", icon: "📱", color: "bg-blue-500" },
    { name: "Fashion", icon: "👗", color: "bg-pink-500" },
    { name: "Home & Garden", icon: "🏠", color: "bg-green-500" },
    { name: "Sports", icon: "⚽", color: "bg-orange-500" },
    { name: "Books", icon: "📚", color: "bg-purple-500" },
    { name: "Beauty", icon: "💄", color: "bg-red-500" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (productId) => {
    setCartCount(prev => prev + 1);
  };

  const toggleWishlist = (productId) => {
    setWishlistItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-lg shadow-sm z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                LUXE
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {['Home', 'Shop', 'Categories', 'Deals', 'About'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User className="w-6 h-6 text-gray-700" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Heart className="w-6 h-6 text-gray-700" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-2 space-y-2">
              {['Home', 'Shop', 'Categories', 'Deals', 'About'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="block py-2 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${heroSlides[currentSlide].bg} opacity-90`} />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {heroSlides[currentSlide].title}
          </h1>
          <p className="text-lg md:text-xl mb-6 opacity-90">
            {heroSlides[currentSlide].subtitle}
          </p>
          <button className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold text-base hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-xl">
            {heroSlides[currentSlide].cta}
            <ArrowRight className="inline-block ml-2 w-4 h-4" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 bg-white mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: "Free Shipping", desc: "On orders over $100" },
              { icon: Shield, title: "Secure Payment", desc: "100% secure transactions" },
              { icon: Headphones, title: "24/7 Support", desc: "Expert customer service" },
              { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" }
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <feature.icon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="group cursor-pointer"
              >
                <div className={`${category.color} rounded-2xl p-8 text-center hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}>
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-white font-semibold">{category.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of premium products
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Products Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden group"
                  >
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {product.tag}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="absolute top-4 right-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            wishlistItems.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">({product.rating}) • {product.reviews} reviews</span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-purple-600">${product.price}</span>
                          <span className="text-gray-500 line-through">${product.originalPrice}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(product.id)}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition-colors font-semibold"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Rated Sidebar */}
            <div className="lg:w-80">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-lg mr-3">
                    <Star className="w-6 h-6 text-white fill-current" />
                  </div>
                  <h3 className="text-xl font-bold">Top Rated</h3>
                </div>

                <div className="space-y-4">
                  {featuredProducts
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 5)
                    .map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <div className="relative">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-600 ml-1">
                              {product.rating} ({product.reviews})
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="text-lg font-bold text-purple-600">${product.price}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-xs text-gray-500 line-through ml-2">
                                ${product.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => addToCart(product.id)}
                          className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>

                <button className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105">
                  View All Top Rated
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-purple-100 mb-8">Get the latest deals and product updates delivered to your inbox</p>
          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                LUXE
              </h3>
              <p className="text-gray-400 mb-4">
                Your premier destination for premium products and exceptional shopping experience.
              </p>
            </div>
            
            {[
              {
                title: "Quick Links",
                links: ["Home", "Shop", "About", "Contact", "FAQ"]
              },
              {
                title: "Categories",
                links: ["Electronics", "Fashion", "Home", "Sports", "Beauty"]
              },
              {
                title: "Customer Service",
                links: ["Shipping Info", "Returns", "Size Guide", "Support", "Track Order"]
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 LUXE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModernEcommerceHomepage;