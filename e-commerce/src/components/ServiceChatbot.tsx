import React, { useState, useEffect, useRef } from "react";
import { useFetchProducts } from "./UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import {
  MessageCircle,
  X,
  Send,
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

  const { products, isLoading: productsLoading, fetchProducts } = useFetchProducts();
  const { token, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (isOpen) {
      fetchProducts(1, 100, "");
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
      setWishlistCount(favorites.size);
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

  // ... (rest of the logic and return statement from Home.tsx ServiceChatbot)

  // (Paste the full return JSX and all logic from the original ServiceChatbot here)

};

export default ServiceChatbot;
