import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Assuming you have this
import { Star, Package, CheckCircle, ShoppingBag, ArrowLeft, Sparkles, Gift } from 'lucide-react';

// Type definitions
interface User {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  order_id: number;
}

interface ReviewData {
  rating: number;
  comment: string;
}

interface Review extends ReviewData {
  userId: number;
  productId: number;
  date: string;
}

interface ReviewCardProps {
  product: Product;
  onSubmit: (reviewData: ReviewData) => void;
  isSubmitting: boolean;
}

const PendingReviews: React.FC = () => {
  const { token } = useAuth();
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [submittingReview, setSubmittingReview] = useState<number | null>(null);

  // Mock current user - replace with actual user context/props
  const currentUser: User = { id: 1, name: 'John Doe' };

  // Fetch delivered orders and their products
  useEffect(() => {
    const fetchPendingReviews = async () => {
      if (!token) return;
      try {
        // 1. Fetch delivered orders
        const ordersRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/orders?status=delivered`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const orders = ordersRes.data.items || [];

        // 2. For each order, get products
        let products: Product[] = [];
        for (const order of orders) {
          for (const detail of order.order_details) {
            products.push({
              id: detail.product_id,
              name: detail.product?.name,
              image: detail.product?.images?.[0]?.img_url
                ? import.meta.env.VITE_API_BASE_URL + detail.product.images[0].img_url
                : 'https://via.placeholder.com/150',
              price: detail.product?.price,
              order_id: order.order_id,
            });
          }
        }

        // 3. Fetch user's reviews
        const reviewsRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/favorites`, // Replace with your reviews endpoint
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userReviews = reviewsRes.data || [];

        // 4. Filter out products already reviewed
        const reviewedProductIds = new Set(userReviews.map((r: any) => r.product_id));
        const pending = products.filter((p) => !reviewedProductIds.has(p.id));
        setPendingProducts(pending);
      } catch (err) {
        setPendingProducts([]);
      }
    };
    fetchPendingReviews();
  }, [token]);

  // Submit review
  const submitReview = async (productId: number, orderId: number, reviewData: ReviewData) => {
    setSubmittingReview(productId);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/reviews`,
        {
          product_id: productId,
          order_id: orderId,
          rating: reviewData.rating,
          comment: reviewData.comment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      // handle error
    } finally {
      setSubmittingReview(null);
    }
  };

  // Individual review component
  const ReviewCard: React.FC<ReviewCardProps> = ({ product, onSubmit, isSubmitting }) => {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');

    const handleSubmit = (): void => {
      if (rating === 0) {
        alert('Please select a rating');
        return;
      }
      
      onSubmit({
        rating,
        comment,
      });
    };

    const getRatingText = (rating: number): string => {
      switch(rating) {
        case 5: return "Amazing! 🌟";
        case 4: return "Great! 👍";
        case 3: return "Good 👌";
        case 2: return "Could be better 🤔";
        case 1: return "Needs improvement 💭";
        default: return "";
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
        <div className="flex items-start gap-4">
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm ring-1 ring-gray-200">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Product Info */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                {product.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">${product.price}</span>
              </div>
            </div>
            
            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Sparkles size={14} className="text-yellow-500" />
                Rate your experience
              </label>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-all duration-200 hover:scale-110"
                  >
                    <Star
                      size={20}
                      className={`${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-200'
                      } transition-colors duration-200`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-gray-600">
                  {getRatingText(rating)}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your thoughts (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors duration-200 text-sm"
                rows={2}
                maxLength={500}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {comment.length}/500
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 font-medium text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main review page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-2.5">
                <Package className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Product Reviews</h1>
                <p className="text-gray-600 text-sm">
                  Welcome back, <span className="font-medium text-blue-600">{currentUser.name}</span> ✨
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm">
              <ArrowLeft size={16} />
              Back to Orders
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {pendingProducts.length > 0 ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg mb-3">
                <Gift size={14} />
                {pendingProducts.length} Reviews Pending
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Share Your Experience
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Your honest feedback helps other customers make informed decisions
              </p>
            </div>

            <div className="space-y-4">
              {pendingProducts.map((product) => (
                <ReviewCard 
                  key={product.id}
                  product={product} 
                  onSubmit={(reviewData) => submitReview(product.id, product.order_id, reviewData)}
                  isSubmitting={submittingReview === product.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="relative mb-6">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center shadow-xl">
                <CheckCircle className="text-white" size={32} />
              </div>
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                ✨
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              All Caught Up!
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              You've reviewed all your recent purchases. Your feedback is invaluable!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium">
                <Package size={18} />
                View My Orders
              </button>
              <button className="bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 border border-gray-200 flex items-center justify-center gap-2 font-medium">
                <ShoppingBag size={18} />
                Continue Shopping
              </button>
            </div>
            <div className="max-w-md mx-auto p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-base">💡</span>
                <span>
                  <strong>Thank you!</strong> Your reviews help thousands of customers make better decisions.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingReviews;