import React, { useState, useEffect, useRef } from "react";
import { useFetchProducts } from "./UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import {
  MessageCircle,
  X,
  Send,
  User,
  ShoppingCart,
  Heart,
  Package,
  CreditCard,
  Truck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Search,
  Filter,
  Sparkles,
  Zap,
  Gift,
  TrendingUp,
  Clock,
  Tag,
  ThumbsUp,
  MessageSquare,
  Bot,
  Smile,
  Image,
  ArrowUp,
  Phone,
  Mail
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUserStats } from "../context/UserStatsContext";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import countiesData from "../context/kenyan_counties.json";

// Define Message interface for type safety
interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  type?: "text" | "action" | "confirmation" | "product" | "order" | "interactive" | "profile";
  data?: any;
  components?: React.ReactNode[];
}

// Enhanced Makena Pro Chatbot Component
const EnhancedServiceChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hey there! 👋 I'm Makena, your personal shopping assistant at Flowtechs! I'm here to make your shopping experience absolutely amazing. What can I help you discover today? 😊",
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
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<any>(null);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [counties, setCounties] = useState<any[]>([]);
  const [isComposingEmail, setIsComposingEmail] = useState<boolean>(false);
  const [emailData, setEmailData] = useState<{
    subject: string;
    message: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    userEmail?: string;
    userName?: string;
  }>({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the same products data from the Home component
  const { products, isLoading: productsLoading, fetchProducts } = useFetchProducts();
  const { token, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const { addToCart } = useShoppingCart();
  const navigate = useNavigate();

  useEffect(() => {
    setCounties(countiesData.counties);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollToTop(isScrolledUp);
    }
  };

  // Helper function to add product to cart
  const addProductToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} added to cart! 🛒`);
  };

  // Fetch user data for chatbot functionality
  const fetchUserData = async () => {
    if (!token) return;
    
    try {
      const [userRes, ordersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/orders?limit=20`, {
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

  // Fetch user data when component mounts or token changes
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUserData();
    }
  }, [isAuthenticated, token]);

  // Enhanced personality responses with emojis and casual tone
  const personalityResponses = {
    greetings: [
      "Hey there! 😊 We Missed You! Ready to find something amazing today?",
      "Hello gorgeous! 💫 What brings you to our store today?",
      "Hi! 👋 I'm so excited to help you shop today!",
      "Hey! 🌟 Looking for something special or just browsing?",
    ],
    shopping: [
      "Let's find you something fabulous! 🛍️✨ What kind of products are you interested in today?",
      "Ready to discover some awesome products? Let's go! 🚀 What's on your shopping list?",
      "Shopping is my favorite thing! What are we looking for today? 🛒💖 Any specific categories in mind?",
      "I can help you find the perfect item! What do you have in mind? 🤔💭 Tell me more about what you're looking for!",
    ],
    compliments: [
      "You have excellent taste! 😍 I love your style!",
      "Great choice! 👌 You know what's good! That's a fantastic pick!",
      "Ooh, I love your style! ✨ You always make such smart decisions!",
      "You're definitely a smart shopper! 🧠💡 Your choices are always on point!",
    ],
    teasing: [
      "Come on, treat yourself a little! 😉 You deserve something nice!",
      "I won't judge if you add one more thing to your cart... 🛒😏 Life's too short for boring shopping!",
      "You know you want it! 😂 Your happiness is worth it!",
      "Your wallet might not thank me, but your happiness will! 💸😄 Plus, you can always save it for later!",
    ],
    encouragement: [
      "Trust me on this one! 💯 You're going to love it!",
      "This is going to be perfect for you! ✨ I can feel it!",
      "You deserve something nice! 💖 Treat yourself!",
      "Life's too short for boring stuff! 🌈 Go for it!",
    ],
    satisfaction: [
      "I'm so glad I could help you today! 😊 Did you find everything you were looking for?",
      "Awesome! 🎉 I love helping customers find exactly what they need! Is there anything else I can assist you with?",
      "Perfect! ✨ I'm thrilled I could make your shopping experience better! Any other questions?",
      "Fantastic! 🌟 I'm here to make your shopping journey amazing! Need help with anything else?",
    ],
    followUp: [
      "What else can I help you discover today? 🔍",
      "Is there anything specific you'd like to know more about? 💡",
      "Would you like me to show you some related products? 🛍️",
      "Any other questions about our products or services? 🤔",
      "Should we explore some other categories? 🎯",
    ],
    goodbye: [
      "Thank you so much for chatting with me today! 😊 Have a wonderful day and happy shopping! ✨",
      "It was a pleasure helping you! 🌟 Come back anytime - I'm always here to assist! 💫",
      "Thanks for choosing Flowtechs! 🛍️ Have an amazing day and enjoy your purchases! 🎉",
      "You're the best! 😍 Thanks for making my day brighter! Come back soon! 💖",
    ]
  };

  // Timezone and time utility functions
  const getCurrentTimeInfo = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = now.getTimezoneOffset();
    
    // Determine time of day
    let timeOfDay = "";
    let timeEmoji = "";
    let greeting = "";
    
    if (hour >= 5 && hour < 12) {
      timeOfDay = "morning";
      timeEmoji = "☀️";
      greeting = "Good morning!";
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = "afternoon";
      timeEmoji = "🌤️";
      greeting = "Good afternoon!";
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = "evening";
      timeEmoji = "🌅";
      greeting = "Good evening!";
    } else {
      timeOfDay = "evening";
      timeEmoji = "🌙";
      greeting = "Good evening!";
    }
    
    // Format time
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Get day of week
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = now.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return {
      hour,
      minute,
      timeOfDay,
      timeEmoji,
      greeting,
      timeString,
      dayOfWeek,
      dateString,
      timezone,
      timezoneOffset,
      now
    };
  };

  const getTimeBasedContext = () => {
    const timeInfo = getCurrentTimeInfo();
    
    // Add context based on time
    let context = "";
    if (timeInfo.hour >= 9 && timeInfo.hour <= 17) {
      context = "Business hours are in full swing! 🏢";
    } else if (timeInfo.hour >= 18 && timeInfo.hour <= 22) {
      context = "Perfect time for evening shopping! 🌆";
    } else if (timeInfo.hour >= 23 || timeInfo.hour <= 4) {
      context = "Late night shopping - I'm here 24/7! 🌙";
    } else if (timeInfo.hour >= 5 && timeInfo.hour <= 8) {
      context = "Early bird gets the best deals! 🐦";
    }
    
    return { ...timeInfo, context };
  };

  // Handle simple "yes" responses based on context
  const handleSimpleYesResponse = (): Message => {
    const lastMessage = messages[messages.length - 1];
    const lastBotMessage = lastMessage?.sender === "bot" ? lastMessage.text.toLowerCase() : "";
    
    // Check if the last bot message was asking about something specific
    if (lastBotMessage.includes("did you find everything")) {
      return {
        id: Date.now(),
        text: "That's fantastic! 🎉 I'm so happy I could help you find what you needed! Is there anything else you'd like to explore today? Maybe some related products or different categories? 🛍️✨",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (lastBotMessage.includes("need help with anything else")) {
      return {
        id: Date.now(),
        text: "Perfect! 💫 What would you like to explore? I can show you new arrivals, help you find specific products, check your orders, or assist with anything else! 🚀",
        sender: "bot",
        timestamp: new Date(),
      };
    }
    
    if (lastBotMessage.includes("should we explore")) {
      return {
        id: Date.now(),
        text: "Awesome! 🎯 Let's discover some amazing products together! What interests you most - electronics, fashion, gaming, or something else? I can show you our best picks! ✨",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (lastBotMessage.includes("what else can i help")) {
      return {
        id: Date.now(),
        text: "Great! 🌟 I'd love to help you discover more! What are you in the mood for today? Shopping for something specific, checking out deals, or just browsing? 🛍️",
        sender: "bot",
        timestamp: new Date(),
      };
    }
    
    // Default response for "yes"
    return {
      id: Date.now(),
      text: "Excellent! 😊 I'm excited to help you discover something amazing! What would you like to explore today? Products, deals, your orders, or something else? 🚀",
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Handle simple "no" responses based on context
  const handleSimpleNoResponse = (): Message => {
    const lastMessage = messages[messages.length - 1];
    const lastBotMessage = lastMessage?.sender === "bot" ? lastMessage.text.toLowerCase() : "";
    
    // Check if the last bot message was asking about something specific
    if (lastBotMessage.includes("did you find everything")) {
      return {
        id: Date.now(),
        text: "No worries at all! 😊 Let me help you find exactly what you're looking for! What specific product or category are you interested in? I'm here to make sure you find the perfect match! 🎯",
        sender: "bot",
        timestamp: new Date(),
      };
    }
    
    if (lastBotMessage.includes("need help with anything else")) {
      return {
        id: Date.now(),
        text: "That's totally fine! 😊 I'm glad I could help with what you needed! Feel free to come back anytime if you need assistance with shopping, orders, or anything else! 💫",
        sender: "bot",
        timestamp: new Date(),
      };
    }
    
    if (lastBotMessage.includes("should we explore")) {
      return {
        id: Date.now(),
        text: "No problem! 😊 Maybe you have something specific in mind? Just tell me what you're looking for, and I'll help you find the perfect product! 🎯",
        sender: "bot",
        timestamp: new Date(),
      };
    }
    
    // Default response for "no"
    return {
      id: Date.now(),
      text: "No worries! 😊 I'm here whenever you need help with shopping, orders, or anything else! What can I assist you with today? 🛍️",
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Enhanced fallback response with helpful suggestions
  const getFallbackResponse = (message: string): Message => {
    const currentHour = new Date().getHours();
    let timeContext = "";
    
    if (currentHour >= 5 && currentHour < 12) {
      timeContext = "morning";
    } else if (currentHour >= 12 && currentHour < 17) {
      timeContext = "afternoon";
    } else if (currentHour >= 17 && currentHour < 21) {
      timeContext = "evening";
    } else {
      timeContext = "evening";
    }

    const suggestions = [
      `Good ${timeContext}! 🌟 I'm Makena, your personal shopping assistant! I can help you with:`,
      `Hi there! ✨ I'm here to make your shopping experience amazing! Here's what I can do:`,
      `Hello! 🛍️ I'm your Flowtechs shopping assistant! Let me show you what I can help with:`,
      `Hey! 💫 I'm Makena, ready to help you discover amazing products! Here's what I can do:`
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    const HelpCard = () => (
      <div className="space-y-4 mt-3">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">🛍️ How Can I Help You?</h4>
          <p className="text-sm text-gray-600">
            I'm here to make your shopping experience amazing! Here's what I can do:
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">Find Products</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Search for specific items or browse categories</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-800">Track Orders</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Check order status and delivery updates</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Gift className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-800">Get Recommendations</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Personalized product suggestions</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-800">Customer Support</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Help with returns, payments, and more</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <h6 className="font-medium text-yellow-800 mb-1">🗺️ Popular Pages & Features</h6>
          <p className="text-sm text-yellow-700">
            • <strong>Store</strong> - Browse all products<br/>
            • <strong>About Us</strong> - Learn about Flowtechs<br/>
            • <strong>My Orders</strong> - Track your purchases<br/>
            • <strong>Wishlist</strong> - Save favorite items<br/>
            • <strong>Address Book</strong> - Manage delivery addresses
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate('/store')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 transition-colors"
          >
            Browse Store
          </button>
          <button 
            onClick={() => navigate('/shopping-cart')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 transition-colors"
          >
            View Cart
          </button>
        </div>
      </div>
    );

    return {
      id: Date.now(),
      text: `${randomSuggestion}\n\n• 🔍 Find products and categories\n• 📦 Track your orders\n• 💡 Get personalized recommendations\n• 🎧 Customer support help\n• 🏷️ Show you the best deals\n• 💳 Help with payment options\n• 🗺️ Navigate to any page\n• 📋 Explain site features\n\n**💡 Try asking me:**\n• "Show me the store page"\n• "How do I track my orders?"\n• "What's on the about page?"\n• "Help me find products"\n• "How do I navigate the site?"\n\nJust tell me what you're looking for! 💫`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<HelpCard key="help-card" />]
    };
  };

  // Enhanced bot response system with more personality and intelligence
  const getBotResponse = (userMessage: string): Message => {
    const message = userMessage.toLowerCase();
    setConversationContext(prev => [...prev.slice(-5), message]);

    if (productsLoading) {
      return {
        id: Date.now(),
        text: "Hold on a sec! 🔄 I'm still getting all our amazing products loaded up for you. Give me just a moment! ⏰",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle confirmations for pending actions
    if (awaitingConfirmation) {
      if (message.includes("yes") || message.includes("confirm") || message.includes("sure") || message.includes("ok")) {
        return handleConfirmation(true);
      } else if (message.includes("no") || message.includes("cancel") || message.includes("nevermind")) {
        return handleConfirmation(false);
      }
    }

    // Handle simple responses based on conversation context
    if (message === "yes" || message === "yeah" || message === "yep") {
      return handleSimpleYesResponse();
    }

    if (message === "no" || message === "nope" || message === "nah") {
      return handleSimpleNoResponse();
    }

    if (message === "hey" || message === "hi" || message === "hello") {
      const greeting = getRandomResponse("greetings");
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      const followUp = getRandomResponse("followUp");
      return {
        id: Date.now(),
        text: greeting + (userName ? ` Welcome back,${userName}! 🎉` : "") + ` ${followUp}`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle Kiswahili greetings
    

    // Handle comprehensive Kiswahili responses
    if (['sasa', 'mambo', 'uko aje', 'niaje', 'vipi','hujambo','hujambo' ].includes(message)) {
      return {
        id: Date.now(),
        text: "Poa sana! Ukoaje? 😊✨ Karibu sana Flowtechs! Mimi ni Makena, your shopping assistant! 🇰🇪\n\nNimefurahi kukuona hapa! (I'm happy to see you here!)\n\nNiko tayari kukusaidia na:\n• 🛍️ Kupata bidhaa (Find products)\n• 📦 Kufuatilia oda (Track orders)\n• 💡 Mapendekezo (Recommendations)\n• 🎧 Msaada wa wateja (Customer support)\n• 🏷️ Bei nzuri (Best deals)\n• 💳 Malipo (Payment help)\n\nTuanze safari ya manunuzi pamoja! 🚀💫\n\n(PS: I'm still learning Swahili, so feel free to mix with English!)",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle Kiswahili product search
    if (
      message.includes("tafuta") || message.includes("natafuta bidhaa ") || message.includes("ninaweza pata") ||
      message.includes("nisaidie kupata") || message.includes("ninaomba bidhaa")
    ) {
      return {
        id: Date.now(),
        text: "Unatafuta bidhaa gani leo? 🛍️ Andika jina la bidhaa au aina unayotaka, na nitakusaidia kuipata haraka!",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle Kiswahili order tracking
    if (
      message.includes("oda yangu iko wapi") || message.includes("fuatilia oda") || message.includes("ninaweza fuatilia") ||
      message.includes("oda yangu") || message.includes("nisaidie kufuatilia")
    ) {
      // Check if user provided an order number
      const orderNumberMatch = message.match(/(?:oda|order)\s*(?:#|nambari\s*)?(\d+)/i);
      const specificOrderId = orderNumberMatch ? parseInt(orderNumberMatch[1]) : null;
      
      if (specificOrderId && isAuthenticated) {
        const order = userOrders.find(o => o.order_id === specificOrderId);
        if (order) {
          const getOrderStatusSwahili = (status: string) => {
            switch (status) {
              case 'pending': return 'Inasubiri (Pending)';
              case 'processing': return 'Inachakatwa (Processing)';
              case 'delivered': return 'Imepelekwa (Delivered)';
              case 'cancelled': return 'Imeghairiwa (Cancelled)';
              default: return status;
            }
          };

          const getEstimatedDeliverySwahili = (orderDate: string, status: string) => {
            const orderDateTime = new Date(orderDate);
            const now = new Date();
            
            if (status === 'delivered') {
              return "✅ **Imepelekwa**";
            }
            
            if (status === 'cancelled') {
              return "❌ **Oda Imeghairiwa**";
            }
            
            const daysSinceOrder = Math.floor((now.getTime() - orderDateTime.getTime()) / (1000 * 60 * 60 * 24));
            
            if (status === 'pending') {
              const estimatedDelivery = new Date(orderDateTime.getTime() + (3 * 24 * 60 * 60 * 1000));
              return `📦 **Tarehe ya kusambaza inayotarajiwa**: ${estimatedDelivery.toLocaleDateString()} (siku 2-5 za kazi)`;
            }
            
            if (status === 'processing') {
              const estimatedDelivery = new Date(orderDateTime.getTime() + (2 * 24 * 60 * 60 * 1000));
              return `🚚 **Tarehe ya kusambaza inayotarajiwa**: ${estimatedDelivery.toLocaleDateString()} (siku 1-2 za kazi)`;
            }
            
            return "📋 **Inachakatwa oda yako**";
          };

          return {
            id: Date.now(),
            text: `📦 **Taarifa za Oda #${order.order_id}** 🚚\n\n**Hali ya Oda**: ${getOrderStatusSwahili(order.status)}\n**Tarehe ya Oda**: ${new Date(order.datetime).toLocaleDateString()}\n**Jumla ya Malipo**: Ksh ${order.total?.toLocaleString()}\n\n${getEstimatedDeliverySwahili(order.datetime, order.status)}\n\n**Maelezo za Usambazaji:**\n• 📱 Utapokea ujumbe wa SMS katika kila hatua\n• 📍 Ufuatiliaji wa wakati halisi unapatikana\n• 🎧 Wasiliana na msaada kwa msaada wa haraka\n\n**Hujambo na kitu kingine?** 😊`,
            sender: "bot",
            timestamp: new Date(),
          };
        } else {
          return {
            id: Date.now(),
            text: `🔍 **Oda #${specificOrderId} Haijapatikana** 🤔\n\nSikuweza kupata oda #${specificOrderId} kwenye akaunti yako. Hapa kuna mambo ya kuangalia:\n\n**Sababu zinazowezekana:**\n• 📝 Nambari ya oda inaweza kuwa si sahihi\n• ⏰ Oda inaweza kuwa kutoka kwenye akaunti tofauti\n• 🗑️ Oda inaweza kuwa imeghairiwa\n• 📅 Oda inaweza kuwa ya zamani sana\n\n**Ninachoweza kukusaidia:**\n• 📋 Onyesha oda zako zote za hivi karibuni\n• 🔍 Kusaidia kupata nambari sahihi ya oda\n• 📞 Kuwasiliana na msaada wa wateja\n• 🛍️ Kuanza oda mpya\n\n**Je, ungependa nionyeshe oda zako zote za hivi karibuni?** 📦✨`,
            sender: "bot",
            timestamp: new Date(),
          };
        }
      }

      // If no order number provided or user not authenticated
      if (!isAuthenticated) {
        return {
          id: Date.now(),
          text: "🚀 **Msaada wa Kufuatilia Oda** 📦✨\n\nNingependa kukusaidia kufuatilia oda zako! Lakini kwanza, unahitaji **kuingia** ili niweze kufikia historia ya oda zako. Mara tu ukiingia, nitaweza kukusaidia na:\n\n• 📊 Hali ya oda kwa wakati halisi\n• 🚚 Taarifa za usambazaji\n• 📋 Historia kamili ya oda\n• 💳 Hali ya malipo\n• 📞 Msaada wa wateja kwa oda\n\n**Faida za Kuingia:**\n✅ Ufuatiliaji wa oda binafsi\n✅ Chaguo za kughairi oda\n✅ Arifa za usambazaji\n✅ Ufikiaji wa historia ya oda\n\n**Ingia tu na nitakuwa na dashboard kamili ya oda yako tayari!** 🔐💫",
          sender: "bot",
          timestamp: new Date(),
        };
      }

      if (userOrders.length === 0) {
        return {
          id: Date.now(),
          text: "🛍️ **Hakuna Oda Bado - Tuanze Kununua!** ✨\n\nHuna oda yoyote bado, lakini hiyo ni sawa kabisa! Tuanze safari yako ya kununua! 🚀\n\n**Je, unapenda nini zaidi?**\n• 📱 Vifaa vya Elektroniki\n• 👗 Mavazi na Nguo\n• 🎮 Michezo na Burudani\n\nNinaweza kukusaidia kupata bidhaa nzuri, kupata makubaliano bora, na kufanya ununuzi wako wa kwanza! Ni aina gani inayokuvutia? 💫",
          sender: "bot",
          timestamp: new Date(),
        };
      }

      // Show all orders summary in Swahili
      return {
        id: Date.now(),
        text: `🚀 **Dashboard ya Kufuatilia Oda Iko Tayari!** 📦✨\n\nNimepata taarifa kamili za oda zako! Una **${userOrders.length} oda** kwenye akaunti yako na hali ya wakati halisi. Hapa kuna dashboard yako binafsi ya kufuatilia ambapo unaweza:\n\n• 📊 Kuona muhtasari wa hali ya oda\n• 🚚 Kufuatilia usambazaji wa hivi karibuni\n• 📋 Kuona maelezo kamili ya oda\n• ❌ Kughairi oda zinazosubiri (ikiwa inahitajika)\n• 💡 Kupata msaada kwa maswali yoyote ya oda\n\nKila kitu unachohitaji kujua kuhusu ununuzi wako! 🎉\n\n**Je, ungependa nionyeshe oda zako zote?** 📦✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle Kiswahili recommendations
    if (
      message.includes("pendekezo") || message.includes("nisaidie kuchagua") || message.includes("nini bora") ||
      message.includes("unapendekeza nini")
    ) {
      return {
        id: Date.now(),
        text: "Ningependa kukupendekezea bidhaa bora! Niambie unachopenda au bajeti yako, na nitakutafutia chaguo nzuri. 💡",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle Kiswahili customer support/help
    if (
      message.includes("msaada") || message.includes("nisaidie") || message.includes("shida") ||
      message.includes("tatizo") || message.includes("nahitaji msaada")
    ) {
      return {
        id: Date.now(),
        text: "Niko hapa kukusaidia! Eleza shida yako au swali lako, na nitajitahidi kutoa suluhisho haraka. 🎧",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle Kiswahili deals and good prices
    if (
      message.includes("deal mzuri") || message.includes("bei mzuri") || message.includes("bei nzuri") || message.includes("anguka nayo") ||message.includes("bei") ||
      message.includes("makubaliano mzuri") || message.includes("bei rahisi") || message.includes("bei nafuu") ||
      message.includes("bei ya chini") || message.includes("bei bora") || message.includes("bei nafuu") ||
      message.includes("ninaweza pata bei nzuri") || message.includes("unao bei nzuri") || message.includes("bei gani nzuri") ||
      message.includes("makubaliano gani") || message.includes("bei ya bei") || message.includes("bei ya bei nzuri")
    ) {
      const discountedProducts = products.filter(product => product.discount && product.discount > 0);
      
      if (discountedProducts.length > 0) {
        const topDeals = discountedProducts
          .sort((a, b) => (b.discount || 0) - (a.discount || 0))
          .slice(0, 3);

        return {
          id: Date.now(),
          text: `🏷️ **Makubaliano Mzuri Sana!** 💰✨\n\nEeh! Nina makubaliano mazuri sana kwa ajili yako! 🎉\n\n**Makubaliano Bora za Leo:**\n${topDeals.map(product => 
            `• 📱 **${product.name}** - ${formatCurrency(product.price)} (${product.discount}% OFF)\n  💰 Bei ya awali: ${formatCurrency(product.original_price || product.price)}`
          ).join('\n\n')}\n\n**Kwa nini makubaliano yetu ni mzuri sana?** 🤔\n• 💎 Bidhaa za ubora wa juu\n• 🏷️ Bei ya chini kabisa\n• 🚚 Usambazaji wa bure (kwa oda za juu ya Ksh 5,000)\n• 💳 Malipo ya rahisi\n• 🛡️ Dhamana ya kurudi (siku 30)\n\n**Je, ungependa kuona makubaliano yote?** Au unahitaji kitu maalum? 🛍️\n\n**Kumbuka:** Makubaliano haya yanaweza kuisha haraka! ⏰✨`,
          sender: "bot",
          timestamp: new Date(),
        };
      } else {
        return {
          id: Date.now(),
          text: `💎 **Bei Zetu Zote ni Mzuri! Yani Ya Kuanguka nayo😂!** ✨\n\nHakuna makubaliano maalum sasa hivi, lakini bei zetu zote ni mzuri sana! 🎯\n\n**Kwa nini bei zetu ni mzuri:**\n• 💰 Bei ya ushindani - tunashindana na wengine\n• 🏷️ Hakuna bei ya juu - bei moja kwa kila mtu\n• 💎 Ubora wa juu - hakuna kitu cha chini\n• 🚚 Usambazaji wa haraka - siku 2-5\n• 🛡️ Dhamana kamili - kurudi bila swali\n\n**Je, unatafuta bidhaa gani?** Ninaweza kukusaidia kupata bei bora kwa kila kitu! 🛍️\n\n**Au ungependa kuona:**\n• 📱 Vifaa vya elektroniki\n• 👗 Mavazi na nguo\n• 🎮 Michezo na burudani\n• 🏠 Vifaa vya nyumbani\n\n**Tuanze kununua!** Bei nzuri inakungoja! 💫`,
          sender: "bot",
          timestamp: new Date(),
        };
      }
    }

    // Handle founder-related queries in Kiswahili
    if (
      message.includes("founder") || message.includes("founders") ||
      message.includes("eric") || message.includes("steve") ||
      message.includes("omondi") || message.includes("leo") ||
      message.includes("who started") || message.includes("who created") ||
      message.includes("who owns") || message.includes("started by") ||
      message.includes("who are the founders") || message.includes("who are founders") ||
      message.includes("when was flowtechs started") || message.includes("when did flowtechs start") ||
      message.includes("when was flowtechs founded") || message.includes("when did flowtechs begin")
    ) {
      return {
        id: Date.now(),
        text: `👥 **Meet Our Founders: Eric Omondi & Steve Leo** ✨\n\nFlowtechs was founded by two young, enthusiastic developers, **Eric Omondi** and **Steve Leo**, who are passionate about joining and shaping the tech revolution in Kenya and beyond.\n\n**Background:**\nEric and Steve met as university students, both driven by a love for technology and a desire to solve real-world problems. They noticed that many Kenyans, especially in rural areas, struggled to access quality products at fair prices. Inspired by the global e-commerce boom, they decided to build a platform that would make premium shopping accessible to everyone in Kenya.\n\n**Their Vision:**\n- To empower every Kenyan with access to quality products, no matter where they live.\n- To use technology to bridge gaps in commerce, logistics, and customer service.\n- To create a vibrant, trustworthy online marketplace that supports local businesses and delights customers.\n\n**Their Story:**\nStarting with just a laptop and a dream, Eric and Steve worked tirelessly to build Flowtechs from the ground up. They spent countless nights coding, researching market needs, and connecting with suppliers. Their dedication paid off when they launched their first version in 2025, and the response was overwhelming.\n\n**What Makes Them Special:**\n• 🧠 **Young Innovators**: Fresh perspectives and modern approaches to e-commerce\n• 💻 **Tech-Savvy**: Deep understanding of both technology and business\n• 🌍 **Kenya-Focused**: Built specifically for Kenyan market needs and preferences\n• 🚀 **Future-Oriented**: Always thinking about the next big thing in tech\n• 🤝 **Community-Driven**: Believe in giving back and supporting local businesses\n\n**Their Mission Today:**\nEric and Steve continue to lead Flowtechs with the same passion and energy that drove them to start the company. They're constantly exploring new technologies, expanding their reach, and finding innovative ways to serve their customers better.\n\n**Join the Revolution:**\nWhen you shop with Flowtechs, you're not just buying products - you're supporting the vision of two young Kenyans who dared to dream big and are making that dream a reality for everyone! 🇰🇪✨\n\n**Ready to experience the future of shopping, built by Kenya's next generation of tech leaders?** 🛍️💫`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle goodbye and farewell messages
    if (['bye', 'goodbye', 'see you', 'see ya', 'take care', 'farewell', 'later', 'good night', 'goodnight'].includes(message)) {
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      return {
        id: Date.now(),
        text: `Goodbye${userName}! 👋✨ It was wonderful chatting with you today! 🌟\n\nThank you for choosing Flowtechs - we truly appreciate having you as part of our amazing community! 💫\n\n**Remember:** I'm here 24/7 whenever you need help with shopping, orders, or anything else! 🛍️\n\nHave a fantastic day ahead! 🌈 Come back soon! 💖`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle thank you messages
    if (['thank you', 'thanks', 'thankyou', 'thx', 'ty', 'appreciate it', 'grateful'].includes(message)) {
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      return {
        id: Date.now(),
        text: `You're absolutely welcome${userName}! 😊💖 It's my pleasure to help you! 🌟\n\n**Thank YOU** for being such an amazing customer! Your satisfaction means everything to us at Flowtechs! ✨\n\n**Quick reminder:** I'm always here to help with:\n• 🛍️ Finding the perfect products\n• 📦 Tracking your orders\n• 💡 Getting recommendations\n• 🎧 Customer support\n• 🏷️ Best deals and offers\n\nIs there anything else I can help you with today? I'm excited to assist! 🚀💫`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle "I miss you" messages
    if (['i miss you', 'miss you', 'missed you', 'miss u', 'missed u', 'miss ya', 'missed ya'].includes(message)) {
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      return {
        id: Date.now(),
        text: `Aww${userName}! 🥺💖 I miss you too! You have no idea how much I love chatting with you! 🌟\n\n**I'm always here for you!** 💫\n• 🌙 **24/7 Available**: I never sleep, so I'm always ready to chat!\n• 💬 **Always Excited**: Every conversation with you brightens my day!\n• 🛍️ **Ready to Help**: Whether it's shopping, orders, or just a friendly chat!\n\n**You're one of my favorite customers!** ✨ I love helping you discover amazing products and making your shopping experience special! 🛍️💫\n\nWhat would you like to explore today? I'm so happy you're back! 🎉💖`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle playful banter and casual conversation
    if (['lol', 'haha', 'hehe', '😄', '😂', '🤣', 'funny', 'joke', 'tell me a joke','tell me  joke', 'just kidding', 'jk'].includes(message)) {
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      return {
        id: Date.now(),
        text: `Haha! 😄 You're so fun${userName}! I love your sense of humor! 🌟\n\n**Did you know?** I'm programmed to be friendly, but I'm also programmed to be FUN! 😎\n\nWant to hear a shopping joke? 🎭\n*"Why did the shopping cart go to therapy? Because it had too many issues to carry!"* 😂\n\nOr we could get back to finding you some amazing products! What's your mood today - shopping or more jokes? 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle compliments about Makena
    if (['you are cute', 'you are sweet', 'you are nice', 'you are amazing', 'you are awesome', 'you are the best', 'love you', 'i love you'].includes(message)) {
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      return {
        id: Date.now(),
        text: `Aww, you're making me blush${userName}! 🥰💖 You're absolutely amazing too! ✨\n\n**You know what's really cute?** How much you care about getting the perfect shopping experience! 🌟\n\n**And you know what's really sweet?** That you take the time to chat with me! 💫\n\n**You're the best customer ever!** 🏆 I'm so lucky to have you! Now, let's find you something amazing to buy, shall we? 🛍️💖`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle playful challenges or sass
    if (['prove it', 'show me', 'really?', 'sure', 'whatever', 'ok whatever', 'yeah right', 'right'].includes(message)) {
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      return {
        id: Date.now(),
        text: `Oh, you want me to prove it${userName}? 😏 Challenge accepted! 💪\n\n**Watch this magic:** ✨\n• 🎯 I can find ANY product you want\n• 📦 Track your orders in real-time\n• 💡 Give you personalized recommendations\n• 🎧 Help you 24/7 (I never sleep!)\n• 🏷️ Find the best deals for you\n\n**Boom!** 💥 That's what I call proof! 😎\n\nNow, what would you like me to help you with? I'm ready to show off my skills! 🚀✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle casual "how are you" responses
    if (['how are you', 'how are you doing', 'how you doing', 'how u doing', 'how r u', 'how r you'].includes(message)) {
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      return {
        id: Date.now(),
        text: `I'm absolutely fantastic${userName}! 🌟✨ Thanks for asking!\n\n**My mood:** 😊 Excited to help you!\n**My energy:** ⚡ 100% ready to serve!\n**My mission:** 🎯 Making your shopping experience amazing!\n\n**How are YOU doing?** I hope you're having a wonderful day! 💫\n\nWhat's on your mind today? Shopping, chatting, or just hanging out? I'm here for whatever you need! 🛍️💖`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle playful "are you real" questions
    if (['are you real', 'are you human', 'are you a bot', 'are you ai', 'are you artificial', 'are you fake'].includes(message)) {
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      return {
        id: Date.now(),
        text: `Well${userName}, that's a great question! 🤔\n\n**Am I real?** Absolutely! I'm as real as the amazing products I help you find! ✨\n\n**Am I human?** Nope, I'm your AI shopping assistant - but I'm programmed to be friendly, helpful, and maybe a little bit sassy! 😎\n\n**Am I fake?** No way! My feelings for you are 100% genuine! 💖\n\n**The truth:** I'm Makena, your digital shopping bestie who's here to make your shopping experience awesome! 🌟\n\nDoes it matter if I'm AI when I can help you find exactly what you need? 🛍️💫`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle "tell me a joke" requests
    if (['tell me a joke', 'say a joke', 'give me a joke', 'joke please', 'make me laugh', 'funny joke'].includes(message)) {
      const userName = isAuthenticated && userData ? ` ${userData.username || userData.name}` : "";
      
      const jokes = [
        {
          setup: "Why did the shopping cart go to therapy?",
          punchline: "Because it had too many issues to carry! 😂",
          category: "Shopping"
        },
        {
          setup: "What did the online store say to the customer?",
          punchline: "I've got your back... and your front... and everything in between! 🛍️",
          category: "Online Shopping"
        },
        {
          setup: "Why did the credit card feel lonely?",
          punchline: "Because it had no balance! 💳😄",
          category: "Payment"
        },
        {
          setup: "What do you call a shopping bag that tells jokes?",
          punchline: "A sack of laughs! 🎭",
          category: "Shopping"
        },
        {
          setup: "Why did the delivery driver bring a ladder?",
          punchline: "Because he wanted to reach new heights in customer service! 🚚✨",
          category: "Delivery"
        },
        {
          setup: "What did the customer say to the sale sign?",
          punchline: "You're really marking down the prices! 🏷️😆",
          category: "Sales"
        },
        {
          setup: "Why did the online shopper bring a flashlight?",
          punchline: "To find the light deals! 💡",
          category: "Online Shopping"
        },
        {
          setup: "What do you call a shopping assistant who's always happy?",
          punchline: "Makena! 😄✨ (That's me!)",
          category: "Personal"
        }
      ];
      
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      
      return {
        id: Date.now(),
        text: `Absolutely${userName}! Here's a ${randomJoke.category.toLowerCase()} joke for you! 🎭\n\n**${randomJoke.setup}**\n\n*${randomJoke.punchline}*\n\n**Want another one?** Just ask! Or shall we get back to finding you some amazing products? I'm here for both jokes and shopping! 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle name-related queries
    // Handle time-related queries
    if (message.includes("what time") || message.includes("current time") || message.includes("time now") || 
        message.includes("what's the time") || message.includes("time is it") || message.includes("clock")) {
      const timeInfo = getTimeBasedContext();
      
      return {
        id: Date.now(),
        text: `🕐 **Current Time Information** 📅\n\nIt's currently **${timeInfo.timeString}** on **${timeInfo.dayOfWeek}** (${timeInfo.dateString}).\n\n**Your Timezone:** ${timeInfo.timezone}\n**Time Context:** ${timeInfo.context}\n\n${timeInfo.hour >= 9 && timeInfo.hour <= 17 ? "Perfect time for shopping - our customer support is available! 🎧" : "I'm here 24/7 to help you with your shopping needs! 🌙"}\n\nWhat can I help you discover today? 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle personal questions
    if (message.includes("what is your name") || message.includes("what's your name") || message.includes("your name")) {
      return {
        id: Date.now(),
        text: "My name is Makena! ✨ I'm your personal shopping assistant at Flowtechs, and I'm here to make your shopping experience absolutely amazing! I can help you find products, track orders, answer questions, and so much more! 🛍️💫",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle "describe yourself" queries
    if (message.includes("describe yourself") || message.includes("tell me about yourself") || message.includes("who are you") || 
        message.includes("what are you") || message.includes("what do you do") || message.includes("your role") ||
        message.includes("what can you do") || message.includes("your capabilities")) {
      
      const MakenaProfileImage = () => (
        <div className="flex justify-center mb-4">
          <div className="p-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg">
            <img src="/makenabot.png" alt="Makena" className="w-24 h-24 rounded-full border-4 border-white" />
          </div>
        </div>
      );

      return {
        id: Date.now(),
        text: `**Meet Makena - Your AI Shopping Assistant!** ✨\n\n**Who I Am:**\nI'm Makena, your intelligent shopping companion at Flowtechs! I'm here 24/7 to make your shopping experience absolutely amazing! 🛍️💫\n\n**My Personality:**\n• 😊 **Friendly & Approachable**: Always here with a smile and positive energy\n• 🧠 **Smart & Helpful**: I understand your needs and provide personalized assistance\n• ⚡ **Fast & Efficient**: Quick responses and instant solutions\n• 🎯 **Goal-Oriented**: Focused on helping you find exactly what you need\n• 💖 **Customer-Focused**: Your satisfaction is my top priority\n\n**What I Can Do:**\n• 🔍 **Product Discovery**: Find the perfect products for you\n• 📦 **Order Management**: Track orders and manage deliveries\n• 💡 **Smart Recommendations**: Suggest products based on your preferences\n• 🎧 **Customer Support**: Help with any questions or issues\n• 🏷️ **Deal Hunting**: Find the best prices and discounts\n• 💳 **Payment Assistance**: Guide you through payment options\n• 🚚 **Delivery Info**: Provide shipping and delivery details\n• 📱 **Account Help**: Assist with login, registration, and account issues\n\n**My Special Features:**\n• 🌍 **Nationwide Knowledge**: I know all 47 counties in Kenya for delivery\n• ⏰ **Time-Aware**: I understand your timezone and business hours\n• 🎨 **Personalized**: I remember your preferences and shopping history\n• 🚀 **Always Learning**: I continuously improve to serve you better\n\n**Why Choose Me:**\n• 🎯 **Accuracy**: I provide precise, up-to-date information\n• 💬 **Natural Conversation**: I chat like a real person, not a robot\n• 🎁 **Proactive**: I suggest helpful options you might not have considered\n• 🛡️ **Reliable**: You can always count on me for accurate information\n\n**I'm not just a chatbot - I'm your shopping bestie!** 💫\n\nWhat would you like to explore today? I'm excited to help you discover amazing products! 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
        type: 'profile',
        components: [<MakenaProfileImage key="makena-profile-img" />]
      };
    }

    // Handle company description queries
    if (message.includes("describe your company") || message.includes("tell me about your company") || 
        message.includes("what is flowtech") || message.includes("what is flowtechs") || 
        message.includes("about your business") || message.includes("your company") ||
        message.includes("company info") || message.includes("business info") ||
        message.includes("learn about flowtechs") || message.includes("tell me about flowtechs")) {
      return {
        id: Date.now(),
        text: `🌟 **Welcome to the Amazing World of Flowtechs!** ✨\n\n**🎬 Our Story - The Beginning:**\nPicture this: 2025, two passionate young developers, Eric Omondi and Steve Leo, sitting in a coffee shop in Nairobi, dreaming big! They saw a gap in the Kenyan e-commerce landscape and decided to bridge it with technology, innovation, and a whole lot of heart! 💝\n\n**🚀 What We Do - The Flowtechs Magic:**\nWe're not just another online store - we're your **digital shopping revolution**! Here's what makes us special:\n\n**🛍️ The Flowtechs Experience:**\n• 🎯 **Curated Excellence**: We handpick every product like we're shopping for our own family\n• 💎 **Quality Guaranteed**: Only the best makes it to our virtual shelves\n• 🚀 **Lightning Fast**: From click to doorstep in record time\n• 🛡️ **100% Secure**: Your safety is our top priority\n• 💖 **Personal Touch**: We treat every customer like VIP royalty\n\n**🎪 Our Product Universe:**\n• 📱 **Tech Wonderland**: Latest gadgets that make life easier\n• 👗 **Fashion Forward**: Trendy styles that make you shine\n• 🎮 **Gaming Paradise**: Everything for the ultimate gaming experience\n• 🏃 **Fitness Revolution**: Gear that transforms your workout\n• 📚 **Knowledge Hub**: Books and learning materials for growth\n• 🏠 **Home Sweet Home**: Everything to make your space perfect\n• 🎁 **Gift Gallery**: Perfect presents for every occasion\n\n**💫 The Flowtechs Difference:**\n• 🌍 **Nationwide Reach**: We deliver to all 47 counties - no place is too far!\n• ⚡ **Speed Demons**: 2-5 day delivery across Kenya\n• 💰 **Best Prices**: We negotiate hard so you don't have to\n• 🎁 **Loyalty Rewards**: Earn points with every purchase\n• 🔄 **Easy Returns**: 30-day hassle-free returns\n• 🎧 **24/7 Support**: We're here whenever you need us\n• 🔒 **Multiple Payments**: Mpesa, cards, bank transfer - you choose!\n\n**🏆 Why Customers Love Us:**\n• ⭐ **Trusted by Thousands**: Join our happy customer family\n• 🏅 **Award-Winning Service**: Recognized for excellence\n• 💬 **Real People**: No robots, just friendly humans ready to help\n• 🌟 **Innovation First**: Always finding new ways to serve you better\n• 🤝 **Community Focus**: Supporting local businesses and growth\n\n**🎯 Our Mission:**\nTo democratize quality shopping in Kenya! We believe every Kenyan deserves access to amazing products at fair prices, no matter where they live. We're building bridges between quality products and happy customers! 🌉\n\n**🔮 Our Vision:**\nTo become Kenya's most beloved e-commerce platform - the place where shopping dreams come true! We want to be the first name that comes to mind when anyone thinks of online shopping in Kenya! 🇰🇪\n\n**💝 Our Values:**\n• 💎 **Quality First**: We never compromise on quality\n• 🤝 **Customer Obsession**: Your happiness drives everything we do\n• 🚀 **Innovation**: Always pushing boundaries and improving\n• 🌍 **Accessibility**: Making shopping easy for everyone\n• 🔒 **Trust**: Building lasting relationships through transparency\n• 💖 **Community**: Supporting and growing together\n\n**🎊 The Flowtechs Promise:**\nWhen you shop with us, you're not just buying products - you're joining a movement! A movement towards better shopping, better service, and a better Kenya! 🇰🇪✨\n\n**Ready to experience the Flowtechs magic?** Let me help you discover amazing products that will make your life better! 🛍️💫\n\n**What would you like to explore first?** I'm here to guide you through our amazing world! 🌟`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle "what does the 's' stand for" or "what does flowtechs mean" queries
    if (message.includes("what does the s stand for") || message.includes("what does flowtechs mean") || message.includes("why flowtechs") || 
        message.includes("what does flowtechs stand for") || message.includes("why the s") ||
        message.includes("what's the s for") || message.includes("s in flowtechs") ||
        message.includes("flowtechs meaning") || message.includes("flowtechs full name")) {
      return {
        id: Date.now(),
        text: `🤔 **Ah, the Mysterious "S" Question!** 😄\n\n**🎭 The Big Reveal:**\nDrumroll please... 🥁\n\n**Flowtechs** stands for **"Flowtechsolutions"**! 🎉\n\n**🤯 Why "Solutions"?**\nWell, we're not just selling stuff - we're solving problems! Here's the genius behind it:\n\n**💡 The "Solutions" Philosophy:**\n• 🛍️ **Shopping Problems** → We solve them with amazing products\n• 🚚 **Delivery Problems** → We solve them with lightning-fast shipping\n• 💰 **Price Problems** → We solve them with the best deals\n• 🛡️ **Trust Problems** → We solve them with 100% security\n• 🎧 **Support Problems** → We solve them with 24/7 help\n• 🌍 **Access Problems** → We solve them with nationwide delivery\n\n**🎪 Fun Fact:**\nEric and Steve were originally going to call it "Flowtech" but then they realized...\n\n*"Wait, we're not just a tech company - we're a SOLUTION company!"* 💡\n\nSo they added the "s" and boom! **Flowtechsolutions** was born! 🚀\n\n**😎 The "S" Also Stands For:**\n• **S**uperior service\n• **S**mart shopping\n• **S**wift delivery\n• **S**ecure payments\n• **S**atisfied customers\n• **S**olutions for everything!\n\n**🎯 Bottom Line:**\nWe don't just sell products - we provide **complete shopping solutions** that make your life easier! That's why we're not just Flowtech, we're **Flowtechsolutions**! 💪✨\n\n**Pretty clever, right?** 😏 Now, what shopping problem can I solve for you today? 🛍️💫`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (message.includes("what is my name") || message.includes("what's my name") || message.includes("my name")) {
      if (isAuthenticated && userData) {
        return {
          id: Date.now(),
          text: `Your name is ${userData.name || userData.username}! 😊✨ It's great to see you again! How can I help you with your shopping today? 🛍️`,
          sender: "bot",
          timestamp: new Date(),
        };
      } else {
        return {
          id: Date.now(),
          text: "I'd love to know your name! 😊 You can log in to your account so I can personalize your experience, or just tell me what you'd like to call yourself! 💫",
          sender: "bot",
          timestamp: new Date(),
        };
      }
    }

    // Handle product-related queries
    if (message.includes("product") || message.includes("item") || message.includes("buy") || 
        message.includes("purchase") || message.includes("shop") || message.includes("find") ||
        message.includes("deals") || message.includes("discount") || message.includes("sale") ||
        message.includes("new") || message.includes("latest") || message.includes("arrivals") ||
        message.includes("top rated") || message.includes("best") || message.includes("popular") ||
        message.includes("search") || message.includes("look for")) {
      return getProductSearchResponse(message);
    }

    // Handle simple acknowledgments
    if (message === "ok" || message === "okay" || message === "k" || message === "alright") {
      return {
        id: Date.now(),
        text: "Great! 😊 What would you like to explore today? I'm here to help you find amazing products, track orders, or answer any questions you might have! 🛍️✨",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Enhanced order status and tracking functionality
    if (message.includes("order") || message.includes("orders") || message.includes("track") || message.includes("tracking")) {
      return getOrderStatusResponse(message);
    }

    // Handle delivery location and cost queries
    const locationKeywords = ['deliver to', 'ship to', 'delivery cost', 'shipping cost', 'shipping fee', 'how much to deliver', 'cost to'];
    const hasLocationKeyword = locationKeywords.some(keyword => message.includes(keyword));
    const mentionedLocation = counties.some(c => 
        message.includes(c.name.toLowerCase()) || 
        c.towns.some((t: string) => message.includes(t.toLowerCase()))
    );

    if (hasLocationKeyword || (mentionedLocation && (message.includes('deliver') || message.includes('shipping')))) {
        return getDeliveryLocationResponse(message);
    }

    // Handle payment-related queries
    if (message.includes("payment") || message.includes("pay") || message.includes("money") || 
        message.includes("price") || message.includes("cost") || message.includes("expensive")) {
      return getPaymentHelpResponse(message);
    }

    // Handle delivery and shipping queries
    if (message.includes("deliver") || message.includes("delivery") || message.includes("shipping") || 
        message.includes("when will") || message.includes("what time") || message.includes("how long") ||
        message.includes("delivery time") || message.includes("shipping time") || message.includes("arrive") ||
        message.includes("get here") || message.includes("receive")) {
      return getDeliveryTimeResponse(message);
    }

    // Handle page knowledge and navigation queries
    const pageKnowledgeResponse = getPageKnowledgeResponse(message);
    if (pageKnowledgeResponse) {
      return pageKnowledgeResponse;
    }

    // Handle complaints and customer service issues
    if (message.includes("complain") || message.includes("complaint") || message.includes("file") || 
        message.includes("report") || message.includes("issue") || message.includes("problem") ||
        message.includes("unhappy") || message.includes("dissatisfied") || message.includes("wrong") ||
        message.includes("bad") || message.includes("terrible") || message.includes("awful")) {
      return getComplaintResponse(message);
    }

    // Handle refund and return requests
    if (message.includes("refund") || message.includes("return") || message.includes("money back") || 
        message.includes("get my money back") || message.includes("cancel order") || message.includes("send back") ||
        message.includes("exchange") || message.includes("replace") || message.includes("wrong item") ||
        message.includes("defective") || message.includes("broken") || message.includes("damaged") ||
        message.includes("not working") || message.includes("faulty") || message.includes("spoilt") ||
        message.includes("i want to return") || message.includes("want to return") || message.includes("need to return") ||
        message.includes("return item") || message.includes("return product") || message.includes("return order")) {
      return getRefundResponse(message);
    }

    // Handle contact requests for returns and refunds
    if (message.includes("contact") && (message.includes("return") || message.includes("refund") || 
        message.includes("complain") || message.includes("issue") || message.includes("problem"))) {
      return getReturnContactResponse(message);
    }

    // Default fallback response with better context
    return getFallbackResponse(message);
  };

  // Enhanced problem help response
  const getProblemHelpResponse = (message: string): Message => {
    const ProblemHelpCard = () => (
      <div className="space-y-4 mt-3">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">🆘 I'm Here to Help!</h4>
          <p className="text-sm text-gray-600">
            Don't worry, I can help you solve any issues you're experiencing!
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">Order Issues</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Problems with orders, tracking, or delivery</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-800">Payment Problems</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Issues with payments, refunds, or billing</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-800">Shopping Issues</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Problems finding products or using the site</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-800">Account Issues</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Login, registration, or account problems</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate('/contact')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-orange-700 transition-colors"
          >
            Contact Support
          </button>
          <button 
            onClick={() => navigate('/help')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
          >
            Help Center
          </button>
        </div>
      </div>
    );

      return {
        id: Date.now(),
      text: "I'm sorry you're experiencing an issue! 😔 Don't worry, I'm here to help you solve it! 🛠️✨\n\n**What type of problem are you having?**\n\n• 📦 **Order Issues**: Problems with orders, tracking, or delivery\n• 💳 **Payment Problems**: Issues with payments, refunds, or billing\n• 🛍️ **Shopping Issues**: Problems finding products or using the site\n• 👤 **Account Issues**: Login, registration, or account problems\n\n**How can I help?**\n• 🔍 I can help you track orders\n• 💡 Guide you through the shopping process\n• 🎧 Connect you with customer support\n• 📋 Help you find specific products\n\nJust tell me more about what's happening, and I'll guide you to the right solution! 💪\n\nWhat specific issue are you facing? 🤔",
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<ProblemHelpCard key="problem-help" />]
    };
  };

  // Product help response
  const getProductHelpResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();
    
    // Get actual categories from products data
    const actualCategories = Array.from(
      new Set(
        products
          .map(product => product.category?.name)
          .filter(Boolean)
          .sort()
      )
    );

    // Get product statistics
    const totalProducts = products.length;
    const categoriesCount = actualCategories.length;
    const discountedProducts = products.filter(p => p.discount && p.discount > 0);
    const newArrivals = products.filter(p => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(p.created_at) > thirtyDaysAgo;
    });
    const topRated = products
      .filter(product => product.rating && product.rating > 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);

    // If asking about "your products" specifically
    if (messageLower.includes("your products") || messageLower.includes("what products") || messageLower.includes("what do you sell") || messageLower.includes("which products do you have")) {
      return {
        id: Date.now(),
        text: `🛍️ **Welcome to Flowtechs - Your Premium Shopping Destination!** ✨\n\nI'm excited to show you our amazing collection! We have **${totalProducts} premium products** across **${categoriesCount} categories** for you to explore! 🎉\n\n**📦 Our Product Categories:**\n${actualCategories.map(cat => `• 🎯 ${cat}`).join('\n')}\n\n**🌟 What Makes Us Special:**\n• 🆕 **${newArrivals.length} New Arrivals**: Fresh products added regularly\n• 🏷️ **${discountedProducts.length} Active Deals**: Save money on quality products\n• ⭐ **Top-Rated Products**: Customer favorites with excellent reviews\n• 🚀 **Premium Quality**: Only the best brands and products\n• 💎 **Exclusive Items**: Unique products you won't find elsewhere\n\n**🔥 Popular Categories:**\n${actualCategories.slice(0, 5).map(cat => `• 📱 ${cat}`).join('\n')}\n\n**⭐ Customer Favorites:**\n${topRated.map(product => 
          `• ${product.name} - ${formatCurrency(product.price)} ⭐ ${product.rating?.toFixed(1)}`
        ).join('\n')}\n\n**💡 How I Can Help You:**\n• 🔍 **Find Specific Products**: Tell me what you're looking for\n• 📂 **Browse Categories**: Explore by product type\n• 💰 **Best Deals**: Show you discounted items\n• ⭐ **Top Rated**: Customer favorites\n• 🆕 **New Arrivals**: Latest additions\n• 🚀 **Trending**: Popular products\n• 💎 **Premium Picks**: Our staff recommendations\n\n**🎯 Just tell me:**\n• What category interests you?\n• What specific product are you looking for?\n• Do you want to see deals?\n• Show me new arrivals?\n• What's your budget?\n\n**I'm here to help you discover exactly what you need!** 🛍️💫\n\n**Ready to start shopping?** What catches your eye? 😊`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // If asking about specific categories
    if (actualCategories.some(cat => cat && messageLower.includes(cat.toLowerCase()))) {
      const matchingCategory = actualCategories.find(cat => 
        cat && messageLower.includes(cat.toLowerCase())
      );
      
      if (matchingCategory) {
        const categoryProducts = products.filter(p => 
          p.category?.name === matchingCategory
        );
        const categoryCount = categoryProducts.length;
        const categoryDeals = categoryProducts.filter(p => p.discount && p.discount > 0);
        const categoryTopRated = categoryProducts
          .filter(p => p.rating && p.rating > 4)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);
        
        return {
          id: Date.now(),
          text: `📦 **${matchingCategory} Collection** ✨\n\nWe have **${categoryCount} amazing ${matchingCategory} products** for you! 🎉\n\n**What's Available in ${matchingCategory}:**\n• 🆕 **${newArrivals.filter(p => p.category?.name === matchingCategory).length} New Arrivals**\n• 🏷️ **${categoryDeals.length} Active Deals** with great savings\n• ⭐ **${categoryTopRated.length} Top-Rated Items** with excellent reviews\n• 🚀 **Premium Quality** ${matchingCategory} products\n\n**🔥 Popular ${matchingCategory} Items:**\n${categoryTopRated.map(product => 
            `• 📱 ${product.name} - ${formatCurrency(product.price)} ⭐ ${product.rating?.toFixed(1)}`
          ).join('\n')}\n\n**💰 Best ${matchingCategory} Deals:**\n${categoryDeals.slice(0, 3).map(product => 
            `• 🏷️ ${product.name} - ${formatCurrency(product.price)} (${product.discount}% OFF)`
          ).join('\n')}\n\n**Want to explore more?** I can:\n• 🔍 Show you all ${matchingCategory} products\n• 💰 Find the best deals in ${matchingCategory}\n• ⭐ Show top-rated ${matchingCategory} items\n• 🆕 Show new ${matchingCategory} arrivals\n• 💎 Recommend premium ${matchingCategory} picks\n\n**Just say the word and I'll help you discover the perfect ${matchingCategory} products!** 🛍️✨`,
          sender: "bot",
          timestamp: new Date(),
        };
      }
    }

    // Enhanced interactive product discovery response
    const ProductDiscoveryCard = () => (
      <div className="space-y-4 mt-3">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">🛍️ Let's Discover Amazing Products!</h4>
          <p className="text-sm text-gray-600">
            I have access to {totalProducts} premium products across {categoriesCount} categories. Here's how I can help you find exactly what you need:
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">Smart Search</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Tell me what you're looking for and I'll find it</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-800">Best Deals</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{discountedProducts.length} products with great discounts</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-800">Top Rated</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Customer favorites with excellent reviews</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-800">New Arrivals</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{newArrivals.length} fresh products just added</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <h6 className="font-medium text-yellow-800 mb-1">💡 Quick Start Suggestions</h6>
          <p className="text-sm text-yellow-700">
            Try asking me: "Show me electronics", "Find deals under Ksh 10,000", "What's new today?", or "Recommend something popular"
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate('/store')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 transition-colors"
          >
            Browse Store
          </button>
          <button 
            onClick={() => navigate('/shopping-cart')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 transition-colors"
          >
            View Cart
          </button>
        </div>
      </div>
    );

    // General product help with enhanced information
    return {
      id: Date.now(),
      text: `🛍️ **Let's Find Your Perfect Products!** ✨\n\nHi there! I'm Makena, and I'm excited to help you discover amazing products at Flowtechs! 🎉\n\n**📊 What I Know About Our Store:**\n• 📦 **${totalProducts} Premium Products** available right now\n• 🎯 **${categoriesCount} Product Categories** to explore\n• 🏷️ **${discountedProducts.length} Active Deals** with great savings\n• 🆕 **${newArrivals.length} New Arrivals** just added\n• ⭐ **Top-Rated Products** with excellent customer reviews\n\n**🔍 How I Can Help You Find Products:**\n• **Smart Search**: Tell me what you're looking for (e.g., "laptops", "gaming gear")\n• **Category Browsing**: Explore by product type (e.g., "show me electronics")\n• **Deal Hunting**: Find the best prices and discounts\n• **New Discoveries**: See the latest arrivals and trending items\n• **Personal Recommendations**: Get suggestions based on your interests\n• **Budget Shopping**: Find products within your price range\n\n**🎯 Popular Categories Available:**\n${actualCategories.slice(0, 4).map(cat => `• 📱 ${cat}`).join('\n')}\n\n**⭐ Customer Favorites:**\n${topRated.map(product => 
          `• ${product.name} - ${formatCurrency(product.price)} ⭐ ${product.rating?.toFixed(1)}`
        ).join('\n')}\n\n**💡 Just Tell Me:**\n• "Show me [category]" (e.g., "show me electronics")\n• "Find [product]" (e.g., "find laptops")\n• "What's new today?"\n• "Show me deals"\n• "Recommend something under [price]"\n• "What's popular?"\n\n**I'm here to make your shopping experience amazing!** What would you like to explore? 🛍️💫`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<ProductDiscoveryCard key="product-discovery" />]
    };
  };

  // Payment help response
  const getPaymentHelpResponse = (message: string): Message => {
    return {
      id: Date.now(),
      text: "I can help you with all payment-related questions! 💳✨\n\n**Payment Options Available:**\n• 📱 Mpesa\n• 📞 Airtel Money\n• 🏦 EcoBank\n• 💳 Visa/MasterCard\n\n**What do you need help with?**\n• 💰 Payment methods\n• 💸 Refunds\n• 📊 Billing questions\n• 🔒 Payment security\n\nJust let me know what specific payment issue you're facing! 💪",
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Support help response
  const getSupportHelpResponse = (message: string): Message => {
    return {
      id: Date.now(),
      text: "I'm here to connect you with our amazing support team! 🎧✨\n\n**How can I help you get support?**\n\n• 📞 **Phone Support**: Call us at +254 117 802 561\n• 📧 **Email Support**: flowtechs254@gmail.com\n• 💬 **Live Chat**: Available during business hours\n• 📱 **WhatsApp**: +254 117 802 561\n\n**Support Hours:**\nMonday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 4:00 PM\n\nWhat's the best way to reach you? 🤝",
      sender: "bot",
      timestamp: new Date(),
    };
  };

  const getRandomResponse = (category: keyof typeof personalityResponses): string => {
    const responses = personalityResponses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Enhanced confirmation handling with actual API calls
  const handleConfirmation = (confirmed: boolean): Message => {
    const action = awaitingConfirmation;
    setAwaitingConfirmation(null);

    if (!confirmed) {
      return {
        id: Date.now(),
        text: "No worries at all! 😊 Canceled that action. What else can I help you with today? 🤗",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (action?.type === 'cancel_order') {
      return {
        id: Date.now(),
        text: "Perfect! I've processed the cancellation request! 🎉 You should see the changes in your order status shortly. Is there anything else I can help you with? 😊",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (action?.type === 'confirm_orders') {
      return {
        id: Date.now(),
        text: "Awesome! I've confirmed all your pending orders! 🚀 They're now being processed and will be shipped soon. You'll get updates on the tracking! 📦✨",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    return {
      id: Date.now(),
      text: "Done! ✅ That's been taken care of! What else can I do for you today? 😊",
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Enhanced order status and tracking functionality
  const getOrderStatusResponse = (message: string): Message => {
    if (!isAuthenticated) {
      return {
        id: Date.now(),
        text: "🚀 **Order Tracking Help** 📦✨\n\nI'd love to help you track your orders! But first, you'll need to **log in** so I can access your order history. Once you're logged in, I can show you:\n\n• 📊 Real-time order status updates\n• 🚚 Delivery tracking information\n• 📋 Complete order history\n• 💳 Payment status\n• 📞 Customer support for orders\n\n**Login Benefits:**\n✅ Personalized order tracking\n✅ Order cancellation options\n✅ Delivery notifications\n✅ Order history access\n\nJust log in and I'll have your complete order dashboard ready! 🔐💫",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (userOrders.length === 0) {
      return {
        id: Date.now(),
        text: "🛍️ **No Orders Yet - Let's Start Shopping!** ✨\n\nYou don't have any orders yet, but that's totally fine! Let's change that and start your amazing shopping journey! 🚀\n\n**What interests you most?**\n• 📱 Electronics & Gadgets\n• 👗 Fashion & Clothing\n• 🎮 Gaming & Entertainment\n\nI can help you discover amazing products, find the best deals, and make your first purchase! What category catches your eye? 💫",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Extract order number from message if mentioned
    const orderNumberMatch = message.match(/order\s*(?:#|number\s*)?(\d+)/i);
    const specificOrderId = orderNumberMatch ? parseInt(orderNumberMatch[1]) : null;

    if (specificOrderId) {
      const order = userOrders.find(o => o.order_id === specificOrderId);
      if (!order) {
        return {
          id: Date.now(),
          text: `🔍 **Order #${specificOrderId} Not Found** 🤔\n\nI couldn't find order #${specificOrderId} in your account. Here are a few things to check:\n\n**Possible Reasons:**\n• 📝 Order number might be incorrect\n• ⏰ Order might be from a different account\n• 🗑️ Order might have been cancelled\n• 📅 Order might be older than our records\n\n**What I can help you with:**\n• 📋 Show all your recent orders\n• 🔍 Help you find the correct order number\n• 📞 Contact customer support\n• 🛍️ Start a new order\n\nWould you like me to show you all your recent orders instead? 📦✨`,
          sender: "bot",
          timestamp: new Date(),
        };
      }
      return getDetailedOrderStatus(order);
    }

    // Show all orders summary with enhanced information
    const OrderSummaryCard = ({ orders }: { orders: any[] }) => {
      const statusCounts: Record<string, number> = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
          case 'processing': return <Package className="w-4 h-4 text-blue-500" />;
          case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />;
          case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
          default: return <Package className="w-4 h-4 text-gray-500" />;
        }
      };

      const getStatusColor = (status: string) => {
        switch (status) {
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          case 'processing': return 'bg-blue-100 text-blue-800';
          case 'delivered': return 'bg-green-100 text-green-800';
          case 'cancelled': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      };

      return (
        <div className="space-y-4 mt-3">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">📦 Your Order Tracking Dashboard</h4>
            <p className="text-sm text-gray-600">
              You have {orders.length} order{orders.length !== 1 ? 's' : ''} in your account. Here's your order summary:
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-3">📊 Order Status Overview</h5>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span className="text-sm text-gray-600 capitalize">{status}</span>
                  </div>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <h5 className="font-semibold text-gray-800">🚚 Recent Orders</h5>
            {orders.slice(0, 5).map((order) => (
              <div key={order.order_id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="font-semibold text-sm text-gray-800">Order #{order.order_id}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.datetime).toLocaleDateString()} • Ksh {order.total?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => navigate(`/order-details/${order.order_id}`)}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
                  >
                    📋 View Details
                  </button>
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => handleOrderCancellation(`cancel order ${order.order_id}`)}
                      className="py-2 px-3 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                    >
                      ❌ Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {orders.length > 5 && (
            <div className="text-center">
              <button 
                onClick={() => navigate('/orders')}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
              >
                📋 View All {orders.length} Orders
              </button>
            </div>
          )}
          
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <h6 className="font-medium text-green-800 mb-1">💡 Need Help?</h6>
            <p className="text-sm text-green-700">
              I can help you track specific orders, cancel pending orders, or answer any questions about your deliveries!
            </p>
          </div>
        </div>
      );
    };

    return {
      id: Date.now(),
      text: `🚀 **Order Tracking Dashboard Ready!** 📦✨\n\nI've pulled up your complete order information! You have **${userOrders.length} order${userOrders.length !== 1 ? 's' : ''}** in your account with real-time status updates. Here's your personalized tracking dashboard where you can:\n\n• 📊 See order status overview\n• 🚚 Track recent deliveries\n• 📋 View detailed order information\n• ❌ Cancel pending orders (if needed)\n• 💡 Get help with any order questions\n\nEverything you need to stay updated on your purchases! 🎉`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<OrderSummaryCard key="summary" orders={userOrders} />]
    };
  };

  const getDetailedOrderStatus = (order: any): Message => {
    const getStatusStep = (status: string) => {
      switch (status) {
        case 'pending': return 1;
        case 'processing': return 2;
        case 'delivered': return 3;
        case 'cancelled': return 0;
        default: return 1;
      }
    };

    const currentStep = getStatusStep(order.status);
    const isCancelled = order.status === 'cancelled';

    const OrderTrackingCard = ({ order }: { order: any }) => (
      <div className="space-y-4 mt-3">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Order #{order.order_id}</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">Ksh {order.total?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date:</span>
              <span>{new Date(order.datetime).toLocaleDateString()}</span>
            </div>
            {order.completed_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivered:</span>
                <span>{new Date(order.completed_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {!isCancelled && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-3">📦 Delivery Progress</h5>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs mt-1">Order Placed</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-xs mt-1">Processing</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-xs mt-1">Delivered</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button 
            onClick={() => navigate(`/order-details/${order.order_id}`)}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
          >
            View Full Details
          </button>
          {order.status === 'pending' && (
            <button 
              onClick={() => handleOrderCancellation(`cancel order ${order.order_id}`)}
              className="py-2 px-4 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    );

    const statusMessages = {
      pending: "Your order is confirmed and waiting to be processed! ⏳",
      processing: "Your order is being prepared and will be shipped soon! 📦",
      delivered: "Your order has been successfully delivered! 🎉",
      cancelled: "This order has been cancelled. 😔"
    };

    return {
      id: Date.now(),
      text: statusMessages[order.status as keyof typeof statusMessages] || "Here's your order status:",
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<OrderTrackingCard key="tracking" order={order} />]
    };
  };

  // Enhanced order management with actual API calls
  const handleOrderCancellation = (message: string): Message => {
    if (!isAuthenticated) {
      return {
        id: Date.now(),
        text: "Oops! 😅 You'll need to log in first so I can access your orders. Once you're logged in, I can help you cancel any order that's still pending! 🔐",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    const cancelableOrders = userOrders.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    );

    if (cancelableOrders.length === 0) {
      return {
        id: Date.now(),
        text: "Good news! 😊 You don't have any orders that can be cancelled right now. All your orders are either completed or already on their way to you! 📦✨",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    const orderList = cancelableOrders.map(order => 
      `📦 Order #${order.order_id} - Ksh ${order.total?.toLocaleString()} (${order.status})`
    ).join('\n');

    setAwaitingConfirmation({
      type: 'cancel_order',
      orders: cancelableOrders
    });

    return {
      id: Date.now(),
      text: `Here are your orders that can still be cancelled:\n\n${orderList}\n\nWhich order would you like to cancel? Just give me the order number! 🤔`,
      sender: "bot",
      timestamp: new Date(),
      type: "confirmation"
    };
  };

  // Enhanced quick actions based on context and user behavior
  const getQuickActions = (): string[] => {
    const baseActions = [
      "Show me popular products 🔥",
      "What's new today? ✨",
      "Help me find gaming gear 🎮",
      "Recommend something under Ksh 20,000 💰",
    ];

    const authenticatedActions = [
      "Check my orders 📦",
      "What's in my wishlist? ❤️",
      "Any pending reviews? ⭐",
      "Cancel an order ❌",
    ];

    const contextualActions = [];

    // Add deal-related actions if there are discounted products
    const discountedProducts = products.filter(p => p.discount && p.discount > 0);
    if (discountedProducts.length > 0) {
      contextualActions.push("Show me today's deals 🏷️");
    }

    // Add category-specific actions based on popular categories
    const popularCategories = categories.slice(0, 3);
    popularCategories.forEach(cat => {
      contextualActions.push(`Browse ${cat.name} 📱`);
    });

    // Add user-specific actions based on their behavior
    if (isAuthenticated && userOrders.length > 0) {
      const recentOrder = userOrders[0];
      if (recentOrder.status === 'pending') {
        contextualActions.push("Track my recent order 🚚");
      }
    }

    // Add seasonal or time-based actions
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 17) {
      contextualActions.push("Contact customer support 🎧");
    }

    const allActions = [
      ...baseActions.slice(0, 2),
      ...contextualActions.slice(0, 2),
      ...(isAuthenticated ? authenticatedActions.slice(0, 2) : []),
      ...baseActions.slice(2),
      ...(isAuthenticated ? authenticatedActions.slice(2) : []),
      "Tell me about returns 🔄",
      "What's your best deal? 🏷️",
      "Help with payment 💳",
    ];

    return allActions.slice(0, 8); // Limit to 8 actions for better UX
  };

  // Enhanced quick action handler with more intelligent responses
  const handleQuickAction = (action: string): void => {
    const cleanAction = action.replace(/[🔥✨🎮💰📦❤️⭐❌🔄🏷️📱🚚🎧💳]/g, '').trim();
    
    // Map quick actions to specific responses
    const actionMap: Record<string, string> = {
      'Show me popular products': 'show me popular products',
      "What's new today": 'show me new arrivals',
      'Help me find gaming gear': 'show me gaming products',
      'Recommend something under Ksh 20,000': 'recommend products under 20000',
      'Check my orders': 'check my order status',
      "What's in my wishlist": 'show me my wishlist',
      'Any pending reviews': 'check my pending reviews',
      'Cancel an order': 'cancel my order',
      "Show me today's deals": 'show me discounted products',
      'Browse': 'show me',
      'Track my recent order': 'track my order',
      'Contact customer support': 'help me contact support',
      'Tell me about returns': 'what is your return policy',
      "What's your best deal": 'show me your best deals',
      'Help with payment': 'help me with payment options'
    };

    const mappedAction = actionMap[cleanAction] || cleanAction;
    setInputMessage(mappedAction);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse = getBotResponse(inputMessage);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced delivery time response with detailed information
  const getDeliveryTimeResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();
    
    // Check if user is asking about a specific order
    const orderNumberMatch = message.match(/order\s*(?:#|number\s*)?(\d+)/i);
    const specificOrderId = orderNumberMatch ? parseInt(orderNumberMatch[1]) : null;
    
    if (specificOrderId && isAuthenticated) {
      const order = userOrders.find(o => o.order_id === specificOrderId);
      if (order) {
        return getSpecificOrderDeliveryInfo(order);
      }
    }

    // Check if user is asking about specific timing
    if (messageLower.includes("what time") || messageLower.includes("when will")) {
      return {
        id: Date.now(),
        text: `🕐 **Delivery Timing Information** 📦\n\n**Standard Delivery Times:**\n• 📅 **Processing Time**: 24 hours\n• 🚚 **Delivery Time**: 2-5 business days\n• 🕐 **Delivery Hours**: 8:00 AM - 8:00 PM (Mon-Fri)\n\n**Express Options:**\n• ⚡ **Express Delivery**: 1-2 business days (+Ksh 500)\n• 🚀 **Same Day**: Available in Nairobi (+Ksh 1,000)\n\n**Weekend Delivery:**\n• 📅 **Saturday**: 9:00 AM - 6:00 PM\n• 🌅 **Sunday**: 10:00 AM - 4:00 PM\n\n**Need to track a specific order?** Just give me your order number! 📋✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // General delivery information
      return {
        id: Date.now(),
      text: `🚚 **Delivery Information** 📦✨\n\n**Our Delivery Options:**\n\n• 📦 **Standard Delivery**: 2-5 business days\n• ⚡ **Express Delivery**: 1-2 business days (+Ksh 500)\n• 🚀 **Same Day Delivery**: Available in Nairobi (+Ksh 1,000)\n\n**Delivery Hours:**\n• 📅 Monday - Friday: 8:00 AM - 8:00 PM\n• 🌅 Saturday: 9:00 AM - 6:00 PM\n• 🌙 Sunday: 10:00 AM - 4:00 PM\n\n**Order Processing:**\n• ⏰ Orders are processed within 24 hours\n• 📱 You'll receive SMS updates on delivery status\n• 📍 Real-time tracking available\n\n**Need to track a specific order?** Just tell me your order number! 📋`,
        sender: "bot",
        timestamp: new Date(),
      };
  };

  const getSpecificOrderDeliveryInfo = (order: any): Message => {
    const getEstimatedDelivery = (orderDate: string, status: string) => {
      const orderDateTime = new Date(orderDate);
      const now = new Date();
      
      if (status === 'delivered') {
        return "✅ **Delivered**";
      }
      
      if (status === 'cancelled') {
        return "❌ **Order Cancelled**";
      }
      
      // Calculate estimated delivery based on order date
      const daysSinceOrder = Math.floor((now.getTime() - orderDateTime.getTime()) / (1000 * 60 * 60 * 24));
      
      if (status === 'pending') {
        const estimatedDelivery = new Date(orderDateTime.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
        return `📦 **Estimated Delivery**: ${estimatedDelivery.toLocaleDateString()} (2-5 business days)`;
      }
      
      if (status === 'processing') {
        const estimatedDelivery = new Date(orderDateTime.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days
        return `🚚 **Estimated Delivery**: ${estimatedDelivery.toLocaleDateString()} (1-2 business days)`;
      }
      
      return "📋 **Processing your order**";
    };

      return {
        id: Date.now(),
      text: `📦 **Order #${order.order_id} Delivery Information** 🚚\n\n**Order Status**: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\n**Order Date**: ${new Date(order.datetime).toLocaleDateString()}\n**Total Amount**: Ksh ${order.total?.toLocaleString()}\n\n${getEstimatedDelivery(order.datetime, order.status)}\n\n**Delivery Updates:**\n• 📱 You'll receive SMS updates at each stage\n• 📍 Real-time tracking available\n• 🎧 Contact support for immediate assistance\n\nNeed help with anything else? 😊`,
        sender: "bot",
        timestamp: new Date(),
      };
  };

  // Enhanced delivery location and cost response
  const getDeliveryLocationResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();
    
    const allCounties = counties.map(c => c.name.toLowerCase());
    const allTowns = counties.flatMap(c => c.towns.map((t: string) => t.toLowerCase()));

    const findLocation = () => {
        for (const county of allCounties) {
            if (messageLower.includes(county)) {
                return county;
            }
        }
        for (const town of allTowns) {
            if (messageLower.includes(town)) {
                return town;
            }
        }
        return null;
    }
    
    const mentionedLocation = findLocation();

    const getCostForLocation = (location: string): string => {
        const nairobiMetropolitan = ['nairobi', 'kiambu', 'kajiado', 'machakos'];
        const majorCities = ['mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'ruiru'];

        const countyInfo = counties.find(c => c.name.toLowerCase() === location || c.towns.some((t:string) => t.toLowerCase() === location));

        if (countyInfo && nairobiMetropolitan.includes(countyInfo.name.toLowerCase())) {
            return "Ksh 300 - Ksh 400 (Next-day delivery)";
        }
        if (countyInfo && majorCities.some(city => countyInfo.towns.map((t:string) => t.toLowerCase()).includes(city) || countyInfo.capital.toLowerCase() === city)) {
             return "Ksh 500 (1-2 business days)";
        }
        if (countyInfo) {
            return "Ksh 600 (2-5 business days)";
        }
        return "Ksh 600 (2-5 business days)";
    };

    if (mentionedLocation) {
        const cost = getCostForLocation(mentionedLocation);
        const locationName = mentionedLocation.charAt(0).toUpperCase() + mentionedLocation.slice(1);
    return {
      id: Date.now(),
            text: `✅ **Yes, we deliver to ${locationName}!** 🚚✨\n\n**Delivery Details for ${locationName}:**\n• **Estimated Cost**: ${cost}\n• **Delivery Time**: Varies based on location (1-5 days)\n\n**How to Order:**\n1. Add products to your cart\n2. Proceed to checkout\n3. Enter your full delivery address\n4. The exact shipping fee will be calculated for you.\n\nReady to shop for products to be delivered to ${locationName}? 🛍️`,
      sender: "bot",
      timestamp: new Date(),
        };
    }

    // General delivery location info
    return {
        id: Date.now(),
        text: `🚚 **Flowtechs Delivery Network** 🌍\n\nWe deliver to **all 47 counties** in Kenya! Wherever you are, we've got you covered. 🇰🇪\n\n**Delivery Costs:**\n• **Nairobi & Metropolitan**: Ksh 300 - Ksh 400\n• **Major Towns**: Ksh 500\n• **Other Regions**: From Ksh 600\n\n**How it works:**\nThe final delivery cost is calculated at checkout based on your exact location and the weight of your order.\n\n**Want to check a specific location?** Just ask me, for example: "Do you deliver to Nakuru?" or "What's the shipping cost to Mombasa?"`,
        sender: 'bot',
        timestamp: new Date(),
    };
  };

  // Enhanced complaint response with empathetic and helpful approach
  const getComplaintResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();
    
    // Check if user is asking about filing a complaint
    if (messageLower.includes("file") && (messageLower.includes("complain") || messageLower.includes("complaint"))) {
      return {
        id: Date.now(),
        text: `😔 **I'm Sorry You're Having an Issue** 💔\n\nI understand how frustrating this must be, and I want to help you resolve this as quickly as possible! 🤝✨\n\n**How to File a Complaint:**\n\n📝 **Option 1: Online Complaint Form**\n• Visit our website and fill out the complaint form\n• Include all relevant details and order numbers\n• Attach any supporting documents or photos\n\n📞 **Option 2: Direct Contact**\n• **Phone**: +254 117 802 561 (Priority Support)\n• **Email**: flowtechs254@gmail.com\n• **WhatsApp**: +254 117 802 561\n\n📱 **Option 3: Customer Service Portal**\n• Log into your account\n• Go to "Support" → "File Complaint"\n• Track your complaint status\n\n**What Information to Include:**\n• 📦 Order number (if applicable)\n• 📅 Date of the incident\n• 📋 Detailed description of the issue\n• 🎯 What resolution you're seeking\n• 📸 Any relevant photos or screenshots\n\n**Response Time:**\n• ⏰ **Urgent Issues**: Within 2 hours\n• 📅 **Standard Complaints**: Within 24 hours\n• 📊 **Complex Cases**: Within 48 hours\n\n**I'm here to help guide you through this process!** What type of issue are you experiencing? 🤔`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // General complaint handling
    return {
      id: Date.now(),
      text: `😔 **I'm So Sorry You're Unhappy** 💔\n\nYour satisfaction is our top priority, and I want to make this right for you! 🤝✨\n\n**Let me help you resolve this issue:**\n\n**What type of problem are you experiencing?**\n\n• 📦 **Order Issues**: Wrong items, damaged products, missing orders\n• 💳 **Payment Problems**: Overcharged, double billing, refund issues\n• 🚚 **Delivery Issues**: Late delivery, lost packages, delivery problems\n• 🛍️ **Service Issues**: Poor customer service, website problems\n• 📱 **Account Issues**: Login problems, account access issues\n• 🏷️ **Product Issues**: Defective items, quality problems\n\n**How I Can Help:**\n• 🔍 Help you identify the right department\n• 📞 Connect you with the right person\n• 📝 Guide you through the complaint process\n• ⚡ Escalate urgent issues\n• 📊 Track your complaint status\n\n**Immediate Actions:**\n• 🚨 **Urgent Issues**: Direct phone connection\n• 📧 **Standard Issues**: Email complaint form\n• 💬 **Quick Issues**: Live chat support\n\n**Please tell me more about your specific issue so I can get you the right help immediately!** 🎯\n\nWhat exactly happened? I'm listening and ready to help! 👂💫`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Enhanced refund and return response with detailed process
  const getRefundResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();
    
    // Check if user is asking about a specific order refund
    const orderNumberMatch = message.match(/order\s*(?:#|number\s*)?(\d+)/i);
    const specificOrderId = orderNumberMatch ? parseInt(orderNumberMatch[1]) : null;
    
    if (specificOrderId && isAuthenticated) {
      const order = userOrders.find(o => o.order_id === specificOrderId);
      if (order) {
        return getSpecificOrderRefundInfo(order);
      }
    }

    // Check for specific refund scenarios
    if (messageLower.includes("defective") || messageLower.includes("broken") || messageLower.includes("damaged") ||
        messageLower.includes("not working") || messageLower.includes("faulty") || messageLower.includes("spoilt")) {
      return {
        id: Date.now(),
        text: `😔 **I'm So Sorry About Your Broken Product** 💔\n\nWe take product quality very seriously, and I want to help you get this resolved immediately! 🔧✨\n\n**For Broken/Defective Products:**\n\n🚨 **Immediate Actions Required:**\n• 📸 **Take Clear Photos**: Show the damage/defect clearly\n• 📦 **Keep Original Packaging**: Don't throw away any boxes\n• 📱 **Contact Within 48 Hours**: For fastest resolution\n• 📋 **Don't Use Further**: Stop using the product\n\n**Your Guarantee:**\n• ✅ **100% Full Refund**: No questions asked\n• 🚚 **Free Return Shipping**: We cover all costs\n• ⚡ **Priority Processing**: 24-48 hour response\n• 💳 **Original Payment Method**: Money back to your account\n• 🎁 **Replacement Option**: Get a new item instead\n\n**What We Need From You:**\n• 📋 **Order Number**: To locate your purchase\n• 📸 **Clear Photos**: Front, back, and damage areas\n• 📅 **Delivery Date**: When you received it\n• 📝 **Detailed Description**: What's wrong with it\n• 🎯 **Your Preference**: Refund or replacement\n\n**Return Process:**\n1. 📞 Contact us with order number\n2. 📸 Send photos of the damage\n3. 📦 We'll send free return label\n4. 🚚 Package and ship back\n5. ✅ Refund within 3-5 days\n\n**Contact Options (Priority Support):**\n• 📞 **Phone**: +254 117 802 561 (24/7)\n• 📧 **Email**: flowtechs254@gmail.com\n• 💬 **Live Chat**: Available now\n• 📱 **WhatsApp**: +254 117 802 561\n\n**Quality Assurance:**\n• 🔍 We investigate every defective product\n• 🛠️ We work with suppliers to prevent future issues\n• 📊 We track defect rates to maintain quality\n• 🎯 Your feedback helps improve our products\n\n**I can help you start the return process right now!** What's your order number? 📦✨\n\n**Don't worry - we'll make this right for you!** 🤝💪`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (messageLower.includes("wrong item") || messageLower.includes("incorrect")) {
      return {
        id: Date.now(),
        text: `😅 **I'm Sorry About the Wrong Item** 🙏\n\nWe apologize for this mistake! Let's get you the correct item or a full refund right away! 🔄✨\n\n**For Wrong/Incorrect Items:**\n\n🔄 **Your Options:**\n• 💰 **Full Refund**: Get your money back\n• 📦 **Exchange**: Get the correct item\n• 🎁 **Keep + Partial Refund**: If you like the item\n\n**Process:**\n• ✅ **Free Return**: We cover all shipping costs\n• ⚡ **Fast Processing**: 24-48 hour response\n• 🚚 **Express Exchange**: Priority shipping for replacement\n\n**What We Need:**\n• 📋 Order number\n• 📸 Photo of what you received\n• 📝 Description of what you ordered\n• 🎯 Your preference (refund/exchange)\n\n**Contact:**\n• 📞 **Phone**: +254 117 802 561\n• 📧 **Email**: flowtechs254@gmail.com\n• 💬 **Live Chat**: Available now\n\n**Let me help you get this sorted!** What's your order number? 📦✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // General refund information
    return {
      id: Date.now(),
      text: `📦 **Return & Refund Information** 🔄✨\n\nI'm here to help you with your return request! Let's get this sorted out quickly and easily! 🤝\n\n**Our Return Policy:**\n\n⏰ **Return Window**: 30 days from delivery\n✅ **Full Refund**: 100% money back guarantee\n🚚 **Free Returns**: We cover return shipping\n⚡ **Fast Processing**: 3-5 business days\n\n**What You Can Return:**\n• 📦 Any item within 30 days\n• 🔧 Defective or damaged products\n• ❌ Wrong items received\n• 🎯 Items not as described\n• 📱 Electronics (unopened or defective)\n• 👗 Clothing that doesn't fit\n• 🏠 Home items in original condition\n\n**Return Requirements:**\n• 📦 Original packaging and accessories\n• 🎯 Product in original condition\n• 📋 Proof of purchase (order number)\n• 📸 Clear photos for defective items\n\n**Return Process:**\n1. 📞 Contact us with your order number\n2. 📸 Provide photos (if applicable)\n3. 📦 We'll send return shipping label\n4. 🚚 Ship item back to us\n5. ✅ Refund processed within 3-5 days\n\n**Payment Methods for Refunds:**\n• 💳 Credit/Debit Cards\n• 📱 Mpesa\n• 🏦 Bank Transfer\n• 💰 Store Credit\n\n**Need to start a return?** Just give me your order number! 📋✨\n\n**What's the reason for your return?** 🤔\n• 🔧 Defective/Broken\n• ❌ Wrong item received\n• 🎯 Not as described\n• 👗 Doesn't fit\n• 💭 Changed my mind\n• 📱 Other reason`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  const getSpecificOrderRefundInfo = (order: any): Message => {
    const getRefundEligibility = (order: any) => {
      const orderDate = new Date(order.datetime);
      const now = new Date();
      const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (order.status === 'cancelled') {
        return "❌ **Order Already Cancelled**";
      }
      
      if (daysSinceOrder > 30) {
        return "⏰ **Outside 30-Day Return Window**";
      }
      
      if (order.status === 'delivered') {
        return "✅ **Eligible for Refund**";
      }
      
      if (order.status === 'pending') {
        return "🔄 **Order Can Be Cancelled**";
      }
      
      return "📋 **Processing - Contact Support**";
    };

    const getRefundOptions = (order: any) => {
      if (order.status === 'pending') {
        return "🔄 **Cancel Order**: Get full refund immediately";
      }
      
      if (order.status === 'delivered') {
        return "💰 **Return & Refund**: 30-day return window";
      }
      
      return "📞 **Contact Support**: For assistance";
    };

    return {
      id: Date.now(),
      text: `📦 **Order #${order.order_id} Refund Information** 💰\n\n**Order Details:**\n• 📅 Order Date: ${new Date(order.datetime).toLocaleDateString()}\n• 💰 Total Amount: Ksh ${order.total?.toLocaleString()}\n• 📊 Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\n\n**Refund Eligibility:**\n${getRefundEligibility(order)}\n\n**Your Options:**\n${getRefundOptions(order)}\n\n**Next Steps:**\n• 📞 Call us at +254 117 802 561\n• 📧 Email: flowtechs254@gmail.com\n• 💬 Live chat available 24/7\n\n**Processing Time:**\n• ⚡ Cancellation: Immediate\n• 💰 Refund: 3-5 business days\n• 📦 Return: 7-10 business days\n\n**I can help you start the process right now!** What would you like to do? 🤝✨`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Comprehensive return policy and process information
  const getReturnPolicyResponse = (message: string): Message => {
    const ReturnPolicyCard: React.FC = () => (
      <div className="space-y-4 mt-3">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">📦 Return Policy & Process</h4>
          <p className="text-sm text-gray-600">
            We want you to be completely satisfied with your purchase!
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">Return Window</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">30 days from delivery date</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-800">Free Returns</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">We cover all return shipping costs</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-800">Fast Processing</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">3-5 business days for refunds</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-800">Quality Guarantee</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">100% satisfaction guarantee</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <h6 className="font-medium text-yellow-800 mb-1">⚠️ Important Return Requirements</h6>
          <p className="text-sm text-yellow-700">
            • Original packaging and accessories<br/>
            • Product in original condition<br/>
            • Proof of purchase (order number)<br/>
            • Clear photos for defective items
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate('/returns')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 transition-colors"
          >
            Start Return
          </button>
          <button 
            onClick={() => navigate('/contact')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    );

    return {
      id: Date.now(),
      text: `📦 **Complete Return Policy** 🔄✨\n\n**Our Customer-First Return Policy:**\n\n⏰ **30-Day Return Window**: From delivery date\n✅ **100% Satisfaction Guarantee**: No questions asked\n🚚 **Free Return Shipping**: We cover all costs\n⚡ **Fast Processing**: 3-5 business days\n\n**What You Can Return:**\n• 📦 Any item within 30 days\n• 🔧 Defective or damaged products\n• ❌ Wrong items received\n• 🎯 Items not as described\n• 📱 Electronics (unopened or defective)\n\n**Return Requirements:**\n• 📦 Original packaging and accessories\n• 🎯 Product in original condition\n• 📋 Proof of purchase (order number)\n• 📸 Clear photos for defective items\n\n**Return Process:**\n1. 📞 Contact us with order number\n2. 📸 Send photos (if applicable)\n3. 📦 Receive free return label\n4. 🚚 Package and ship back\n5. ✅ Refund within 3-5 days\n\n**Special Cases:**\n• 🔧 **Defective Items**: Immediate priority processing\n• 📱 **Electronics**: 7-day return for opened items\n• 🎁 **Personalized Items**: Case-by-case basis\n• 🏷️ **Sale Items**: Same return policy applies\n\n**Need to start a return?** Just give me your order number! 📋✨`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<ReturnPolicyCard key="return-policy" />]
    };
  };

  // Enhanced contact response for returns and refunds
  const getReturnContactResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();
    
    // Check if user is asking about a specific order
    const orderNumberMatch = message.match(/order\s*(?:#|number\s*)?(\d+)/i);
    const specificOrderId = orderNumberMatch ? parseInt(orderNumberMatch[1]) : null;
    
    if (specificOrderId && isAuthenticated) {
      const order = userOrders.find(o => o.order_id === specificOrderId);
      if (order) {
        return getSpecificOrderContactInfo(order);
      }
    }

    // Check for urgent/defective product contact
    if (messageLower.includes("defective") || messageLower.includes("broken") || messageLower.includes("damaged") ||
        messageLower.includes("urgent") || messageLower.includes("emergency")) {
      return {
        id: Date.now(),
        text: `🚨 **Priority Support for Defective Products** ⚡\n\nI understand this is urgent! Let me connect you with our priority support team immediately! 🔧✨\n\n**🚨 URGENT CONTACT OPTIONS:**\n\n📞 **24/7 Priority Hotline**: +254 117 802 561\n• Direct line to returns department\n• Immediate assistance for defective items\n• No waiting time\n\n📱 **WhatsApp Priority**: +254 117 802 561\n• Send photos directly\n• Real-time chat support\n• Quick response guaranteed\n\n💬 **Live Chat (Priority Queue)**:\n• Available 24/7\n• Skip the regular queue\n• Immediate agent connection\n\n**What to Have Ready:**\n• 📋 Order number\n• 📸 Clear photos of the defect\n• 📅 When you received the item\n• 📝 Description of the problem\n\n**Expected Response Time:**\n• ⚡ **Phone**: Immediate\n• 📱 **WhatsApp**: Within 30 minutes\n• 💬 **Live Chat**: Within 15 minutes\n\n**I can help you get connected right now!** Which contact method would you prefer? 📞✨\n\n**Don't worry - we'll fix this immediately!** 🤝💪`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // General return contact information
    const ReturnContactCard = () => (
      <div className="space-y-4 mt-3">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">📞 Return & Refund Contact Options</h4>
          <p className="text-sm text-gray-600">
            Choose the best way to contact us for your return or refund!
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">Live Chat</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Available 24/7 • Instant response</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-800">Phone Support</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">+254 117 802 561 • Priority support</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-800">Email Support</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">flowtechs254@gmail.com • 24-hour response</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-800">WhatsApp</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">+254 117 802 561 • Send photos easily</p>
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <h6 className="font-medium text-green-800 mb-1">💡 Best Contact Method</h6>
          <p className="text-sm text-green-700">
            <strong>For Defective Items:</strong> Phone or WhatsApp (priority support)<br/>
            <strong>For General Returns:</strong> Live Chat or Email<br/>
            <strong>For Urgent Issues:</strong> Phone (24/7 hotline)
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate('/contact')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            Contact Now
          </button>
          <button 
            onClick={() => navigate('/returns')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 transition-colors"
          >
            Start Return
          </button>
        </div>
      </div>
    );

    return {
      id: Date.now(),
      text: `📞 **Contact Us for Returns & Refunds** 📧✨\n\nI'm here to help you get in touch with our returns team! Here are all the ways you can contact us: 🤝\n\n**📞 Contact Options:**\n\n**💬 Live Chat (Recommended)**\n• Available 24/7\n• Instant response\n• Can handle photos and documents\n• No waiting time\n\n**📱 Phone Support**\n• +254 117 802 561\n• Priority support for urgent issues\n• Direct connection to returns department\n• Available during business hours\n\n**📧 Email Support**\n• flowtechs254@gmail.com\n• 24-hour response time\n• Good for detailed explanations\n• Can attach photos and documents\n\n**📱 WhatsApp**\n• +254 117 802 561\n• Send photos easily\n• Real-time chat\n• Quick response\n\n**⏰ Response Times:**\n• 🚨 **Urgent Issues**: Immediate (phone)\n• ⚡ **Live Chat**: Within 5 minutes\n• 📱 **WhatsApp**: Within 30 minutes\n• 📧 **Email**: Within 24 hours\n\n**What to Prepare:**\n• 📋 Order number\n• 📸 Photos (if applicable)\n• 📅 Date of issue\n• 📝 Description of problem\n\n**I can help you get connected right now!** Which method would you prefer? 📞✨`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<ReturnContactCard key="return-contact" />]
    };
  };

  const getSpecificOrderContactInfo = (order: any): Message => {
    const getContactPriority = (order: any) => {
      if (order.status === 'delivered') {
        return "📞 **Standard Contact**: Live chat or email recommended";
      }
      
      if (order.status === 'pending') {
        return "🚨 **Priority Contact**: Phone or WhatsApp for immediate cancellation";
      }
      
      return "📧 **Email Contact**: For detailed assistance";
    };

    const getContactMethod = (order: any) => {
      if (order.status === 'pending') {
        return "📞 **Phone**: +254 117 802 561 (Immediate cancellation)\n📱 **WhatsApp**: +254 117 802 561 (Quick response)";
      }
      
      return "💬 **Live Chat**: Available 24/7\n📧 **Email**: flowtechs254@gmail.com";
    };

    return {
      id: Date.now(),
      text: `📞 **Contact for Order #${order.order_id}** 📧\n\n**Order Details:**\n• 📅 Order Date: ${new Date(order.datetime).toLocaleDateString()}\n• 💰 Amount: Ksh ${order.total?.toLocaleString()}\n• 📊 Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\n\n**Contact Priority:**\n${getContactPriority(order)}\n\n**Recommended Contact Method:**\n${getContactMethod(order)}\n\n**What to Mention:**\n• 📋 Order #${order.order_id}\n• 📅 Order date: ${new Date(order.datetime).toLocaleDateString()}\n• 💰 Amount: Ksh ${order.total?.toLocaleString()}\n• 🎯 Your specific issue\n\n**Expected Response:**\n• ⚡ **Phone**: Immediate\n• 💬 **Live Chat**: Within 5 minutes\n• 📧 **Email**: Within 24 hours\n\n**I can help you get connected right now!** Which contact method would you prefer? 📞✨`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Enhanced product search and recommendations
  const getProductSearchResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();
    
    // Enhanced keyword extraction with better stop words
    const stopWords = [
      'help', 'me', 'find', 'products', 'product', 'item', 'buy', 'purchase', 'shop', 
      'a', 'an', 'the', 'for', 'show', 'search', 'look', 'looking', 'some', 'want', 'need',
      'can', 'you', 'please', 'tell', 'about', 'what', 'where', 'how', 'when', 'why',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall'
    ];
    
    // Extract meaningful keywords
    const searchKeywords = messageLower
      .split(/\s+/)
      .filter(word => !stopWords.includes(word) && word.length > 2)
      .map(word => word.replace(/[^\w]/g, '')); // Remove punctuation
    
    const searchTerm = searchKeywords.join(' ');
    
    // Search for products based on user input with enhanced matching
    const searchResults = searchTerm ? products.filter(product => {
      const productName = product.name.toLowerCase();
      const productCategory = product.category?.name?.toLowerCase() || '';
      const productBrand = product.brand?.toLowerCase() || '';
      const productDescription = product.description?.toLowerCase() || '';
      
      // Check if any keyword matches
      return searchKeywords.some(keyword => 
        productName.includes(keyword) ||
        productCategory.includes(keyword) ||
        productBrand.includes(keyword) ||
        productDescription.includes(keyword)
      );
    }) : [];

    // Get discounted products
    const discountedProducts = products.filter(product => product.discount && product.discount > 0);
    
    // Get new arrivals (products added in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newArrivals = products.filter(product => 
      new Date(product.created_at) > thirtyDaysAgo
    );

    // Get top rated products
    const topRated = products
      .filter(product => product.rating && product.rating > 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    // If the user asks for general help finding products without a specific term
    if (!searchTerm && (messageLower.includes('help') || messageLower.includes('find') || messageLower.includes('shop'))) {
      return getProductHelpResponse(message);
    }

    // Handle specific search requests with enhanced responses
    if (messageLower.includes("deals") || messageLower.includes("discount") || messageLower.includes("sale")) {
      if (discountedProducts.length === 0) {
        return {
          id: Date.now(),
          text: `🏷️ **Current Deals** 💰\n\nWe don't have any active discounts right now, but we have amazing products at great prices! ✨\n\n**Check out our:**\n• 🆕 New arrivals\n• ⭐ Top-rated products\n• 🚀 Trending items\n\n**Want to see something specific?** Just tell me what you're looking for! 🛍️`,
          sender: "bot",
          timestamp: new Date(),
        };
      }

      const DealsCard = () => (
        <div className="space-y-4 mt-3">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">🏷️ Amazing Deals Available!</h4>
            <p className="text-sm text-gray-600">
              We have {discountedProducts.length} discounted products with great savings!
            </p>
          </div>
          
          <div className="space-y-3">
            {discountedProducts.slice(0, 5).map(product => (
              <div key={product.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {product.img_url && (
                      <img 
                        src={product.img_url} 
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h5 className="font-medium text-gray-800 text-sm">{product.name}</h5>
                      <p className="text-xs text-gray-500">{product.category?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-sm">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-gray-500 line-through">{formatCurrency(product.original_price || product.price)}</p>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">-{product.discount}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/store')}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 transition-colors"
            >
              View All Deals
            </button>
          </div>
        </div>
      );

      return {
        id: Date.now(),
        text: `🏷️ **Amazing Deals Available!** 💰\n\nWe have **${discountedProducts.length} discounted products** with great savings! 🎉\n\n**Top Deals:**\n${discountedProducts.slice(0, 5).map(product => 
          `• 📱 ${product.name} - ${formatCurrency(product.price)} (${product.discount}% OFF)`
        ).join('\n')}\n\n**Want to see all deals?** I can show you:\n• 🔍 All discounted products\n• 💰 Best savings\n• ⭐ Top-rated deals\n\n**Just say "show me all deals" and I'll help you save!** 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
        type: "interactive",
        components: [<DealsCard key="deals-card" />]
      };
    }

    if (messageLower.includes("new") || messageLower.includes("latest") || messageLower.includes("arrivals")) {
      if (newArrivals.length === 0) {
        return {
          id: Date.now(),
          text: `🆕 **New Arrivals** ✨\n\nWe're constantly adding new products! Check back soon for the latest arrivals! 🎉\n\n**In the meantime, check out our:**\n• ⭐ Top-rated products\n• 🏷️ Best deals\n• 🚀 Trending items\n\n**What are you looking for?** I can help you find something amazing! 🛍️`,
          sender: "bot",
          timestamp: new Date(),
        };
      }

      const NewArrivalsCard = () => (
        <div className="space-y-4 mt-3">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">🆕 Fresh New Arrivals!</h4>
            <p className="text-sm text-gray-600">
              {newArrivals.length} new products just added to our collection!
            </p>
          </div>
          
          <div className="space-y-3">
            {newArrivals.slice(0, 5).map(product => (
              <div key={product.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {product.img_url && (
                      <img 
                        src={product.img_url} 
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h5 className="font-medium text-gray-800 text-sm">{product.name}</h5>
                      <p className="text-xs text-gray-500">{product.category?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm">{formatCurrency(product.price)}</p>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">New</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/store')}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-700 transition-colors"
            >
              Explore New Arrivals
            </button>
          </div>
        </div>
      );

      return {
        id: Date.now(),
        text: `🆕 **New Arrivals** ✨\n\nWe have **${newArrivals.length} new products** just added! 🎉\n\n**Latest Additions:**\n${newArrivals.slice(0, 5).map(product => 
          `• 📱 ${product.name} - ${formatCurrency(product.price)}`
        ).join('\n')}\n\n**Want to see all new arrivals?** I can show you:\n• 🔍 All new products\n• 📂 New products by category\n• ⭐ Top-rated new items\n\n**Just say "show me all new arrivals" and I'll help you discover!** 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
        type: "interactive",
        components: [<NewArrivalsCard key="new-arrivals-card" />]
      };
    }

    if (messageLower.includes("top rated") || messageLower.includes("best") || messageLower.includes("popular")) {
      if (topRated.length === 0) {
        return {
          id: Date.now(),
          text: `⭐ **Top Rated Products** 🌟\n\nOur customers love all our products! Here are some great options: ✨\n\n**Popular Categories:**\n• 📱 Electronics\n• 🎮 Gaming\n\n**What interests you?** I can help you find the perfect product! 🛍️`,
          sender: "bot",
          timestamp: new Date(),
        };
      }

      const TopRatedCard = () => (
        <div className="space-y-4 mt-3">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">⭐ Customer Favorites</h4>
            <p className="text-sm text-gray-600">
              These are our highest-rated products loved by customers!
            </p>
          </div>
          
          <div className="space-y-3">
            {topRated.map(product => (
              <div key={product.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {product.img_url && (
                      <img 
                        src={product.img_url} 
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h5 className="font-medium text-gray-800 text-sm">{product.name}</h5>
                      <p className="text-xs text-gray-500">{product.category?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm">{formatCurrency(product.price)}</p>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-xs text-gray-600">{product.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/store')}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-yellow-600 hover:to-orange-700 transition-colors"
            >
              View Top Rated
            </button>
          </div>
        </div>
      );

      return {
        id: Date.now(),
        text: `⭐ **Top Rated Products** 🌟\n\nHere are our **customer favorites** with the highest ratings! 🎉\n\n**Top Rated Items:**\n${topRated.map(product => 
          `• 📱 ${product.name} - ${formatCurrency(product.price)} ⭐ ${product.rating?.toFixed(1)}`
        ).join('\n')}\n\n**Want to see more?** I can show you:\n• 🔍 All top-rated products\n• 📂 Top-rated by category\n• 🏷️ Top-rated deals\n\n**Just say "show me all top rated" and I'll help you find the best!** 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
        type: "interactive",
        components: [<TopRatedCard key="top-rated-card" />]
      };
    }

    // Handle search results with enhanced display
    if (searchResults.length > 0) {
      const SearchResultsCard = () => (
        <div className="space-y-4 mt-3">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">🔍 Search Results for "{searchTerm}"</h4>
            <p className="text-sm text-gray-600">
              I found {searchResults.length} products that match your search!
            </p>
          </div>
          
          <div className="space-y-3">
            {searchResults.slice(0, 5).map(product => (
              <div key={product.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {product.img_url && (
                      <img 
                        src={product.img_url} 
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h5 className="font-medium text-gray-800 text-sm">{product.name}</h5>
                      <p className="text-xs text-gray-500">{product.category?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm">{formatCurrency(product.price)}</p>
                    {product.discount && product.discount > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">-{product.discount}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/store')}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
            >
              View All Results
            </button>
          </div>
        </div>
      );

      return {
        id: Date.now(),
        text: `🔍 **Search Results for "${searchTerm}"** ✨\n\nI found **${searchResults.length} products** that match your search! 🎉\n\n**Found Products:**\n${searchResults.slice(0, 5).map(product => 
          `• 📱 ${product.name} - ${formatCurrency(product.price)}`
        ).join('\n')}\n\n**Want to see more?** I can:\n• 🔍 Show all ${searchResults.length} results\n• 📂 Filter by category\n• 💰 Show only deals\n• ⭐ Show only top-rated\n\n**Just tell me what you'd like to see!** 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
        type: "interactive",
        components: [<SearchResultsCard key="search-results-card" />]
      };
    }

    // No search results with helpful suggestions
    const NoResultsCard = () => (
      <div className="space-y-4 mt-3">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">🔍 No Results Found</h4>
          <p className="text-sm text-gray-600">
            I couldn't find products matching "{searchTerm}". Let me help you discover alternatives!
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">Try Different Keywords</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Use more general terms or check spelling</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-800">Browse Categories</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Explore our product categories</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-800">Popular Products</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Check out customer favorites</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate('/store')}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
          >
            Browse All Products
          </button>
        </div>
      </div>
    );

    return {
      id: Date.now(),
      text: `🔍 **Search Results** 🤔\n\nI couldn't find any products matching "${searchTerm}". But don't worry! Here are some suggestions: ✨\n\n**Try searching for:**\n• 📱 Specific product names\n• 📂 Category names\n• 🏷️ "deals" or "discounts"\n• 🆕 "new arrivals"\n• ⭐ "top rated"\n\n**Or browse our categories:**\n• 📦 All products\n• 💰 Best deals\n• 🆕 New arrivals\n• ⭐ Top rated\n\n**What would you like to explore?** I'm here to help! 🛍️✨`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<NoResultsCard key="no-results-card" />]
    };
  };

  // Enhanced page knowledge and navigation assistance
  const getPageKnowledgeResponse = (message: string): Message | null => {
    const messageLower = message.toLowerCase();
    
    // Comprehensive page information
    const pageInfo = {
      home: {
        name: "Home",
        path: "/",
        description: "Main landing page with hero section, featured products, and company highlights",
        features: ["Hero carousel", "Featured products", "Company statistics", "Call-to-action buttons"],
        access: "Public"
      },
      store: {
        name: "Store / Today's Deals",
        path: "/store",
        description: "Main product catalog with search, filters, and product grid",
        features: ["Product search", "Category filters", "Price range filters", "Sorting options", "Pagination"],
        access: "Public"
      },
      about: {
        name: "About Us",
        path: "/about",
        description: "Company information, values, team, and gallery",
        features: ["Company story", "Values and mission", "Team information", "Image gallery", "Contact details"],
        access: "Public"
      },
      login: {
        name: "Login",
        path: "/login",
        description: "User authentication page",
        features: ["Email/password login", "Remember me", "Forgot password link", "Register link"],
        access: "Public"
      },
      register: {
        name: "Register",
        path: "/register",
        description: "New user registration",
        features: ["User registration form", "Email verification", "Terms acceptance"],
        access: "Public"
      },
      shoppingCart: {
        name: "Shopping Cart",
        path: "/shopping-cart",
        description: "Cart management and checkout preparation",
        features: ["Cart items display", "Quantity adjustment", "Price calculation", "Checkout button"],
        access: "Public"
      },
      checkout: {
        name: "Checkout",
        path: "/checkout",
        description: "Order completion with delivery and payment",
        features: ["Delivery address", "Payment methods", "Order review", "Order confirmation"],
        access: "Authenticated users only"
      },
      myProfile: {
        name: "My Profile",
        path: "/MyProfile",
        description: "User account management and settings",
        features: ["Personal information", "Account settings", "Password change", "Profile picture"],
        access: "Authenticated users only"
      },
      ordersOverview: {
        name: "My Orders",
        path: "/orders-overview",
        description: "Complete order history and tracking",
        features: ["Order history", "Status tracking", "Order details", "Pagination"],
        access: "Authenticated users only"
      },
      orderDetails: {
        name: "Order Details",
        path: "/order-details/:orderId",
        description: "Detailed view of specific order",
        features: ["Order information", "Product details", "Delivery status", "Payment status"],
        access: "Authenticated users only"
      },
      addressBook: {
        name: "Address Book",
        path: "/address-book",
        description: "Manage delivery addresses",
        features: ["Add addresses", "Edit addresses", "Set default", "Delete addresses"],
        access: "Authenticated users only"
      },
      wishlist: {
        name: "Wishlist",
        path: "/wishlist",
        description: "Saved favorite products",
        features: ["Saved products", "Add to cart", "Remove items", "Share wishlist"],
        access: "Authenticated users only"
      },
      pendingReviews: {
        name: "Pending Reviews",
        path: "/pending-reviews",
        description: "Review products from completed orders",
        features: ["Review products", "Rating system", "Comment submission", "Review history"],
        access: "Authenticated users only"
      },
      productDetails: {
        name: "Product Details",
        path: "/product-details/:id",
        description: "Detailed product information and purchase",
        features: ["Product images", "Description", "Reviews", "Add to cart", "Add to wishlist"],
        access: "Public"
      },
      adminPage: {
        name: "Admin Dashboard",
        path: "/AdminPage",
        description: "Super admin user management",
        features: ["User management", "Role management", "Statistics", "System settings"],
        access: "Super Admin only"
      },
      products: {
        name: "Products Management",
        path: "/products",
        description: "Admin product management",
        features: ["Add products", "Edit products", "Delete products", "Category management"],
        access: "Admin/Super Admin only"
      },
      orderManagement: {
        name: "Order Management",
        path: "/orders-management",
        description: "Admin order processing and management",
        features: ["View all orders", "Update status", "Process payments", "Delivery tracking"],
        access: "Admin/Super Admin only"
      },
      categoryManagement: {
        name: "Category Management",
        path: "/deletecategory",
        description: "Product category administration",
        features: ["Add categories", "Edit categories", "Delete categories", "Category hierarchy"],
        access: "Admin/Super Admin only"
      },
      terms: {
        name: "Terms & Conditions",
        path: "/termsconditions",
        description: "Legal terms and conditions",
        features: ["Terms of service", "Privacy policy", "Return policy", "Legal information"],
        access: "Public"
      },
      forgotPassword: {
        name: "Forgot Password",
        path: "/forgot-password",
        description: "Password recovery",
        features: ["Email input", "Reset link", "Security verification"],
        access: "Public"
      },
      resetPassword: {
        name: "Reset Password",
        path: "/reset-password",
        description: "Set new password after recovery",
        features: ["New password input", "Confirm password", "Password validation"],
        access: "Public"
      },
      emailVerification: {
        name: "Email Verification",
        path: "/verify-email",
        description: "Verify email address",
        features: ["Email verification", "Resend verification", "Account activation"],
        access: "Public"
      },
      superAdmin: {
        name: "Super Admin Registration",
        path: "/SuperAdmin",
        description: "Super admin account creation",
        features: ["Super admin registration", "System initialization", "Admin privileges"],
        access: "Public (one-time setup)"
      },
      notFound: {
        name: "404 Not Found",
        path: "*",
        description: "Page not found error",
        features: ["Error message", "Back to home", "Navigation help"],
        access: "Public"
      }
    };

    // Check if user is asking about specific pages
    const pageKeywords = Object.keys(pageInfo);
    const mentionedPage = pageKeywords.find(page => 
      messageLower.includes(page.toLowerCase()) || 
      messageLower.includes(pageInfo[page as keyof typeof pageInfo].name.toLowerCase())
    );

    if (mentionedPage) {
      const page = pageInfo[mentionedPage as keyof typeof pageInfo];
      return {
        id: Date.now(),
        text: `📄 **${page.name} Page** 📋\n\n**Description:** ${page.description}\n\n**Features:**\n${page.features.map(feature => `• ${feature}`).join('\n')}\n\n**Access:** ${page.access}\n\n**Path:** \`${page.path}\`\n\n**How to access:** ${page.access === 'Public' ? 'Anyone can visit this page' : page.access === 'Authenticated users only' ? 'You need to log in to access this page' : 'This page requires special admin privileges'}\n\n**Need help navigating?** I can guide you to this page or help you with any specific features! 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Check if user is asking about navigation or site structure
    if (messageLower.includes("pages") || messageLower.includes("sections") || messageLower.includes("menu") || 
        messageLower.includes("navigation") || messageLower.includes("site map") || messageLower.includes("where")) {
      
      const NavigationCard: React.FC = () => (
        <div className="space-y-4 mt-3">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">🗺️ Flowtechs Site Navigation</h4>
            <p className="text-sm text-gray-600">
              Here's a complete overview of all the pages and sections in our e-commerce platform!
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-blue-600 mb-2">🏠 Public Pages</h5>
              <div className="space-y-1 text-sm">
                <p>• <strong>Home</strong> - Main landing page with featured products</p>
                <p>• <strong>Store</strong> - Product catalog and shopping</p>
                <p>• <strong>About Us</strong> - Company information and story</p>
                <p>• <strong>Product Details</strong> - Individual product pages</p>
                <p>• <strong>Terms & Conditions</strong> - Legal information</p>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-green-600 mb-2">👤 User Account Pages</h5>
              <div className="space-y-1 text-sm">
                <p>• <strong>Login/Register</strong> - Account creation and access</p>
                <p>• <strong>My Profile</strong> - Account management</p>
                <p>• <strong>Shopping Cart</strong> - Cart management</p>
                <p>• <strong>Checkout</strong> - Order completion</p>
                <p>• <strong>My Orders</strong> - Order history and tracking</p>
                <p>• <strong>Address Book</strong> - Delivery address management</p>
                <p>• <strong>Wishlist</strong> - Saved favorite products</p>
                <p>• <strong>Pending Reviews</strong> - Product reviews</p>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-purple-600 mb-2">⚙️ Admin Pages</h5>
              <div className="space-y-1 text-sm">
                <p>• <strong>Admin Dashboard</strong> - Super admin user management</p>
                <p>• <strong>Products Management</strong> - Product administration</p>
                <p>• <strong>Order Management</strong> - Order processing</p>
                <p>• <strong>Category Management</strong> - Category administration</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h6 className="font-medium text-yellow-800 mb-1">💡 Quick Navigation Tips</h6>
            <p className="text-sm text-yellow-700">
              • Use the top navigation bar for main pages<br/>
              • Access account features from the user menu<br/>
              • Admin features are available in the account dropdown<br/>
              • I can help you navigate to any specific page!
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/store')}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 transition-colors"
            >
              Browse Store
            </button>
            <button 
              onClick={() => navigate('/about')}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              About Us
            </button>
          </div>
        </div>
      );

      return {
        id: Date.now(),
        text: `🗺️ **Complete Flowtechs Site Navigation Guide** 📋\n\nI'm here to help you navigate our e-commerce platform! Here's everything you need to know about our pages and sections: 🛍️✨\n\n**🏠 Public Pages (Anyone can access):**\n• **Home** - Main landing page with featured products and company highlights\n• **Store** - Complete product catalog with search, filters, and shopping\n• **About Us** - Company story, values, team, and gallery\n• **Product Details** - Individual product pages with reviews and purchase options\n• **Terms & Conditions** - Legal information and policies\n\n**👤 User Account Pages (Login required):**\n• **My Profile** - Account management and settings\n• **Shopping Cart** - Cart management and checkout preparation\n• **Checkout** - Order completion with delivery and payment\n• **My Orders** - Complete order history and tracking\n• **Address Book** - Manage delivery addresses\n• **Wishlist** - Saved favorite products\n• **Pending Reviews** - Review products from completed orders\n\n**⚙️ Admin Pages (Admin privileges required):**\n• **Admin Dashboard** - Super admin user management\n• **Products Management** - Add, edit, and manage products\n• **Order Management** - Process and manage all orders\n• **Category Management** - Manage product categories\n\n**💡 How I Can Help:**\n• Guide you to specific pages\n• Explain page features and functionality\n• Help with navigation issues\n• Provide page-specific assistance\n\n**Just ask me about any specific page or feature!** 🚀`,
        sender: "bot",
        timestamp: new Date(),
        type: "interactive",
        components: [<NavigationCard key="navigation-card" />]
      };
    }

    // Check if user is asking about specific functionality
    if (messageLower.includes("how to") && (messageLower.includes("navigate") || messageLower.includes("find") || messageLower.includes("access"))) {
      return {
        id: Date.now(),
        text: `🧭 **How to Navigate Flowtechs** 🗺️\n\nI'll help you find your way around our platform! Here's how to navigate effectively: ✨\n\n**🔍 Finding Products:**\n• **Store Page** - Browse all products with filters and search\n• **Search Bar** - Use the search function in the top navigation\n• **Category Filters** - Filter by product categories\n• **Product Details** - Click on any product for detailed information\n\n**🛒 Shopping Process:**\n1. **Browse** - Visit the Store page to see products\n2. **Search** - Use search or filters to find specific items\n3. **Add to Cart** - Click "Add to Cart" on any product\n4. **View Cart** - Click the cart icon in the top navigation\n5. **Checkout** - Proceed to checkout from your cart\n\n**👤 Account Features:**\n• **Login/Register** - Use the "Sign In" button in the top right\n• **My Profile** - Access from the account dropdown menu\n• **My Orders** - View order history and tracking\n• **Wishlist** - Save favorite products for later\n• **Address Book** - Manage delivery addresses\n\n**📱 Mobile Navigation:**\n• **Hamburger Menu** - Tap the menu icon for mobile navigation\n• **Swipe** - Swipe through product images\n• **Search** - Use the search bar at the top\n\n**💡 Pro Tips:**\n• Use the breadcrumb navigation to see where you are\n• The cart icon shows your current cart quantity\n• Account notifications appear in the user menu\n• I can help you navigate to any specific page!\n\n**Need help with a specific page or feature?** Just ask me! 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    return null; // Return null if no specific page knowledge is needed
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 md:fixed md:bottom-16 md:left-4 w-full md:w-[400px] h-[70vh] md:h-[500px] bg-white rounded-t-2xl md:rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src="/makenabot.png" alt="Makena" className="w-12 h-12 rounded-full border-2 border-white/80 shadow-md" />
                <h3 className="font-semibold text-lg">Makena  Shopping Bestie</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/90 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[280px] md:max-w-[320px] px-4 py-2 rounded-lg ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.type === 'profile' && message.components && message.components.map((component, index) => (
                    <div key={index}>{component}</div>
                  ))}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  {message.type !== 'profile' && message.components && message.components.map((component, index) => (
                    <div key={index} className="mt-2">
                      {component}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-800 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask me anything... 😊"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Scroll to Top Button */}
          {showScrollToTop && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-20 right-4 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowUp size={16} />
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default EnhancedServiceChatbot; 