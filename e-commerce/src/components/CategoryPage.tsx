import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, ShoppingCart, Star, Grid, List, ChevronDown, Eye, Zap, Smartphone, Laptop, Headphones, Monitor, HardDrive, Cpu, Wifi, Mouse, Keyboard, Gamepad2, Camera, Tablet, Speaker, Battery } from 'lucide-react';

const CategoryProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('Laptops');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState('all');
  const [favorites, setFavorites] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Electronics-specific category configurations
  const categoryConfig = {
    Laptops: {
      title: 'Laptops & Notebooks',
      subtitle: 'Powerful computing for work and play',
      description: 'From ultrabooks to gaming powerhouses, find the perfect laptop for your needs. Premium processors, stunning displays, and all-day battery life.',
      gradient: 'from-blue-600 via-indigo-600 to-purple-800',
      bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
      icon: Laptop,
      banner: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=400&fit=crop',
      features: ['Intel/AMD Processors', 'SSD Storage', 'Full HD+ Displays', '2-Year Warranty'],
      categories: [
        { name: 'Gaming Laptops', icon: Gamepad2, count: 12 },
        { name: 'Business Laptops', icon: Laptop, count: 18 },
        { name: 'Ultrabooks', icon: Laptop, count: 15 },
        { name: 'Workstations', icon: Cpu, count: 8 }
      ]
    },
    Smartphones: {
      title: 'Smartphones & Mobile',
      subtitle: 'Stay connected with cutting-edge mobile technology',
      description: 'Latest smartphones with advanced cameras, lightning-fast processors, and innovative features. Android and iOS options available.',
      gradient: 'from-green-500 via-emerald-500 to-teal-600',
      bgGradient: 'from-green-50 via-emerald-50 to-teal-50',
      icon: Smartphone,
      banner: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=400&fit=crop',
      features: ['5G Connectivity', 'Pro Cameras', 'Fast Charging', 'Premium Materials'],
      categories: [
        { name: 'Android Phones', icon: Smartphone, count: 25 },
        { name: 'iPhones', icon: Smartphone, count: 12 },
        { name: 'Budget Phones', icon: Smartphone, count: 20 },
        { name: 'Accessories', icon: Battery, count: 35 }
      ]
    },
    'PC Components': {
      title: 'PC Components & Hardware',
      subtitle: 'Build your dream computer',
      description: 'High-performance components for custom PC builds. CPUs, GPUs, motherboards, and more from top manufacturers.',
      gradient: 'from-red-500 via-orange-500 to-yellow-600',
      bgGradient: 'from-red-50 via-orange-50 to-yellow-50',
      icon: Cpu,
      banner: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=1200&h=400&fit=crop',
      features: ['Latest Chipsets', 'RGB Lighting', 'Overclocking Support', 'Expert Assembly'],
      categories: [
        { name: 'Processors', icon: Cpu, count: 16 },
        { name: 'Graphics Cards', icon: Monitor, count: 14 },
        { name: 'Memory & Storage', icon: HardDrive, count: 22 },
        { name: 'Motherboards', icon: Cpu, count: 18 }
      ]
    },
    Accessories: {
      title: 'Electronics Accessories',
      subtitle: 'Complete your tech setup',
      description: 'Essential accessories to enhance your electronics experience. From audio gear to input devices and connectivity solutions.',
      gradient: 'from-purple-500 via-pink-500 to-rose-600',
      bgGradient: 'from-purple-50 via-pink-50 to-rose-50',
      icon: Headphones,
      banner: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&h=400&fit=crop',
      features: ['Premium Audio', 'Wireless Technology', 'Ergonomic Design', 'Multi-Device Support'],
      categories: [
        { name: 'Audio & Headphones', icon: Headphones, count: 28 },
        { name: 'Keyboards & Mice', icon: Keyboard, count: 24 },
        { name: 'Monitors & Displays', icon: Monitor, count: 16 },
        { name: 'Networking', icon: Wifi, count: 12 }
      ]
    }
  };

  // Electronics-specific product data
  const allProducts = {
    Laptops: [
      { id: 1, name: 'MacBook Pro 16" M3 Max', price: 3199, rating: 4.9, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', category: 'Laptops', badge: 'Pro', subcategory: 'Workstations', specs: '32GB RAM, 1TB SSD, M3 Max' },
      { id: 2, name: 'Dell XPS 13 Plus', price: 1299, rating: 4.7, image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400', category: 'Laptops', badge: 'Ultrabook', subcategory: 'Business Laptops', specs: '16GB RAM, 512GB SSD, Intel i7' },
      { id: 3, name: 'ASUS ROG Strix G15', price: 1799, rating: 4.8, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400', category: 'Laptops', badge: 'Gaming', subcategory: 'Gaming Laptops', specs: 'RTX 4070, 16GB RAM, 1TB SSD' },
      { id: 4, name: 'ThinkPad X1 Carbon', price: 1599, rating: 4.6, image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400', category: 'Laptops', badge: 'Business', subcategory: 'Business Laptops', specs: '16GB RAM, 512GB SSD, Intel i7' },
      { id: 5, name: 'HP Spectre x360', price: 1399, rating: 4.5, image: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400', category: 'Laptops', badge: '2-in-1', subcategory: 'Ultrabooks', specs: '16GB RAM, 1TB SSD, Touch Screen' },
      { id: 6, name: 'MSI Creator Z16', price: 2299, rating: 4.7, image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400', category: 'Laptops', badge: 'Creator', subcategory: 'Workstations', specs: 'RTX 4060, 32GB RAM, 1TB SSD' }
    ],
    Smartphones: [
      { id: 7, name: 'iPhone 15 Pro Max', price: 1199, rating: 4.9, image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', category: 'Smartphones', badge: 'Latest', subcategory: 'iPhones', specs: '256GB, Pro Camera System, A17 Pro' },
      { id: 8, name: 'Samsung Galaxy S24 Ultra', price: 1299, rating: 4.8, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', category: 'Smartphones', badge: 'S Pen', subcategory: 'Android Phones', specs: '512GB, 200MP Camera, S Pen' },
      { id: 9, name: 'Google Pixel 8 Pro', price: 999, rating: 4.7, image: 'https://images.unsplash.com/photo-1601784551446-20c59e2b6084?w=400', category: 'Smartphones', badge: 'AI Camera', subcategory: 'Android Phones', specs: '256GB, Magic Eraser, Titan G3' },
      { id: 10, name: 'OnePlus 12', price: 799, rating: 4.6, image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400', category: 'Smartphones', badge: 'Fast Charge', subcategory: 'Android Phones', specs: '256GB, 100W Charging, Snapdragon 8' }
    ],
    'PC Components': [
      { id: 11, name: 'Intel Core i9-14900K', price: 589, rating: 4.8, image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400', category: 'PC Components', badge: 'Latest', subcategory: 'Processors', specs: '24 Cores, 5.8GHz Max, LGA1700' },
      { id: 12, name: 'RTX 4080 Super', price: 999, rating: 4.9, image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400', category: 'PC Components', badge: 'Gaming', subcategory: 'Graphics Cards', specs: '16GB GDDR6X, Ray Tracing, DLSS 3' },
      { id: 13, name: 'Corsair Vengeance DDR5', price: 179, rating: 4.7, image: 'https://images.unsplash.com/photo-1562976540-743f2c0143c4?w=400', category: 'PC Components', badge: 'High Speed', subcategory: 'Memory & Storage', specs: '32GB Kit, 5600MHz, RGB' },
      { id: 14, name: 'ASUS ROG Strix B650', price: 299, rating: 4.6, image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400', category: 'PC Components', badge: 'AMD Ready', subcategory: 'Motherboards', specs: 'AM5 Socket, WiFi 6E, PCIe 5.0' }
    ],
    Accessories: [
      { id: 15, name: 'Sony WH-1000XM5', price: 399, rating: 4.9, image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', category: 'Accessories', badge: 'Premium', subcategory: 'Audio & Headphones', specs: 'Noise Cancelling, 30hr Battery' },
      { id: 16, name: 'Logitech MX Master 3S', price: 99, rating: 4.8, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', category: 'Accessories', badge: 'Productivity', subcategory: 'Keyboards & Mice', specs: 'Wireless, Multi-Device, Precision' },
      { id: 17, name: 'Dell UltraSharp 4K Monitor', price: 599, rating: 4.7, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400', category: 'Accessories', badge: '4K Display', subcategory: 'Monitors & Displays', specs: '27", 4K UHD, USB-C Hub' },
      { id: 18, name: 'ASUS AX6000 Router', price: 299, rating: 4.5, image: 'https://images.unsplash.com/photo-1606904825846-647eb8a37b66?w=400', category: 'Accessories', badge: 'WiFi 6', subcategory: 'Networking', specs: 'WiFi 6, Mesh Ready, Gaming Mode' }
    ]
  };

  const categories = Object.keys(allProducts);
  const products = allProducts[selectedCategory] || [];
  const config = categoryConfig[selectedCategory];

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.specs.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = priceRange === 'all' || 
      (priceRange === 'under-500' && product.price < 500) ||
      (priceRange === '500-1000' && product.price >= 500 && product.price <= 1000) ||
      (priceRange === '1000-2000' && product.price >= 1000 && product.price <= 2000) ||
      (priceRange === 'over-2000' && product.price > 2000);
    return matchesSearch && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const toggleFavorite = (productId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const handleViewProduct = (productId) => {
    console.log(`Navigating to product details for product ID: ${productId}`);
    alert(`Would navigate to product details page for product ID: ${productId}`);
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
          <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );

  const IconComponent = config.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient}`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TechHub Electronics
              </h1>
              <nav className="hidden md:flex space-x-6">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Heart size={20} />
              </button>
              <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors relative">
                <ShoppingCart size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Hero Banner */}
      <div className="relative overflow-hidden">
        <div 
          className="h-80 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${config.banner})` }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
          <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-75`}></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <IconComponent size={32} />
                </div>
                <h1 className="text-5xl font-bold">{config.title}</h1>
              </div>
              <p className="text-xl mb-6 text-white/90">{config.subtitle}</p>
              <p className="text-lg mb-8 text-white/80">{config.description}</p>
              <div className="flex flex-wrap gap-4">
                {config.features.map((feature, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
                  >
                    ✓ {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {config.categories.map((cat, index) => {
            const CatIcon = cat.icon;
            return (
              <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${config.gradient} text-white mb-2`}>
                  <CatIcon size={24} />
                </div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-600">{cat.count} items</p>
              </div>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={`Search ${selectedCategory.toLowerCase()}...`}
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
                <option value="under-500">Under $500</option>
                <option value="500-1000">$500 - $1,000</option>
                <option value="1000-2000">$1,000 - $2,000</option>
                <option value="over-2000">Over $2,000</option>
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
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {config.title} Collection
            </h2>
            <p className="text-gray-600">{sortedProducts.length} products available</p>
          </div>
          <div className="text-sm text-gray-500">
            Showing results for "{selectedCategory}"
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className={`grid gap-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {sortedProducts.map((product, index) => (
              <div
                key={product.id}
                className="group bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 hover:-translate-y-2"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className="relative overflow-hidden group/image">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Product Badge */}
                  {product.badge && (
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${config.gradient} text-white`}>
                      {product.badge}
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <button
                      onClick={() => handleViewProduct(product.id)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg"
                      title="View Details"
                    >
                      <Eye
                        size={20}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      />
                    </button>
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg"
                      title="Add to Favorites"
                    >
                      <Heart
                        size={20}
                        className={`transition-colors ${
                          favorites.has(product.id) ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
                    <button
                      onClick={() => handleViewProduct(product.id)}
                      className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto"
                    >
                      Quick View
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 font-medium">{product.subcategory}</span>
                    {product.badge && (
                      <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${config.gradient} text-white font-medium`}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3">{product.specs}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${
                            i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({product.rating})</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      ${product.price.toLocaleString()}
                    </span>
                    <button className={`px-6 py-2 bg-gradient-to-r ${config.gradient} text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300`}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedProducts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryProductsPage;