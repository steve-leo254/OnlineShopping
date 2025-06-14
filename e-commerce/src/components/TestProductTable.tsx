import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, User, Calendar, ThumbsUp, ShoppingBag, Filter, Search, MoreHorizontal, Check } from 'lucide-react';

const EcommerceReviewsPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [likedReviews, setLikedReviews] = useState(new Set());
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const reviews = [
    {
      id: 1,
      name: "Sarah Mitchell",
      rating: 5,
      date: "3 days ago",
      verified: true,
      title: "Perfect quality, fast shipping!",
      content: "This product exceeded my expectations. The quality is outstanding and it arrived faster than promised. The packaging was beautiful too. Definitely ordering again!",
      productVariant: "Black, Size M",
      helpful: 24,
      images: 3
    },
    {
      id: 2,
      name: "David Rodriguez",
      rating: 4,
      date: "1 week ago", 
      verified: true,
      title: "Great value for money",
      content: "Really happy with this purchase. The product works exactly as described and the customer service was excellent when I had questions.",
      productVariant: "Blue, Large",
      helpful: 18,
      images: 1
    },
    {
      id: 3,
      name: "Emma Thompson",
      rating: 5,
      date: "2 weeks ago",
      verified: true,
      title: "Love it! Will buy again",
      content: "Amazing product! The design is sleek and modern. It fits perfectly and the material feels premium. Highly recommended to anyone considering this.",
      productVariant: "White, Small",
      helpful: 31,
      images: 2
    },
    {
      id: 4,
      name: "Michael Chang",
      rating: 4,
      date: "3 weeks ago",
      verified: true,
      title: "Good product, minor issues",
      content: "Overall satisfied with the purchase. The product quality is good but delivery took a bit longer than expected. Still worth buying though.",
      productVariant: "Gray, XL",
      helpful: 12,
      images: 0
    },
    {
      id: 5,
      name: "Lisa Parker",
      rating: 5,
      date: "1 month ago",
      verified: true,
      title: "Exceptional customer experience",
      content: "Not only is the product fantastic, but the entire shopping experience was seamless. From browsing to delivery, everything was perfect!",
      productVariant: "Pink, Medium",
      helpful: 28,
      images: 4
    },
    {
      id: 6,
      name: "James Wilson",
      rating: 3,
      date: "1 month ago",
      verified: false,
      title: "It's okay, nothing special",
      content: "The product is decent but I expected more based on the reviews. It does what it's supposed to do but doesn't feel particularly premium.",
      productVariant: "Green, Large",
      helpful: 8,
      images: 1
    }
  ];

  const productStats = {
    averageRating: 4.5,
    totalReviews: 1247,
    ratingDistribution: {
      5: 68,
      4: 22,
      3: 7,
      2: 2,
      1: 1
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Reviews', count: reviews.length },
    { value: '5', label: '5 Stars', count: reviews.filter(r => r.rating === 5).length },
    { value: '4', label: '4 Stars', count: reviews.filter(r => r.rating === 4).length },
    { value: 'verified', label: 'Verified Only', count: reviews.filter(r => r.verified).length },
    { value: 'photos', label: 'With Photos', count: reviews.filter(r => r.images > 0).length }
  ];

  const filteredReviews = reviews.filter(review => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'verified') return review.verified;
    if (selectedFilter === 'photos') return review.images > 0;
    if (selectedFilter === '5' || selectedFilter === '4') return review.rating === parseInt(selectedFilter);
    return true;
  }).filter(review => 
    review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleLike = (reviewId) => {
    const newLiked = new Set(likedReviews);
    if (newLiked.has(reviewId)) {
      newLiked.delete(reviewId);
    } else {
      newLiked.add(reviewId);
    }
    setLikedReviews(newLiked);
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors duration-200`}
      />
    ));
  };

  const formatRating = (rating) => {
    return rating % 1 === 0 ? rating.toString() : rating.toFixed(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Header */}
        <div className="container mx-auto px-6 pt-12 pb-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Customer Reviews
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              See what our customers are saying about their shopping experience
            </p>
          </div>

          {/* Product Rating Overview */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <span className="text-6xl font-bold text-white">{formatRating(productStats.averageRating)}</span>
                  <div>
                    <div className="flex gap-1 mb-2">
                      {renderStars(Math.floor(productStats.averageRating), 'w-6 h-6')}
                    </div>
                    <p className="text-gray-300">Based on {productStats.totalReviews.toLocaleString()} reviews</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-gray-300 w-8">{rating}★</span>
                    <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${productStats.ratingDistribution[rating]}%` }}
                      />
                    </div>
                    <span className="text-gray-300 text-sm w-12">{productStats.ratingDistribution[rating]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFilter(option.value)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                      selectedFilter === option.value 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                        : 'bg-white/20 text-gray-300 hover:bg-white/30 hover:scale-105'
                    }`}
                  >
                    {option.label}
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">{option.count}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/20 border border-white/30 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                >
                  <option className="bg-gray-800 text-white" value="recent">Most Recent</option>
                  <option className="bg-gray-800 text-white" value="helpful">Most Helpful</option>
                  <option className="bg-gray-800 text-white" value="highest">Highest Rated</option>
                  <option className="bg-gray-800 text-white" value="lowest">Lowest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="grid gap-6">
            {filteredReviews.map((review, index) => (
              <div 
                key={review.id}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/15 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-1/4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-semibold">{review.name}</h4>
                          {review.verified && (
                            <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                              <Check className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-400">Verified</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {review.date}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex gap-1 mb-2">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-gray-400 text-sm">{review.productVariant}</p>
                    </div>
                  </div>

                  <div className="lg:w-3/4">
                    <h3 className="text-xl font-bold text-white mb-3">{review.title}</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">{review.content}</p>
                    
                    {review.images > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex gap-2">
                          {[...Array(Math.min(review.images, 3))].map((_, i) => (
                            <div key={i} className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-gray-400">IMG</span>
                            </div>
                          ))}
                          {review.images > 3 && (
                            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-gray-300">+{review.images - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleLike(review.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                          likedReviews.has(review.id)
                            ? 'bg-blue-500/20 text-blue-400 scale-105'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${likedReviews.has(review.id) ? 'fill-current' : ''}`} />
                        <span>Helpful ({review.helpful + (likedReviews.has(review.id) ? 1 : 0)})</span>
                      </button>
                      
                      <button className="text-gray-400 hover:text-white transition-colors duration-300">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-12">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 transform">
              Load More Reviews
            </button>
          </div>

          {/* Write Review CTA */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-3xl p-8 mt-12 border border-white/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Share Your Experience</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Help other customers by sharing your honest review. Your feedback helps us improve and helps others make informed decisions.
            </p>
            <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-pink-500/25 transition-all duration-300 hover:scale-105 transform flex items-center gap-2 mx-auto">
              <Star className="w-5 h-5" />
              Write a Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcommerceReviewsPage;