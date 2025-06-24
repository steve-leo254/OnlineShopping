import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  Package,
  CheckCircle,
  ShoppingBag,
  Sparkles,
  Gift,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useUserStats } from "../context/UserStatsContext";
import { formatCurrency } from "../cart/formatCurrency";
import { useNavigate } from "react-router-dom";

// Type definitions
interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  reviewed: boolean;
  orderId?: number;
}

interface ReviewData {
  rating: number;
  comment: string;
  productName: string;
}

interface ReviewCardProps {
  product: Product;
  onSubmit: (
    productId: number,
    orderId: number,
    reviewData: ReviewData
  ) => void;
  onSkip: (productId: number, orderId: number) => void;
  isSubmitting: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  product,
  onSubmit,
  onSkip,
  isSubmitting,
}) => {
  const [rating, setRating] = React.useState<number>(0);
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState<string>("");

  const handleSubmit = (): void => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    onSubmit(product.id, product.orderId!, {
      rating,
      comment,
      productName: product.name,
    });
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 5:
        return "Amazing! 🌟";
      case 4:
        return "Great! 👍";
      case 3:
        return "Good 👌";
      case 2:
        return "Could be better 🤔";
      case 1:
        return "Needs improvement 💭";
      default:
        return "";
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
          <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {product.orderId}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {/* Product Info */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(product.price)}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Recent Purchase
              </span>
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
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
                    } transition-colors duration-200`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-gray-600">{getRatingText(rating)}</p>
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
            <button
              onClick={() => onSkip(product.id, product.orderId!)}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const currentUser = useMemo(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return { id: decoded.id, name: decoded.sub };
      } catch {}
    }
    return null;
  }, [token]);
  const [pendingReviews, setPendingReviews] = useState<Product[]>([]);
  const [submittingReview, setSubmittingReview] = useState<{
    id: number;
    orderId: number;
  } | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { refreshStats } = useUserStats();

  useEffect(() => {
    const fetchPendingReviews = async () => {
      if (!token || !currentUser) return;
      try {
        // Fetch all delivered orders
        const orderRes = await axios.get(`${API_BASE_URL}/orders`, {
          params: { limit: 100, status: "delivered" },
          headers: { Authorization: `Bearer ${token}` },
        });
        const deliveredOrders = orderRes.data.items || [];
        // For each product in each order, check if the user has reviewed it for that order
        const productsToReview: Product[] = [];
        deliveredOrders.forEach((order: any) => {
          if (!order.order_details) return;
          order.order_details.forEach((detail: any) => {
            const product = detail.product;
            // Check if user has reviewed this product in this order
            const alreadyReviewed = (product.reviews || []).some(
              (rev: any) =>
                rev.user_id === currentUser!.id &&
                rev.order_id === order.order_id
            );
            if (!alreadyReviewed) {
              productsToReview.push({
                id: product.id,
                name: product.name,
                image:
                  product.images && product.images.length > 0
                    ? product.images[0].img_url.startsWith("http")
                      ? product.images[0].img_url
                      : `${API_BASE_URL}${product.images[0].img_url}`
                    : "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop",
                price: product.price,
                reviewed: false,
                orderId: order.order_id, // Track which order this product is from
              });
            }
          });
        });
        setPendingReviews(productsToReview);
      } catch (err) {
        setPendingReviews([]);
      }
    };
    fetchPendingReviews();
  }, [token, API_BASE_URL]);

  // Handle review submission
  const submitReview = async (
    productId: number,
    orderId: number,
    reviewData: ReviewData
  ): Promise<void> => {
    setSubmittingReview({ id: productId, orderId });
    if (!token || !currentUser) return;
    try {
      // Find the product in pendingReviews to get its orderId
      const productToReview = pendingReviews.find(
        (p) => p.id === productId && p.orderId === orderId
      );
      if (!productToReview || !productToReview.orderId)
        throw new Error("Order ID not found for product");
      // POST review
      await axios.post(
        `${API_BASE_URL}/reviews`,
        {
          user_id: currentUser.id,
          product_id: productId,
          order_id: productToReview.orderId,
          rating: reviewData.rating,
          comment: reviewData.comment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Remove product from pending reviews
      setPendingReviews((prev) =>
        prev.filter(
          (product) =>
            product.id !== productId ||
            product.orderId !== productToReview.orderId
        )
      );
      refreshStats(); // Update navbar counts
    } catch (err) {
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(null);
    }
  };

  // Handle skipping individual review
  const skipReview = (productId: number, orderId: number): void => {
    setPendingReviews((prev) =>
      prev.filter(
        (product) => product.id !== productId || product.orderId !== orderId
      )
    );
  };

  // Main review page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {pendingReviews.length > 0 ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg mb-3">
                <Gift size={14} />
                {pendingReviews.length} Reviews Pending
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Share Your Experience
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Your honest feedback helps other customers make informed
                decisions
              </p>
            </div>

            <div className="space-y-4">
              {pendingReviews.map((product) => (
                <ReviewCard
                  key={`${product.id}-${product.orderId}`}
                  product={product}
                  onSubmit={submitReview}
                  onSkip={skipReview}
                  isSubmitting={
                    submittingReview?.id === product.id &&
                    submittingReview?.orderId === product.orderId
                  }
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
              You've reviewed all your recent purchases. Your feedback is
              invaluable!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={() => navigate("/orders-overview")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
              >
                <Package size={18} />
                View My Orders
              </button>
              <button
                onClick={() => navigate("/shop")}
                className="bg-white text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 border border-gray-200 flex items-center justify-center gap-2 font-medium"
              >
                <ShoppingBag size={18} />
                Continue Shopping
              </button>
            </div>
            <div className="max-w-md mx-auto p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-base">💡</span>
                <span>
                  <strong>Thank you!</strong> Your reviews help thousands of
                  customers make better decisions.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
