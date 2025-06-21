import React, { useState, useEffect, useRef } from "react";
import { useFetchProducts } from "./UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import {
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  MessageCircle,
  X,
  Send,
  Bot,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUserStats } from "../context/UserStatsContext";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

// Define Message interface for type safety
interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

// Chatbot Component
const ServiceChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm Makena, your assistant for today. How can I help you?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the same products data from the Home component
  const {
    products,
    isLoading: productsLoading,
    fetchProducts,
  } = useFetchProducts();
  const { token, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fetch products and categories when chatbot opens
  useEffect(() => {
    if (isOpen) {
      // Fetch products from database (similar to Store component)
      fetchProducts(1, 100, ""); // Fetch first 100 products
      fetchCategories();
      if (isAuthenticated && token) {
        fetchUserData();
      }
    }
  }, [isOpen, fetchProducts, isAuthenticated, token]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/public/categories`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const categoriesData = await response.json();
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error fetching categories for chatbot:", error);
    }
  };

  const fetchUserData = async () => {
    if (!token) return;

    try {
      const [userRes, ordersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/orders?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserData(userData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setUserOrders(ordersData.items || []);
      }

      // Get wishlist count from favorites context
      setWishlistCount(favorites.size);

      // Calculate pending reviews count
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const deliveredOrders =
          ordersData.items?.filter(
            (order: any) => order.status === "delivered"
          ) || [];
        let reviewCount = 0;

        deliveredOrders.forEach((order: any) => {
          if (order.order_details) {
            order.order_details.forEach((detail: any) => {
              const product = detail.product;
              const alreadyReviewed = (product.reviews || []).some(
                (rev: any) =>
                  rev.user_id === userData?.id &&
                  rev.order_id === order.order_id
              );
              if (!alreadyReviewed) {
                reviewCount++;
              }
            });
          }
        });
        setPendingReviewsCount(reviewCount);
      }
    } catch (error) {
      console.error("Error fetching user data for chatbot:", error);
    }
  };

  const predefinedResponses: Record<string, string> = {
    hello:
      isAuthenticated && userData
        ? `Hello! ${
            userData.username || userData.name || "Valued Customer"
          } Welcome to Flowtech store. How can I assist you today?`
        : "Hello! Welcome to Flowtech store. How can I assist you today?",
    hi: "Hi there! I'm here to help you with any questions about our products or services.",
    help: "I can help you with:\n• Product information and recommendations\n• Order status\n• Shipping details\n• Returns and exchanges\n• Technical support\n\nWhat would you like to know?",
    products:
      "We offer a wide range of premium products including gaming equipment, professional workspace tools, and the latest technology. You can browse our full catalog by clicking 'View All Products' or visit our store page.",
    shipping:
      "We offer fast and secure shipping options:\n• Standard shipping: 3-5 business days\n• Express shipping: 1-2 business days\n• Delivery to your doorstep\n\nAll orders are tracked and insured.",
    returns:
      "We have a 7-day return policy. Items must be in original condition. Contact our support team to initiate a return. We'll provide a prepaid return label for your convenience.",
    payment:
      "We accept all major credit cards, PayPal, and Apple Pay. All transactions are secured with SSL encryption for your protection.",
    support:
      "For additional support, you can:\n• Email us at Flowtech254@example.com\n• Call us at 07505-150-206 SUPPORT\n• Visit our FAQ section\n• Use this chat for immediate assistance",
    hours:
      "Our customer service hours are:\n• Monday-Friday: 9 AM - 8 PM EST\n• Saturday: 10 AM - 6 PM EST\n• Sunday: 12 PM - 5 PM EST\n\nThis chat is available 24/7!",
    default:
      "I'm not sure I understood that. I can help with product info, shipping, returns, and more. What would you like to know?",
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    if (productsLoading) {
      return "I'm still loading our product information. Please wait a moment and try again.";
    }

    if (!products || products.length === 0) {
      return "I'm having trouble accessing our product database right now. Please try again later or contact our support team.";
    }

    // User-specific queries (only if authenticated)
    if (isAuthenticated) {
      if (
        message.includes("wishlist") ||
        message.includes("favorites") ||
        message.includes("saved")
      ) {
        if (wishlistCount === 0) {
          return "Your wishlist is empty. You can save products you like by clicking the heart icon on any product page.";
        }
        return `You have ${wishlistCount} item${
          wishlistCount === 1 ? "" : "s"
        } in your wishlist.`;
      }

      if (
        message.includes("review") ||
        message.includes("rating") ||
        message.includes("feedback")
      ) {
        if (pendingReviewsCount === 0) {
          return "Great news! You're all caught up with your reviews.";
        }
        return `You have ${pendingReviewsCount} pending review${
          pendingReviewsCount === 1 ? "" : "s"
        } to complete.`;
      }

      if (
        message.includes("profile") ||
        message.includes("account") ||
        message.includes("my info")
      ) {
        if (!userData) {
          return "I'm having trouble accessing your profile information. Please try refreshing the page.";
        }
        return `Welcome back, ${
          userData.username || userData.name || "valued customer"
        }! You can manage your profile in your account dashboard.`;
      }

      if (
        message.includes("order") ||
        message.includes("purchase") ||
        message.includes("buy")
      ) {
        if (userOrders.length === 0) {
          return "You haven't placed any orders yet. Start shopping to see your order history here!";
        }
        return `You have ${userOrders.length} order${
          userOrders.length === 1 ? "" : "s"
        } in total. You can view them in your profile.`;
      }
    } else {
      // If not authenticated, suggest login for user-specific features
      if (
        message.includes("wishlist") ||
        message.includes("favorites") ||
        message.includes("profile") ||
        message.includes("order")
      ) {
        return "To access your personal information like wishlist, profile, and orders, please log in to your account first.";
      }
    }

    // Handle general product queries
    if (message.includes("products") || message.includes("items")) {
      const totalProducts = products.length;
      const categories = [
        ...new Set(products.map((p) => p.category?.name).filter(Boolean)),
      ];
      return `We currently have ${totalProducts} products in our store across ${categories.length} categories. You can browse our full catalog by visiting the store page.`;
    }

    if (message.includes("hello") || message.includes("hi"))
      return predefinedResponses.hello;
    if (message.includes("help") || message.includes("assistance"))
      return predefinedResponses.help;
    if (
      message.includes("ship") ||
      message.includes("deliver") ||
      message.includes("tracking")
    )
      return predefinedResponses.shipping;
    if (
      message.includes("return") ||
      message.includes("refund") ||
      message.includes("exchange")
    )
      return predefinedResponses.returns;
    if (
      message.includes("payment") ||
      message.includes("pay") ||
      message.includes("credit card")
    )
      return predefinedResponses.payment;
    if (message.includes("support") || message.includes("contact"))
      return predefinedResponses.support;
    if (
      message.includes("hours") ||
      message.includes("time") ||
      message.includes("available")
    )
      return predefinedResponses.hours;

    return predefinedResponses.default;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "What products do you have?",
    "What's your return policy?",
    "Help me with shipping",
    ...(isAuthenticated
      ? [
          "How many items in my wishlist?",
          "Do I have pending reviews?",
          "Show my recent orders",
        ]
      : ["Recommend some products"]),
  ];

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 ${
          isOpen ? "rotate-180" : ""
        }`}
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face&auto=format&q=60"
                alt="Makena"
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
              <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center text-white text-sm font-semibold hidden">
                M
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Makena - Customer Support</h3>
              <p className="text-sm text-white/80">We're here to help!</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === "bot" && (
                      <div className="flex-shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=24&h=24&fit=crop&crop=face&auto=format&q=60"
                          alt="Makena"
                          className="w-4 h-4 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                        <div className="w-4 h-4 bg-pink-400 rounded-full flex items-center justify-center text-white text-xs font-semibold hidden">
                          M
                        </div>
                      </div>
                    )}
                    {message.sender === "user" && (
                      <User className="w-4 h-4 mt-1 flex-shrink-0 text-white/80" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line">
                        {message.text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "user"
                            ? "text-white/70"
                            : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-2xl max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=24&h=24&fit=crop&crop=face&auto=format&q=60"
                        alt="Makena"
                        className="w-4 h-4 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                      <div className="w-4 h-4 bg-pink-400 rounded-full flex items-center justify-center text-white text-xs font-semibold hidden">
                        M
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full p-2 transition-all duration-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceChatbot;
