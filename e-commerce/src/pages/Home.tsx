import React, { useState, useEffect, useRef } from "react";
import { useFetchProducts } from "../components/UseFetchProducts";
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
  const { products, isLoading: productsLoading, fetchProducts } = useFetchProducts();
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/public/categories`);
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
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/orders?limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        })
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
        const deliveredOrders = ordersData.items?.filter((order: any) => order.status === "delivered") || [];
        let reviewCount = 0;
        
        deliveredOrders.forEach((order: any) => {
          if (order.order_details) {
            order.order_details.forEach((detail: any) => {
              const product = detail.product;
              const alreadyReviewed = (product.reviews || []).some(
                (rev: any) => rev.user_id === userData?.id && rev.order_id === order.order_id
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
    hello: isAuthenticated && userData 
      ? `Hello! ${userData.username || userData.name || 'Valued Customer'} Welcome to Flowtech store. How can I assist you today?`
      : "Hello! Welcome to Flowtech store. How can I assist you today?",
    hi: "Hi there! I'm here to help you with any questions about our products or services.",
    help: "I can help you with:\n• Product information and recommendations\n• Order status\n• Shipping details\n• Returns and exchanges\n• Technical support\n\nWhat would you like to know?",
    products: "We offer a wide range of premium products including gaming equipment, professional workspace tools, and the latest technology. You can browse our full catalog by clicking 'View All Products' or visit our store page.",
    shipping: "We offer fast and secure shipping options:\n• Standard shipping: 3-5 business days\n• Express shipping: 1-2 business days\n• Delivery to your doorstep\n\nAll orders are tracked and insured.",
    returns: "We have a 7-day return policy. Items must be in original condition. Contact our support team to initiate a return. We'll provide a prepaid return label for your convenience.",
    payment: "We accept all major credit cards, PayPal, and Apple Pay. All transactions are secured with SSL encryption for your protection.",
    support: "For additional support, you can:\n• Email us at Flowtech254@example.com\n• Call us at 07505-150-206 SUPPORT\n• Visit our FAQ section\n• Use this chat for immediate assistance",
    hours: "Our customer service hours are:\n• Monday-Friday: 9 AM - 8 PM EST\n• Saturday: 10 AM - 6 PM EST\n• Sunday: 12 PM - 5 PM EST\n\nThis chat is available 24/7!",
    default: "I'm not sure I understood that. I can help with product info, shipping, returns, and more. What would you like to know?",
  };

  // List of stop words to filter out common terms
  const stopWords = [
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'by', 'from', 'to', 'for', 'with',
    'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down',
    'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now', 'what', 'do',
    'you', 'have', 'we', 'your', 'our', 'is', 'are', 'it', 'this', 'that', 'these', 'those'
  ];

  const extractProductName = (message: string): string | null => {
    const match = message.match(/about\s+(.+)|of\s+(.+)|is\s+(.+)/i);
    return match ? match[1] || match[2] || match[3] : null;
  };

  const findProductByName = (name: string): any | null => {
    const lowerName = name.toLowerCase();
    return products.find(p => p.name.toLowerCase().includes(lowerName)) || null;
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    if (productsLoading) {
      return "I'm still loading our product information. Please wait a moment and try again.";
    }

    if (!products || products.length === 0) {
      return "I'm having trouble accessing our product database right now. Please try again later or contact our support team.";
    }

    // Debug: Show product count when user asks about products
    if (message.includes("debug") || message.includes("test")) {
      return `Debug info: I have ${products.length} products loaded. First product: ${products[0]?.name || 'None'}. Categories: ${categories.length}. User authenticated: ${isAuthenticated}. Wishlist items: ${wishlistCount}. Pending reviews: ${pendingReviewsCount}.`;
    }

    // User-specific queries (only if authenticated)
    if (isAuthenticated) {
      if (message.includes("wishlist") || message.includes("favorites") || message.includes("saved")) {
        return getWishlistResponse(message);
      }
      
      if (message.includes("review") || message.includes("rating") || message.includes("feedback")) {
        return getReviewsResponse(message);
      }
      
      if (message.includes("profile") || message.includes("account") || message.includes("my info")) {
        return getProfileResponse(message);
      }
      
      if (message.includes("order") || message.includes("purchase") || message.includes("buy")) {
        return getOrdersResponse(message);
      }
    } else {
      // If not authenticated, suggest login for user-specific features
      if (message.includes("wishlist") || message.includes("favorites") || message.includes("profile") || message.includes("order")) {
        return "To access your personal information like wishlist, profile, and orders, please log in to your account first.";
      }
    }

    // Handle general product queries with regex
    if (/what.*products|list.*products|show.*products|available.*products|do you have.*products/i.test(message)) {
      const totalProducts = products.length;
      const categories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];
      return `We currently have ${totalProducts} products in our store across ${categories.length} categories: ${categories.slice(0, 5).join(', ')}${categories.length > 5 ? ' and more' : ''}. You can browse our full catalog by visiting the store page or ask me about specific products or categories.`;
    }

    if (message.includes("price of")) {
      const productName = extractProductName(message);
      if (productName) {
        const product = findProductByName(productName);
        if (product) {
          return `The price of "${product.name}" is Ksh ${product.price?.toLocaleString()}.`;
        }
        return "I couldn't find that product. Could you check the spelling or try another product?";
      }
    }

    if (message.includes("in stock") || message.includes("available")) {
      const productName = extractProductName(message);
      if (productName) {
        const product = findProductByName(productName);
        if (product) {
          return product.stock_quantity > 0
            ? `"${product.name}" is currently in stock with ${product.stock_quantity} units available.`
            : `"${product.name}" is currently out of stock.`;
        }
        return "I couldn't find that product. Could you check the spelling or try another product?";
      }
    }

    if (message.includes("more about") || message.includes("details of")) {
      const productName = extractProductName(message);
      if (productName) {
        const product = findProductByName(productName);
        if (product) {
          const details = [
            `Name: ${product.name}`,
            `Price: Ksh ${product.price?.toLocaleString()}`,
            product.description ? `Description: ${product.description}` : '',
            product.rating ? `Rating: ${product.rating.toFixed(1)} stars` : '',
            product.reviews ? `Reviews: ${product.reviews}` : '',
            `Stock: ${product.stock_quantity > 0 ? 'In stock' : 'Out of stock'}`,
          ].filter(Boolean).join('\n');
          return details;
        }
        return "I couldn't find that product. Could you check the name and try again?";
      }
    }

    if (message.includes("most popular") || message.includes("best selling")) {
      const popularProducts = products
        .filter(p => p.reviews && p.reviews > 0)
        .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
        .slice(0, 3);
      if (popularProducts.length > 0) {
        const productList = popularProducts.map(p => 
          `• ${p.name} - ${p.reviews || 0} reviews`
        ).join('\n');
        return `Our most popular products based on reviews are:\n${productList}`;
      }
      return "We don't have enough review data to determine the most popular products yet.";
    }

    if (message.includes("under") || message.includes("less than") || message.includes("below")) {
      const priceMatch = message.match(/under\s+ksh\s*(\d+)|less than\s+ksh\s*(\d+)|below\s+ksh\s*(\d+)/i);
      if (priceMatch) {
        const price = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
        const affordableProducts = products
          .filter(p => p.price < price)
          .slice(0, 3);
        if (affordableProducts.length > 0) {
          const productList = affordableProducts.map(p => 
            `• ${p.name} - Ksh ${p.price?.toLocaleString()}`
          ).join('\n');
          return `Here are some products under Ksh ${price}:\n${productList}`;
        }
        return `I couldn't find any products under Ksh ${price}. The lowest priced product is Ksh ${Math.min(...products.map(p => p.price))?.toLocaleString()}.`;
      }
    }

    if (message.includes("product") || message.includes("item") || message.includes("catalog")) {
      return getProductResponse(message);
    }
    
    if (message.includes("category") || message.includes("categories")) {
      return getCategoryResponse(message);
    }
    
    if (message.includes("price") || message.includes("cost") || message.includes("expensive") || message.includes("cheap")) {
      return getPriceResponse(message);
    }
    
    if (message.includes("stock") || message.includes("available") || message.includes("in stock")) {
      return getStockResponse(message);
    }
    
    if (message.includes("brand") || message.includes("brands")) {
      return getBrandResponse(message);
    }
    
    if (message.includes("recommend") || message.includes("suggestion") || message.includes("best")) {
      return getRecommendationResponse(message);
    }
    
    if (message.includes("gaming") || message.includes("gaming setup")) {
      return getGamingResponse(message);
    }

    if (message.includes("hello") || message.includes("hi")) return predefinedResponses.hello;
    if (message.includes("help") || message.includes("assistance")) return predefinedResponses.help;
    if (message.includes("ship") || message.includes("deliver") || message.includes("tracking")) return predefinedResponses.shipping;
    if (message.includes("return") || message.includes("refund") || message.includes("exchange")) return predefinedResponses.returns;
    if (message.includes("payment") || message.includes("pay") || message.includes("credit card")) return predefinedResponses.payment;
    if (message.includes("support") || message.includes("contact")) return predefinedResponses.support;
    if (message.includes("hours") || message.includes("time") || message.includes("available")) return predefinedResponses.hours;
    if (message.includes("order status") || message.includes("track order")) return "To check your order status, please visit your account dashboard or provide your order number. I can help guide you through the process!";
    
    return predefinedResponses.default;
  };

  const getWishlistResponse = (message: string): string => {
    if (wishlistCount === 0) {
      return "Your wishlist is empty. You can save products you like by clicking the heart icon on any product page. Would you like me to recommend some popular products to get you started?";
    }
    
    if (message.includes("count") || message.includes("how many")) {
      return `You have ${wishlistCount} item${wishlistCount === 1 ? '' : 's'} in your wishlist.`;
    }
    
    if (message.includes("view") || message.includes("show") || message.includes("see")) {
      return `You can view your wishlist by clicking on the heart icon in the navigation bar or visiting your profile page. You have ${wishlistCount} saved item${wishlistCount === 1 ? '' : 's'}.`;
    }
    
    return `You have ${wishlistCount} item${wishlistCount === 1 ? '' : 's'} in your wishlist. You can view them in your profile or add more products by browsing our store!`;
  };

  const getReviewsResponse = (message: string): string => {
    if (pendingReviewsCount === 0) {
      return "Great news! You're all caught up with your reviews. All your recent purchases have been reviewed.";
    }
    
    if (message.includes("pending") || message.includes("need") || message.includes("should")) {
      return `You have ${pendingReviewsCount} pending review${pendingReviewsCount === 1 ? '' : 's'} to complete. You can find them in your profile under "Pending Reviews" or I can help you navigate there.`;
    }
    
    if (message.includes("how many") || message.includes("count")) {
      return `You have ${pendingReviewsCount} review${pendingReviewsCount === 1 ? '' : 's'} pending.`;
    }
    
    return `You have ${pendingReviewsCount} pending review${pendingReviewsCount === 1 ? '' : 's'} for your recent purchases. Your feedback helps other customers make informed decisions!`;
  };

  const getProfileResponse = (message: string): string => {
    if (!userData) {
      return "I'm having trouble accessing your profile information. Please try refreshing the page or contact support if the issue persists.";
    }
    
    if (message.includes("name") || message.includes("who am i")) {
      return `You are ${userData.username || userData.name || 'a valued customer'}.`;
    }
    
    if (message.includes("email")) {
      return `Your email address is ${userData.email || 'not available'}.`;
    }
    
    if (message.includes("orders") || message.includes("purchases")) {
      const orderCount = userOrders.length;
      return `You have made ${orderCount} order${orderCount === 1 ? '' : 's'} with us. You can view all your orders in your profile page.`;
    }
    
    return `Welcome back, ${userData.username || userData.name || 'valued customer'}! You can manage your profile, view orders, and update your preferences in your account dashboard.`;
  };

  const getOrdersResponse = (message: string): string => {
    if (userOrders.length === 0) {
      return "You haven't placed any orders yet. Start shopping to see your order history here!";
    }
    
    const recentOrders = userOrders.slice(0, 3);
    const orderList = recentOrders.map(order => 
      `• Order #${order.order_id} - ${order.status} - Ksh ${order.total?.toLocaleString() || 0}`
    ).join('\n');
    
    if (message.includes("recent") || message.includes("latest")) {
      return `Your recent orders:\n${orderList}`;
    }
    
    if (message.includes("status") || message.includes("track")) {
      const pendingOrders = userOrders.filter(order => order.status === 'pending' || order.status === 'processing');
      if (pendingOrders.length > 0) {
        return `You have ${pendingOrders.length} active order${pendingOrders.length === 1 ? '' : 's'} being processed. Check your profile for detailed tracking information.`;
      }
      return "All your orders have been completed. You can view your full order history in your profile.";
    }
    
    return `You have ${userOrders.length} order${userOrders.length === 1 ? '' : 's'} in total. Your recent orders:\n${orderList}`;
  };

  const getProductResponse = (message: string): string => {
    const cleanMessage = message.toLowerCase().replace(/[^a-z\s]/g, '');
    const searchTerms = cleanMessage.split(' ').filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );

    if (searchTerms.length === 0 || (searchTerms.length === 1 && searchTerms[0] === 'products')) {
      const totalProducts = products.length;
      const categories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];
      return `We currently have ${totalProducts} products in our store across ${categories.length} categories: ${categories.slice(0, 5).join(', ')}${categories.length > 5 ? ' and more' : ''}. You can browse our full catalog by visiting the store page or ask me about specific products or categories.`;
    }

    const matchingProducts = products.filter(product => 
      searchTerms.some(term => 
        product.name.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term) ||
        product.category?.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
      )
    );

    if (matchingProducts.length === 0) {
      return "I couldn't find any products matching your search. Could you try different keywords or browse our store page?";
    }

    if (matchingProducts.length === 1) {
      const product = matchingProducts[0];
      const ratingInfo = product.rating ? ` It has a rating of ${product.rating.toFixed(1)} stars.` : '';
      return `I found "${product.name}" for Ksh ${product.price?.toLocaleString()}.${ratingInfo} ${product.stock_quantity > 0 ? 'It\'s currently in stock!' : 'Currently out of stock.'} Would you like to know more details?`;
    }

    const productList = matchingProducts.slice(0, 3).map(p => 
      `• ${p.name} - Ksh ${p.price?.toLocaleString()}`
    ).join('\n');

    return `I found ${matchingProducts.length} products matching your search:\n${productList}\n\nWould you like me to tell you more about any specific product?`;
  };

  const getCategoryResponse = (message: string): string => {
    const categoryNames = categories.map(c => c.name.toLowerCase());
    const searchTerms = message.split(' ').filter(word => 
      word.length > 2 && categoryNames.some(cat => cat.includes(word))
    );
    
    if (searchTerms.length === 0) {
      const categoryList = categories.slice(0, 5).map(c => c.name).join(', ');
      return `We have products in these categories: ${categoryList}${categories.length > 5 ? ' and more' : ''}. Which category interests you?`;
    }
    
    const matchingCategory = categories.find(cat => 
      searchTerms.some(term => cat.name.toLowerCase().includes(term))
    );
    
    if (!matchingCategory) {
      return "I couldn't find that specific category. Could you try a different category name?";
    }
    
    const categoryProducts = products.filter(p => p.category?.id === matchingCategory.id);
    const avgPrice = categoryProducts.length > 0 
      ? categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length 
      : 0;
    
    return `In the ${matchingCategory.name} category, we have ${categoryProducts.length} products with an average price of Ksh ${avgPrice.toLocaleString()}. Would you like me to recommend some specific products from this category?`;
  };

  const getPriceResponse = (message: string): string => {
    if (message.includes("expensive") || message.includes("high")) {
      const expensiveProducts = products
        .filter(p => p.price > 50000)
        .sort((a, b) => b.price - a.price)
        .slice(0, 3);
      
      if (expensiveProducts.length === 0) {
        return "Our most expensive products are around Ksh 50,000. Would you like to see our premium range?";
      }
      
      const productList = expensiveProducts.map(p => 
        `• ${p.name} - Ksh ${p.price?.toLocaleString()}`
      ).join('\n');
      
      return `Our most expensive products are:\n${productList}`;
    }
    
    if (message.includes("cheap") || message.includes("low") || message.includes("budget")) {
      const cheapProducts = products
        .filter(p => p.price < 10000)
        .sort((a, b) => a.price - b.price)
        .slice(0, 3);
      
      if (cheapProducts.length === 0) {
        return "Our most affordable products start from around Ksh 10,000. Would you like to see our budget-friendly options?";
      }
      
      const productList = cheapProducts.map(p => 
        `• ${p.name} - Ksh ${p.price?.toLocaleString()}`
      ).join('\n');
      
      return `Our most affordable products are:\n${productList}`;
    }
    
    const avgPrice = products.length > 0 
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
      : 0;
    
    return `Our products range from Ksh ${Math.min(...products.map(p => p.price))?.toLocaleString()} to Ksh ${Math.max(...products.map(p => p.price))?.toLocaleString()}, with an average price of Ksh ${avgPrice.toLocaleString()}. What's your budget range?`;
  };

  const getStockResponse = (message: string): string => {
    const inStock = products.filter(p => p.stock_quantity > 0);
    const lowStock = products.filter(p => p.stock_quantity <= 5 && p.stock_quantity > 0);
    const outOfStock = products.filter(p => p.stock_quantity === 0);
    
    if (message.includes("low") || message.includes("few")) {
      if (lowStock.length === 0) {
        return "All our products are well-stocked!";
      }
      
      const productList = lowStock.slice(0, 3).map(p => 
        `• ${p.name} - Only ${p.stock_quantity} left`
      ).join('\n');
      
      return `These products are running low on stock:\n${productList}`;
    }
    
    if (message.includes("out") || message.includes("unavailable")) {
      if (outOfStock.length === 0) {
        return "Great news! All our products are currently in stock.";
      }
      
      const productList = outOfStock.slice(0, 3).map(p => p.name).join(', ');
      return `These products are currently out of stock: ${productList}. Would you like me to suggest similar alternatives?`;
    }
    
    return `We have ${inStock.length} products in stock out of ${products.length} total products. ${lowStock.length} products are running low on stock.`;
  };

  const getBrandResponse = (message: string): string => {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    
    if (brands.length === 0) {
      return "We carry products from various brands. Is there a specific brand you're looking for?";
    }
    
    const searchTerms = message.split(' ').filter(word => 
      word.length > 2 && brands.some(brand => brand && brand.toLowerCase().includes(word))
    );
    
    if (searchTerms.length === 0) {
      const brandList = brands.slice(0, 5).join(', ');
      return `We carry products from these brands: ${brandList}${brands.length > 5 ? ' and more' : ''}. Which brand interests you?`;
    }
    
    const matchingBrand = brands.find(brand => 
      brand && searchTerms.some(term => brand.toLowerCase().includes(term))
    );
    
    if (!matchingBrand) {
      return "I couldn't find that specific brand. Could you try a different brand name?";
    }
    
    const brandProducts = products.filter(p => p.brand === matchingBrand);
    const avgPrice = brandProducts.length > 0 
      ? brandProducts.reduce((sum, p) => sum + p.price, 0) / brandProducts.length 
      : 0;
    
    return `We have ${brandProducts.length} products from ${matchingBrand} with an average price of Ksh ${avgPrice.toLocaleString()}. Would you like me to show you some specific products from this brand?`;
  };

  const getRecommendationResponse = (message: string): string => {
    const topRated = products
      .filter(p => p.rating && p.rating > 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
    
    if (topRated.length === 0) {
      const newest = products
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
      
      const productList = newest.map(p => 
        `• ${p.name} - Ksh ${p.price?.toLocaleString()}`
      ).join('\n');
      
      return `Here are some of our newest products:\n${productList}`;
    }
    
    const productList = topRated.map(p => 
      `• ${p.name} - Ksh ${p.price?.toLocaleString()} (${p.rating}★)`
    ).join('\n');
    
    return `Based on customer ratings, I recommend:\n${productList}`;
  };

  const getGamingResponse = (message: string): string => {
    const gamingProducts = products.filter(product => 
      product.name.toLowerCase().includes('gaming') ||
      product.category?.name.toLowerCase().includes('gaming') ||
      product.brand?.toLowerCase().includes('gaming') ||
      product.description?.toLowerCase().includes('gaming')
    );
    
    if (gamingProducts.length === 0) {
      return "We have an excellent selection of gaming equipment including high-performance PCs, gaming chairs, and accessories. Check out our gaming category for the latest gear!";
    }
    
    const productList = gamingProducts.slice(0, 3).map(p => 
      `• ${p.name} - Ksh ${p.price?.toLocaleString()}`
    ).join('\n');
    
    return `We have ${gamingProducts.length} gaming products available:\n${productList}\n\nWould you like me to tell you more about any specific gaming product?`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
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
    "Show me gaming products",
    "What's the most popular product?",
    "Show me products under Ksh 10,000",
    ...(isAuthenticated ? [
      "How many items in my wishlist?",
      "Do I have pending reviews?",
      "Show my recent orders",
      "What's my profile info?"
    ] : [
      "What's your return policy?",
      "Recommend some products"
    ])
  ];

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 ${isOpen ? "rotate-180" : ""}`}
        aria-label="Toggle chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
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
                  // Fallback to a default avatar if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
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
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${message.sender === "user" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                  <div className="flex items-start space-x-2">
                    {message.sender === "bot" && (
                      <div className="flex-shrink-0">
                        <img 
                          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=24&h=24&fit=crop&crop=face&auto=format&q=60" 
                          alt="Makena" 
                          className="w-4 h-4 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to a default avatar if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="w-4 h-4 bg-pink-400 rounded-full flex items-center justify-center text-white text-xs font-semibold hidden">
                          M
                        </div>
                      </div>
                    )}
                    {message.sender === "user" && <User className="w-4 h-4 mt-1 flex-shrink-0 text-white/80" />}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.sender === "user" ? "text-white/70" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                          // Fallback to a default avatar if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
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
                  <button key={index} onClick={() => handleQuickAction(action)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors">
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

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, products, error, fetchProducts } = useFetchProducts();
  const { addToCart } = useShoppingCart();
  const imgEndPoint = import.meta.env.VITE_API_BASE_URL;
  const { refreshStats } = useUserStats();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const heroImages = [
    {
      src: "https://images.unsplash.com/photo-1675049626914-b2e051e92f23?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Z2FtaW5nJTIwc2V0dXB8ZW58MHx8MHx8fDA%3D",
      alt: "Premium Gaming Setup",
      title: "Elevate Your Gaming",
      subtitle: "Discover premium gaming hardware that delivers unmatched performance",
      cta: "Shop Gaming",
    },
    {
      src: "https://images.pexels.com/photos/699459/pexels-photo-699459.jpeg",
      alt: "Professional Workspace",
      title: "Professional Workspace",
      subtitle: "Transform your productivity with cutting-edge technology",
      cta: "Explore Workspace",
    },
    {
      src: "https://images.pexels.com/photos/17753940/pexels-photo-17753940/free-photo-of-an-iphone-lying-next-to-a-keyboard-on-a-desk.jpeg?auto=compress&cs=tinysrgb&w=400",
      alt: "Latest Technology",
      title: "Latest Technology",
      subtitle: "Stay ahead with the newest innovations in tech",
      cta: "View New Arrivals",
    },
  ];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(intervalRef.current!);
  }, [heroImages.length]);

  useEffect(() => {
    fetchProducts(1, 100, "");
  }, [fetchProducts]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const addToCartWithAlert = (product: any) => {
    try {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        img_url: imgEndPoint + product.img_url,
        stockQuantity: product.stock_quantity,
      });
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error("Failed to add item to cart. Please try again.");
    }
  };

  return (
    <>
      <section className="min-h-screen relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">New Arrivals</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                {heroImages[currentIndex].title}
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent block">
                  Experience
                </span>
              </h1>
              <p className="text-xl text-white/80 max-w-md leading-relaxed">
                {heroImages[currentIndex].subtitle}
              </p>
              <button 
                onClick={() => navigate("/store")}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2"
              >
                <span>{heroImages[currentIndex].cta}</span>
                <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
            <div className="relative hidden lg:block">
              <img src={heroImages[currentIndex].src} alt={heroImages[currentIndex].alt} className="rounded-2xl shadow-2xl w-full object-cover max-h-[500px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Discover Amazing
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}Products
              </span>
            </h2>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="h-48 overflow-hidden">
                    <img
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      src={imgEndPoint + product.img_url}
                      alt={product.name}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(product.price)}
                      </span>
                      <button
                        onClick={() => addToCartWithAlert(product)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">No products available.</div>
          )}
          
          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/store")}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-2xl font-semibold"
            >
              View All Products
            </button>
          </div>
        </div>
      </section>

      <ServiceChatbot />
    </>
  );
};

export default Home;