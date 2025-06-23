import React, { useState, useEffect, useRef } from "react";
import { useFetchProducts } from "./UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import {
  MessageCircle,
  X,
  Send,
  Package,
  Truck,
  CheckCircle,
  Search,
  Gift,
  Clock,
  MessageSquare,
  ArrowUp,

  XCircle,
  Phone,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useUserStats } from "../context/UserStatsContext";
import countiesData from "../context/kenyan_counties.json";

// Define Message interface for type safety
interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  type?:
    | "text"
    | "action"
    | "confirmation"
    | "product"
    | "order"
    | "interactive"
    | "profile";
  data?: any;
  components?: React.ReactNode[];
}

// Product results card for chat
const ProductResultsCard: React.FC<{
  products: any[];
  addToCart: (product: any) => void;
}> = ({ products, addToCart }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
    {products.map((product) => (
      <div
        key={product.id}
        className="bg-white rounded-lg shadow p-2 flex flex-col items-center"
      >
        <img
          src={product.img_url}
          alt={product.name}
          className="h-16 w-16 object-contain mb-2"
        />
        <div className="text-xs font-semibold text-gray-800 text-center line-clamp-2 mb-1">
          {product.name}
        </div>
        <div className="text-sm text-purple-600 font-bold">
          {formatCurrency(product.price)}
        </div>
        <button
          className="mt-1 px-2 py-1 bg-blue-600 text-white rounded text-xs"
          onClick={() => addToCart(product)}
        >
          Add to Cart
        </button>
      </div>
    ))}
  </div>
);

// No results card for chat
const NoResultsCard: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
  <div className="p-2">
    <p className="text-sm text-gray-700 mb-2">
      I couldn't find products matching{" "}
      <span className="font-bold">"{searchTerm}"</span>. Try different keywords
      or browse categories!
    </p>
    <ul className="text-xs text-gray-600 list-disc pl-4 mb-2">
      <li>Specific product names</li>
    </ul>
    <div className="text-xs text-gray-500">
      Or browse: All products, Best deals, New arrivals, Top rated
    </div>
  </div>
);

// Enhanced Makena Pro Chatbot Component
const EnhancedServiceChatbot: React.FC<{}> = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Hey there! 👋 What can I help you with  today? ✨😊`,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [userData, setUserData] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<any>(null);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [counties, setCounties] = useState<any[]>([]);
  const { products, isLoading: productsLoading, fetchProducts } = useFetchProducts();
  const { token, isAuthenticated } = useAuth();
  const { addToCart } = useShoppingCart();
  const { refreshStats } = useUserStats(); // Only if you use refreshStats
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCounties(countiesData.counties);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollToTop(isScrolledUp);
    }
  };

  // Helper function to add product to cart
  const addProductToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} added to cart! 🛒`);
    refreshStats(); // Refresh stats after cart action
  };

  // Fetch user data for chatbot functionality
  const fetchUserData = async () => {
    if (!token) return;
    try {
      const [userRes, ordersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/orders?limit=20`, {
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
      "Hello ! 💫 What brings you to our store today?",
      "Hi! 👋 I'm so excited to help you shop today!",
      "Hey! 🌟 Looking for something special or just browsing?",
    ],
    shopping: [
      "Let's find you something fabulous! 🛍️✨ What's on your mind?",
      "Ready to discover some awesome products? Let's go! 🚀",
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
      "I'm so glad I could help you today! 😊 ",
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
    ],
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
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Get day of week
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
    const dateString = now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
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
      now,
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
    const lastBotMessage =
      lastMessage?.sender === "bot" ? lastMessage.text.toLowerCase() : "";

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
        text: "Awesome! 🎯 Let's discover some amazing products together! What interests you most ? I can show you our best picks! ✨",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (lastBotMessage.includes("what else can i help")) {
      return {
        id: Date.now(),
        text: "Great! 🌟 I'd love to help you discover more! What are you in the mood for today?  🛍️",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Default response for "yes"
    return {
      id: Date.now(),
      text: "Excellent! 😊 I'm excited to help you discover something amazing! What would you like to explore today?  🚀",
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Handle simple "no" responses based on context
  const handleSimpleNoResponse = (): Message => {
    const lastMessage = messages[messages.length - 1];
    const lastBotMessage =
      lastMessage?.sender === "bot" ? lastMessage.text.toLowerCase() : "";

    // Check if the last bot message was asking about something specific
    if (lastBotMessage.includes("did you find everything")) {
      return {
        id: Date.now(),
        text: "No worries at all! 😊 Let me help you find exactly what you're looking for! What specific product or category are you interested in?  🎯",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (lastBotMessage.includes("need help with anything else")) {
      return {
        id: Date.now(),
        text: "That's totally fine! 😊 I'm glad I could help with what you needed! Feel free to come back anytime 💫",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (lastBotMessage.includes("should we explore")) {
      return {
        id: Date.now(),
        text: "No problem! 😊 Maybe you have something specific in mind? 🎯",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Default response for "no"
    return {
      id: Date.now(),
      text: "No worries! 😊 What would you like to explore instead? I'm here to help you find something amazing! 🛍️✨",
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Enhanced fallback response with helpful suggestions
  const getFallbackResponse = (_message: string): Message => {
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
      `Good ${timeContext}! 🌟  I can help you with:`,
      `Hi there! ✨ I'm here to make your shopping experience amazing! Here's what I can do:`,
      `Hello! 🛍️  your personal shopping assistant at Flowtechs! Let me show you what I can help with:`,
    ];

    const randomSuggestion =
      suggestions[Math.floor(Math.random() * suggestions.length)];

    const HelpCard = () => (
      <div className="space-y-4 mt-3">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">
            🛍️ How Can I Help You?
          </h4>
          <p className="text-sm text-gray-600">
            I'm here to make your shopping experience amazing! Here's what I can
            do:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">
                Find Products
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Search for specific items or browse categories
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-800">
                Track Orders
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Check order status and delivery updates
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Gift className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-800">
                Get Recommendations
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Personalized product suggestions
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-800">
                Customer Support
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Help with returns, payments, and more
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => navigate("/store")}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 transition-colors"
          >
            Browse Store
          </button>
          <button
            onClick={() => navigate("/shopping-cart")}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 transition-colors"
          >
            View Cart
          </button>
        </div>
      </div>
    );

    return {
      id: Date.now(),
      text: `${randomSuggestion}\n\n•`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<HelpCard key="help-card" />],
    };
  };

  // Enhanced bot response system with more personality and intelligence
  const getBotResponse = (userMessage: string): Message => {
    const message = userMessage.toLowerCase();

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
      if (
        message.includes("yes") ||
        message.includes("confirm") ||
        message.includes("sure") ||
        message.includes("ok")
      ) {
        return handleConfirmation(true);
      } else if (
        message.includes("no") ||
        message.includes("cancel") ||
        message.includes("nevermind")
      ) {
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
      const userName =
        isAuthenticated && userData
          ? ` ${userData.username || userData.name}`
          : "";
      const followUp = getRandomResponse("followUp");
      return {
        id: Date.now(),
        text:
          greeting +
          (userName ? ` Welcome back,${userName}! 🎉` : "") +
          ` ${followUp}`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle Kiswahili greetings

    // Handle comprehensive Kiswahili responses
    if (
      [
        "sasa",
        "mambo",
        "uko aje",
        "niaje",
        "vipi",
        "hujambo",
        "hujambo",
      ].includes(message)
    ) {
      return {
        id: Date.now(),
        text: "Poa sana! Ukoaje? 😊✨ Karibu sana Flowtechs! your receptionist wa Flowtechs! 🇰🇪\n\nNimefurahi kukuona hapa! (I'm happy to see you here!)\n\nNiko tayari kukusaidia na:\n• 🛍️ Kupata bidhaa (Find products)\n• 📦 Kufuatilia oda (Track orders)\n• 💡 Mapendekezo (Recommendations)\n• 🎧 Msaada wa wateja (Customer support)\n• 🏷️ Bei nzuri (Best deals)\n• 💳 \n\nTuanze safari ya manunuzi pamoja! 🚀💫\n\n(PS: I'm still learning Swahili, so feel free to mix with English!)",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle Kiswahili product search
    if (
      message.includes("tafuta") ||
      message.includes("natafuta bidhaa ") ||
      message.includes("ninaweza pata") ||
      message.includes("nisaidie kupata") ||
      message.includes("ninaomba bidhaa")
    ) {
      return {
        id: Date.now(),
        text: "Unatafuta bidhaa gani leo? 🛍️ !",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle Kiswahili order tracking
    if (
      message.includes("oda yangu iko wapi") ||
      message.includes("fuatilia oda") ||
      message.includes("ninaweza fuatilia") ||
      message.includes("oda yangu") ||
      message.includes("nisaidie kufuatilia")
    ) {
      // Check if user provided an order number
      const orderNumberMatch = message.match(
        /(?:oda|order)\s*(?:#|nambari\s*)?(\d+)/i
      );
      const specificOrderId = orderNumberMatch
        ? parseInt(orderNumberMatch[1])
        : null;

      if (specificOrderId && isAuthenticated) {
        const order = userOrders.find((o) => o.order_id === specificOrderId);
        if (order) {
          const getOrderStatusSwahili = (status: string) => {
            switch (status) {
              case "pending":
                return "Inasubiri (Pending)";
              case "processing":
                return "Inachakatwa (Processing)";
              case "delivered":
                return "Imepelekwa (Delivered)";
              case "cancelled":
                return "Imeghairiwa (Cancelled)";
              default:
                return status;
            }
          };

          const getEstimatedDeliverySwahili = (
            orderDate: string,
            status: string
          ) => {
            const orderDateTime = new Date(orderDate);

            if (status === "delivered") {
              return "✅ **Imepelekwa**";
            }

            if (status === "cancelled") {
              return "❌ **Oda Imeghairiwa**";
            }


            if (status === "pending") {
              const estimatedDelivery = new Date(
                orderDateTime.getTime() + 3 * 24 * 60 * 60 * 1000
              );
              return `📦 **Tarehe ya kusambaza inayotarajiwa**: ${estimatedDelivery.toLocaleDateString()} (siku 2-5 za kazi)`;
            }

            if (status === "processing") {
              const estimatedDelivery = new Date(
                orderDateTime.getTime() + 2 * 24 * 60 * 60 * 1000
              );
              return `🚚 **Tarehe ya kusambaza inayotarajiwa**: ${estimatedDelivery.toLocaleDateString()} (siku 1-2 za kazi)`;
            }

            return "📋 **Inachakatwa oda yako**";
          };

          return {
            id: Date.now(),
            text: `📦 **Taarifa za Oda #${
              order.order_id
            }** 🚚\n\n**Hali ya Oda**: ${getOrderStatusSwahili(
              order.status
            )}\n**Tarehe ya Oda**: ${new Date(
              order.datetime
            ).toLocaleDateString()}\n**Jumla ya Malipo**: Ksh ${order.total?.toLocaleString()}\n\n${getEstimatedDeliverySwahili(
              order.datetime,
              order.status
            )}\n\n**Maelezo za Usambazaji:**\n• 📱 Utapokea ujumbe wa SMS katika kila hatua\n• 📍 Ufuatiliaji wa wakati halisi unapatikana\n• 🎧 Wasiliana na msaada kwa msaada wa haraka\n\n**Hujambo na kitu kingine?** 😊`,
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
          text: "🛍️ **Hakuna Oda Bado - Tuanze Kununua!** ✨\n\nHuna oda yoyote bado, lakini hiyo ni sawa kabisa! Tuanze safari yako ya kununua! 💫",
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
      message.includes("pendekezo") ||
      message.includes("nisaidie kuchagua") ||
      message.includes("nini bora") ||
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
      message.includes("msaada") ||
      message.includes("nisaidie") ||
      message.includes("shida") ||
      message.includes("tatizo") ||
      message.includes("nahitaji msaada")
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
      message.includes("deal mzuri") ||
      message.includes("bei mzuri") ||
      message.includes("bei nzuri") ||
      message.includes("anguka nayo") ||
      message.includes("bei") ||
      message.includes("makubaliano mzuri") ||
      message.includes("bei rahisi") ||
      message.includes("bei nafuu") ||
      message.includes("bei ya chini") ||
      message.includes("bei bora") ||
      message.includes("bei nafuu") ||
      message.includes("ninaweza pata bei nzuri") ||
      message.includes("unao bei nzuri") ||
      message.includes("bei gani nzuri") ||
      message.includes("makubaliano gani") ||
      message.includes("bei ya bei") ||
      message.includes("bei ya bei nzuri")
    ) {
      const discountedProducts = products.filter(
        (product) => product.discount && product.discount > 0
      );

      if (discountedProducts.length > 0) {
        const topDeals = discountedProducts
          .sort((a, b) => (b.discount || 0) - (a.discount || 0))
          .slice(0, 3);

        return {
          id: Date.now(),
          text: `🏷️ **Makubaliano Mzuri Sana!** 💰✨\n\nEeh! Nina makubaliano mazuri sana kwa ajili yako! 🎉\n\n**Makubaliano Bora za Leo:**\n${topDeals
            .map(
              (product) =>
                `• 📱 **${product.name}** - ${formatCurrency(product.price)} (${
                  product.discount
                }% OFF)\n  💰 Bei ya awali: ${formatCurrency(
                  product.original_price || product.price
                )}`
            )
            .join(
              "\n\n"
            )}\n\n**Kwa nini makubaliano yetu ni mzuri sana?** 🤔\n• 💎 Bidhaa za ubora wa juu\n• 🏷️ Bei ya chini kabisa\n• 🚚 Usambazaji  bora nasi  \n• 💳 Malipo ya rahisi\n• 🛡️ Dhamana ya kurudi (siku 30)\n\n**Je, ungependa kuona makubaliano yote?** Au unahitaji kitu maalum? 🛍️\n\n**Kumbuka:** Makubaliano haya yanaweza kuisha haraka! ⏰✨`,
          sender: "bot",
          timestamp: new Date(),
        };
      } else {
        return {
          id: Date.now(),
          text: `💎 **Bei Zetu ni za  Kuanguka nayo😂!** ✨ \n\n**Kwa nini bei zetu ni mzuri:**\n• 💰 Bei ya ushindani - tunashindana na wengine\n• 🏷️ Hakuna bei ya juu - bei moja kwa kila mtu\n• 💎 Ubora wa juu - hakuna kitu cha chini\n• 🚚 Usambazaji wa haraka - siku 2-5\n• 🛡️ Dhamana kamili - kurudi bila swali\n\n**Je, unatafuta bidhaa gani?** Ninaweza kukusaidia kupata bei bora kwa kila kitu! 🛍️\n\n**Au ungependa kuona:**\n• 📱 Vifaa vya elektroniki\n• 👗 Mavazi na nguo\n• 🎮 Michezo na burudani\n• 🏠 Vifaa vya nyumbani\n\n**Tuanze kununua!** Bei nzuri inakungoja! 💫`,
          sender: "bot",
          timestamp: new Date(),
        };
      }
    }

    // Handle founder-related queries in Kiswahili
    if (
      message.includes("founder") ||
      message.includes("founders") ||
      message.includes("eric") ||
      message.includes("steve") ||
      message.includes("omondi") ||
      message.includes("leo") ||
      message.includes("who started") ||
      message.includes("who created") ||
      message.includes("who owns") ||
      message.includes("started by") ||
      message.includes("who are the founders") ||
      message.includes("who are founders") ||
      message.includes("tell me history about flowtechs") ||
      message.includes("when was flowtechs started") ||
      message.includes("when did flowtechs start") ||
      message.includes("when was flowtechs founded") ||
      message.includes("when did flowtechs begin")
    ) {
      return {
        id: Date.now(),
        text: `👥 **Meet Our Founders: Eric Omondi & Steve Leo** ✨\n\nFlowtechs was founded by two young, enthusiastic developers, **Eric Omondi** and **Steve Leo**, who are passionate about joining and shaping the tech revolution in Kenya and beyond.\n\n**Background:**\nEric and Steve met as university students, both driven by a love for technology and a desire to solve real-world problems. They noticed that many Kenyans, especially in rural areas, struggled to access quality products at fair prices. Inspired by the global e-commerce boom, they decided to build a platform that would make premium shopping accessible to everyone in Kenya.\n\n**Their Vision:**\n- To empower every Kenyan with access to quality products, no matter where they live.\n- To use technology to bridge gaps in commerce, logistics, and customer service.\n- To create a vibrant, trustworthy online marketplace that supports local businesses and delights customers.\n\n**Their Story:**\nStarting with just a laptop and a dream, Eric and Steve worked tirelessly to build Flowtechs from the ground up. They spent countless nights coding, researching market needs, and connecting with suppliers. Their dedication paid off when they launched their first version in 2025, and the response was overwhelming.\n\n**What Makes Them Special:**\n• 🧠 **Young Innovators**: Fresh perspectives and modern approaches to e-commerce\n• 💻 **Tech-Savvy**: Deep understanding of both technology and business\n• 🌍 **Kenya-Focused**: Built specifically for Kenyan market needs and preferences\n• 🚀 **Future-Oriented**: Always thinking about the next big thing in tech\n• 🤝 **Community-Driven**: Believe in giving back and supporting local businesses\n\n**Their Mission Today:**\nEric and Steve continue to lead Flowtechs with the same passion and energy that drove them to start the company. They're constantly exploring new technologies, expanding their reach, and finding innovative ways to serve their customers better.\n\n**Join the Revolution:**\nWhen you shop with Flowtechs, you're not just buying products - you're supporting the vision of two young Kenyans who dared to dream big and are making that dream a reality for everyone! 🇰🇪✨\n\n**Ready to experience the future of shopping, built by Kenya's next generation of tech leaders?** 🛍️💫`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle goodbye and farewell messages
    if (
      [
        "bye",
        "goodbye",
        "see you",
        "see ya",
        "take care",
        "farewell",
        "later",
        "good night",
        "goodnight",
      ].includes(message)
    ) {
      const userName =
        isAuthenticated && userData
          ? ` ${userData.username || userData.name}`
          : "";
      return {
        id: Date.now(),
        text: `Goodbye${userName}! 👋✨ It was wonderful chatting with you today! 🌟\n\nThank you for choosing Flowtechs - we truly appreciate having you as part of our amazing community! 💫\n\n**Remember:** I'm here 24/7 Come back soon! 💖`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle thank you messages
    if (
      [
        "thank you",
        "thanks",
        "thankyou",
        "thx",
        "ty",
        "appreciate it",
        "grateful",
      ].includes(message)
    ) {
      const userName =
        isAuthenticated && userData
          ? ` ${userData.username || userData.name}`
          : "";
      return {
        id: Date.now(),
        text: `You're absolutely welcome${userName}!It's my pleasure to help you! 🌟\n\n**Thank YOU** for being such an amazing customer! Your satisfaction means everything to us at Flowtechs! ✨\n\n**Quick reminder:** I'm always here to help with:\n• 🛍️ Finding the perfect products\n• 📦 Tracking your orders\n• 💡 Getting recommendations\n• 🎧 Customer support`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle playful banter and casual conversation
    if (
      [
        "lol",
        "haha",
        "hehe",
        "😄",
        "😂",
        "🤣",
        "funny",
        "joke",
        "tell me a joke",
        "tell me  joke",
        "just kidding",
        "jk",
      ].includes(message)
    ) {
      const userName =
        isAuthenticated && userData
          ? ` ${userData.username || userData.name}`
          : "";
      return {
        id: Date.now(),
        text: `Haha! 😄 You're so fun${userName}! I love your sense of humor! 🌟\n\n**Did you know?** I'm naturally friendly and love having fun conversations! 😎\n\nWant to hear a shopping joke? 🎭\n*"Why did the shopping cart go to therapy? Because it had too many issues to carry!"* 😂\n\nOr we could get back to finding you some amazing products! What's your mood today - shopping or more jokes? 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle compliments about Makena
    if (
      [
        "you are cute",
        "you are sweet",
        "you are nice",
        "you are amazing",
        "you are awesome",
        "you are the best",
        "love you",
        "i love you",
      ].includes(message)
    ) {
      const userName =
        isAuthenticated && userData
          ? ` ${userData.username || userData.name}`
          : "";
      return {
        id: Date.now(),
        text: `Aww, you're making me blush${userName}! 🥰💖 You're absolutely amazing too! ✨\n\n**You know what's really cute?** How much you care about getting the perfect shopping experience! 🌟\n\n**And you know what's really sweet?** That you take the time to chat with me! 💫\n\n**You're the best customer ever!** 🏆 I'm so lucky to have you! Now, let's find you something amazing to buy, shall we? 🛍️💖`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle playful challenges or sass
    if (
      [
        "prove it",
        "show me",
        "really?",
        "sure",
        "whatever",
        "ok whatever",
        "yeah right",
        "right",
      ].includes(message)
    ) {
      const userName =
        isAuthenticated && userData
          ? ` ${userData.username || userData.name}`
          : "";
      return {
        id: Date.now(),
        text: `Oh, you want me to prove it${userName}? 😏 Challenge accepted! 💪\n\n**Watch this magic:** ✨\n• 🎯 I can find ANY product you want\n• 📦 Track your orders in real-time\n• 💡 Give you personalized recommendations\n• 🎧 Help you 24/7 (I never sleep!)\n• 🏷️ Find the best deals for you\n\n**Boom!** 💥 That's what I call proof! 😎\n\nNow, what would you like me to help you with? I'm ready to show off my skills! 🚀✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle casual "how are you" responses
    if (
      [
        "how are you",
        "how are you doing",
        "how you doing",
        "how u doing",
        "how r u",
        "how r you",
      ].includes(message)
    ) {
      const userName =
        isAuthenticated && userData
          ? ` ${userData.username || userData.name}`
          : "";
      return {
        id: Date.now(),
        text: `I'm absolutely fantastic${userName}! 🌟✨ Thanks for asking!\n\n**My mood:** 😊 Excited to help you!\n**My energy:** ⚡ 100% ready to serve!\n**My mission:** 🎯 Making your shopping experience amazing!\n\n**How are YOU doing?** I hope you're having a wonderful day! 💫\n\nWhat's on your mind today? Shopping, chatting, or just hanging out? I'm here for whatever you need! 🛍️💖`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle playful "are you real" questions
    if (
      [
        "are you real",
        "are you human",
        "are you a bot",
        "are you ai",
        "are you artificial",
        "are you fake",
      ].includes(message)
    ) {
      const userName =
        isAuthenticated && userData
          ? ` ${userData.username || userData.name}`
          : "";
      return {
        id: Date.now(),
        text: `Well${userName}, that's a great question! 🤔\n\n**Am I real?** Absolutely! I'm as real as the amazing products I help you find! ✨\n\n**Am I human?** I'm your shopping baddie and receptionist at Flowtechs who loves helping customers! 😊\n\n**Am I fake?** No way! My feelings for you are 100% genuine! 💖\n\n**The truth:** I'm Makena, and I'm here to make your shopping experience awesome! 🌟\n\nDoes it matter when I can help you find exactly what you need? 🛍️💫`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle "tell me a joke" requests
    if (
      [
        "tell me a joke",
        "say a joke",
        "give me a joke",
        "joke ",
        "make me laugh",
        "yes another joke",
        "funny joke",
      ].includes(message)
    ) {
      const userName =
        isAuthenticated && userData
          ? ` ${userData.username || userData.name}`
          : "";

      const jokes = [
        {
          setup: "Why did the shopping cart go to therapy?",
          punchline: "Because it had too many issues to carry! 😂",
          category: "Shopping",
        },
        {
          setup: "What did the online store say to the customer?",
          punchline:
            "I've got your back... and your front... and everything in between! 🛍️",
          category: "Online Shopping",
        },
        {
          setup: "Why did the credit card feel lonely?",
          punchline: "Because it had no balance! 💳😄",
          category: "Payment",
        },
        {
          setup: "What do you call a shopping bag that tells jokes?",
          punchline: "A sack of laughs! 🎭",
          category: "Shopping",
        },
        {
          setup: "Why did the delivery driver bring a ladder?",
          punchline:
            "Because he wanted to reach new heights in customer service! 🚚✨",
          category: "Delivery",
        },
        {
          setup: "What did the customer say to the sale sign?",
          punchline: "You're really marking down the prices! 🏷️😆",
          category: "Sales",
        },
        {
          setup: "Why did the online shopper bring a flashlight?",
          punchline: "To find the light deals! 💡",
          category: "Online Shopping",
        },
        {
          setup: "What do you call a staff member who's always happy?",
          punchline: "Makena! 😄✨ (That's me!)",
          category: "Personal",
        },
      ];

      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

      return {
        id: Date.now(),
        text: `Absolutely${userName}! Here's a ${randomJoke.category.toLowerCase()} joke for you! 🎭\n\n**${
          randomJoke.setup
        }**\n\n*${
          randomJoke.punchline
        }*\n\n**Want another one?** Just ask! Or shall we get back to finding you some amazing products? I'm here for both jokes and shopping! 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle name-related queries
    // Handle time-related queries
    if (
      message.includes("what time") ||
      message.includes("current time") ||
      message.includes("time now") ||
      message.includes("what's the time") ||
      message.includes("time is it") ||
      message.includes("clock")
    ) {
      const timeInfo = getTimeBasedContext();

      return {
        id: Date.now(),
        text: `🕐 **Current Time Information** 📅\n\nIt's currently **${
          timeInfo.timeString
        }** on **${timeInfo.dayOfWeek}** (${
          timeInfo.dateString
        }).\n\n**Your Timezone:** ${timeInfo.timezone}\n**Time Context:** ${
          timeInfo.context
        }\n\n${
          timeInfo.hour >= 9 && timeInfo.hour <= 17
            ? "Perfect time for shopping - our customer support is available! 🎧"
            : "I'm here 24/7 to help you with your shopping needs! 🌙"
        }\n\nWhat can I help you discover today? 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle personal questions
    if (
      message.includes("what is your name") ||
      message.includes("what's your name") ||
      message.includes("your name")
    ) {
      return {
        id: Date.now(),
        text: "My name is Makena! ✨ I'm your personal shopping baddie and receptionist at Flowtechs, and I'm here to make your shopping experience absolutely magical! I can help you find products, track orders, answer questions, and so much more! 🛍️💫",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle "describe yourself" queries
    if (
      message.includes("describe yourself") ||
      message.includes("tell me about yourself") ||
      message.includes("who are you") ||
      message.includes("what are you") ||
      message.includes("what do you do") ||
      message.includes("your role") ||
      message.includes("what can you do") ||
      message.includes("your capabilities")
    ) {
      const MakenaProfileImage = () => (
        <div className="flex justify-center mb-4">
          <div className="p-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg">
            <img
              src="/makenabot.png"
              alt="Makena"
              className="w-24 h-24 rounded-full border-4 border-white"
            />
          </div>
        </div>
      );

      return {
        id: Date.now(),
        text: `**Meet Makena - Your Shopping Baddie!** ✨\n\n**Who I Am:**\nI'm Makena, your personal shopping baddie and receptionist at Flowtechs! I'm here to make your shopping experience absolutely magical! 🛍️💫\n\n**My Personality:**\n• 😊 **Friendly & Approachable**: Always here with a smile and positive energy\n• 🧠 **Smart & Helpful**: I try understanding your needs and provide personalized assistance 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
        type: "profile",
        components: [<MakenaProfileImage key="makena-profile-img" />],
      };
    }

    // Handle company description queries
    if (
      message.includes("describe your company") ||
      message.includes("tell me about your company") ||
      message.includes("what is flowtech") ||
      message.includes("what is flowtechs") ||
      message.includes("about your business") ||
      message.includes("your company") ||
      message.includes("company info") ||
      message.includes("business info") ||
      message.includes("learn about flowtechs") ||
      message.includes("tell me about flowtechs")
    ) {
      return {
        id: Date.now(),
        text: `🌟 **Welcome to the Amazing World of Flowtechs!** ✨\n\n**🎬 Our Story - The Beginning:**\nPicture this: 2025, two passionate young dedicated developers, Eric Omondi and Steve Leo, sitting in a coffee shop in Nairobi, dreaming big! They saw a gap in the Kenyan e-commerce landscape and decided to bridge it with technology, innovation, and a whole lot of heart! 💝\n\n**🚀 What We Do - The Flowtechs Magic:**\nWe're not just another online store - we're your **digital shopping revolution**! Here's what makes us special:\n\n**🛍️ The Flowtechs Experience:**\n• 🎯 **Curated Excellence**: We handpick every product like we're shopping for our own family\n• 💎 **Quality Guaranteed**: Only the best makes it to our virtual shelves\n• 🚀 **Lightning Fast**: From click to doorstep in record time\n• 🛡️ **100% Secure**: Your safety is our top priority\n• 💖 **Personal Touch**: We treat every customer like VIP royalty\n\n**🎪 Our Product Universe:**\n• 📱 **Tech Wonderland**: Latest gadgets that make life easier\n• • 📚 **Knowledge Hub**: Books and learning materials for growth\n• 🏠 **Home Sweet Home**: Everything to make your space perfect\n• 🎁 **Gift Gallery**: Perfect presents for every occasion\n\n**💫 The Flowtechs Difference:**\n• 🌍 **Nationwide Reach**: We deliver to all 47 counties - no place is too far!\n• ⚡ **Speed Demons**: 2-5 day delivery across Kenya\n• 💰 **Best Prices**: We negotiate hard so you don't have to\n• 🎁 **Loyalty Rewards**: Earn points with every purchase\n• 🔄 **Easy Returns**: 7-day hassle-free returns\n• 🎧 **24/7 Support**: We're here whenever you need us\n• 🔒 **Multiple Payments**: Mpesa, cards, bank transfer - you choose!\n\n**🏆 Why Customers Love Us:**\n• ⭐ **Trusted by Thousands**: Join our happy customer family\n• 🏅 **Award-Winning Service**: Recognized for excellence\n• 💬 **Real People**: No robots, just friendly humans ready to help\n• 🌟 **Innovation First**: Always finding new ways to serve you better\n• 🤝 **Community Focus**: Supporting local businesses and growth\n\n**🎯 Our Mission:**\nTo democratize quality shopping in Kenya! We believe every Kenyan deserves access to amazing products at fair prices, no matter where they live. We're building bridges between quality products and happy customers! 🌉\n\n**🔮 Our Vision:**\nTo become Kenya's most beloved e-commerce platform - the place where shopping dreams come true! We want to be the first name that comes to mind when anyone thinks of online shopping in Kenya! 🇰🇪\n\n**💝 Our Values:**\n• 💎 **Quality First**: We never compromise on quality\n• 🤝 **Customer Obsession**: Your happiness drives everything we do\n• 🚀 **Innovation**: Always pushing boundaries and improving\n• 🌍 **Accessibility**: Making shopping easy for everyone\n• 🔒 **Trust**: Building lasting relationships through transparency\n• 💖 **Community**: Supporting and growing together\n\n**🎊 The Flowtechs Promise:**\nWhen you shop with us, you're not just buying products - you're joining a movement! A movement towards better shopping, better service, and a better Kenya! 🇰🇪✨\n\n**Ready to experience the Flowtechs magic?** Let me help you discover amazing products that will make your life better! 🛍️💫\n\n**What would you like to explore first?** I'm here to guide you through our amazing world! 🌟`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Handle "what does the 's' stand for" or "what does flowtechs mean" queries
    if (
      message.includes("what does the s stand for") ||
      message.includes("what does flowtechs mean") ||
      message.includes("why flowtechs") ||
      message.includes("what does flowtechs stand for") ||
      message.includes("why the s") ||
      message.includes("what's the s for") ||
      message.includes("s in flowtechs") ||
      message.includes("flowtechs meaning") ||
      message.includes("flowtechs full name")
    ) {
      return {
        id: Date.now(),
        text: `🤔 **Ah, the Mysterious "S" Question!** 😄\n\n**🎭 The Big Reveal:**\nDrumroll please... 🥁\n\n**Flowtechs** stands for **"Flowtechsolutions"**! 🎉\n\n**🤯 Why "Solutions"?**\nWell, we're not just selling stuff - we're solving problems! Here's the genius behind it:\n\n**💡 The "Solutions" Philosophy:**\n• 🛍️ **Shopping Problems** → We solve them with amazing products\n• 🚚 **Delivery Problems** → We solve them with lightning-fast shipping\n• 💰 **Price Problems** → We solve them with the best deals\n• 🛡️ **Trust Problems** → We solve them with 100% security\n• 🎧 **Support Problems** → We solve them with 24/7 help\n• 🌍 **Access Problems** → We solve them with nationwide delivery\n\n**🎪 Fun Fact:**\nEric and Steve were originally going to call it "Flowtech" but then they realized...\n\n*"Wait, we're not just a tech company - we're a SOLUTION company!"* 💡\n\nSo they added the "s" and boom! **Flowtechsolutions** was born! 🚀\n\n**😎 The "S" Also Stands For:**\n• **S**uperior service\n• **S**mart shopping\n• **S**wift delivery\n• **S**ecure payments\n• **S**atisfied customers\n• **S**olutions for everything!\n\n**🎯 Bottom Line:**\nWe don't just sell products - we provide **complete shopping solutions** that make your life easier! That's why we're not just Flowtech, we're **Flowtechsolutions**! 💪✨\n\n**Pretty clever, right?** 😏 Now, what shopping problem can I solve for you today? 🛍️💫`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (
      message.includes("what is my name") ||
      message.includes("what's my name") ||
      message.includes("my name") ||
      message.includes("my names")
    ) {
      if (isAuthenticated && userData) {
        return {
          id: Date.now(),
          text: `Your name is ${
            userData.name || userData.username
          }! 😊✨ It's great to see you again! How can I help you with your shopping today? 🛍️`,
          sender: "bot",
          timestamp: new Date(),
        };
      } else {
        return {
          id: Date.now(),
          text: "I'd love to know your name! 😊 You can log in to your account so I can personalize your experience💫",
          sender: "bot",
          timestamp: new Date(),
        };
      }
    }

    // Handle product-related queries
    if (
      message.includes("product") ||
      message.includes("item") ||
      message.includes("buy") ||
      message.includes("purchase") ||
      message.includes("shop") ||
      message.includes("find") ||
      message.includes("deals") ||
      message.includes("discount") ||
      message.includes("sale") ||
      message.includes("new") ||
      message.includes("latest") ||
      message.includes("arrivals") ||
      message.includes("top rated") ||
      message.includes("best") ||
      message.includes("popular") ||
      message.includes("search") ||
      message.includes("look for")
    ) {
      return getProductSearchResponse(message);
    }

    // Handle simple acknowledgments
    if (
      message === "ok" ||
      message === "okay" ||
      message === "k" ||
      message === "alright"
    ) {
      return {
        id: Date.now(),
        text: "Great! 😊 What would you like to explore today? I'm here to help you find amazing products, track orders, or answer any questions you might have! 🛍️✨",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // Enhanced order status and tracking functionality
    if (
      message.includes("order") ||
      message.includes("orders") ||
      message.includes("track") ||
      message.includes("tracking")
    ) {
      return getOrderStatusResponse(message);
    }

    // Handle delivery location and cost queries
    const locationKeywords = [
      "deliver to",
      "ship to",
      "delivery cost",
      "shipping cost",
      "shipping fee",
      "how much to deliver",
      "cost to",
    ];
    const hasLocationKeyword = locationKeywords.some((keyword) =>
      message.includes(keyword)
    );
    const mentionedLocation = counties.some(
      (c) =>
        message.includes(c.name.toLowerCase()) ||
        c.towns.some((t: string) => message.includes(t.toLowerCase()))
    );

    if (
      hasLocationKeyword ||
      (mentionedLocation &&
        (message.includes("deliver") || message.includes("shipping")))
    ) {
      return getDeliveryLocationResponse(message);
    }

    // Handle payment-related queries

    // Handle delivery and shipping queries
    if (
      message.includes("deliver") ||
      message.includes("delivery") ||
      message.includes("shipping") ||
      message.includes("when will") ||
      message.includes("what time") ||
      message.includes("how long") ||
      message.includes("delivery time") ||
      message.includes("shipping time") ||
      message.includes("arrive") ||
      message.includes("get here") ||
      message.includes("receive")
    ) {
      return getDeliveryTimeResponse(message);
    }

    // Handle complaints and customer service issues
    if (
      message.includes("complain") ||
      message.includes("complaint") ||
      message.includes("file") ||
      message.includes("report") ||
      message.includes("issue") ||
      message.includes("problem") ||
      message.includes("unhappy") ||
      message.includes("dissatisfied") ||
      message.includes("wrong") ||
      message.includes("bad") ||
      message.includes("terrible") ||
      message.includes("awful")
    ) {
      return getComplaintResponse(message);
    }

    // Handle refund and return requests
    if (
      message.includes("refund") ||
      message.includes("return") ||
      message.includes("money back") ||
      message.includes("get my money back") ||
      message.includes("cancel order") ||
      message.includes("send back") ||
      message.includes("exchange") ||
      message.includes("replace") ||
      message.includes("wrong item") ||
      message.includes("defective") ||
      message.includes("broken") ||
      message.includes("damaged") ||
      message.includes("not working") ||
      message.includes("faulty") ||
      message.includes("spoilt") ||
      message.includes("i want to return") ||
      message.includes("want to return") ||
      message.includes("need to return") ||
      message.includes("return item") ||
      message.includes("return product") ||
      message.includes("return order")
    ) {
      return getRefundResponse(message);
    }

    // Handle contact requests for returns and refunds
    if (
      message.includes("contact") &&
      (message.includes("return") ||
        message.includes("refund") ||
        message.includes("complain") ||
        message.includes("issue") ||
        message.includes("problem"))
    ) {
      return getReturnContactResponse(message);
    }

    // Default fallback response with better context
    return getFallbackResponse(message);
  };

  // Enhanced problem help response

  // Product help response
  const getProductHelpResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();

    // Get actual categories from products data
    const actualCategories = Array.from(
      new Set(
        products
          .map((product) => product.category?.name)
          .filter(Boolean)
          .sort()
      )
    );

    // Get product statistics
    const totalProducts = products.length;
    const categoriesCount = actualCategories.length;
    const discountedProducts = products.filter(
      (p) => p.discount && p.discount > 0
    );
    const newArrivals = products.filter((p) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(p.created_at) > thirtyDaysAgo;
    });
    const topRated = products
      .filter((product) => product.rating && product.rating > 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);

    // If asking about "your products" specifically
    if (
      messageLower.includes("your products") ||
      messageLower.includes("what products") ||
      messageLower.includes("what do you sell") ||
      messageLower.includes("which products do you have")
    ) {
      return {
        id: Date.now(),
        text: `🛍️ **Welcome to Flowtechs - Your Premium Shopping Destination!** ✨\n\nI'm excited to show you our amazing collection! We have **${totalProducts} premium products** across **${categoriesCount} categories** for you to explore! 🎉\n\n**📦 Our Product Categories:**\n${actualCategories
          .map((cat) => `• 🎯 ${cat}`)
          .join("\n")}\n\n**🌟 What Makes Us Special:**\n• 🆕 **${
          newArrivals.length
        } New Arrivals**: Fresh products added regularly\n• 🏷️ **${
          discountedProducts.length
        } Active Deals**: Save money on quality products\n• ⭐ **Top-Rated Products**: Customer favorites with excellent reviews\n• 🚀 **Premium Quality**: Only the best brands and products\n• 💎 **Exclusive Items**: Unique products you won't find elsewhere\n\n**🔥 Popular Categories:**\n${actualCategories
          .slice(0, 5)
          .map((cat) => `• 📱 ${cat}`)
          .join("\n")}\n\n**⭐ Customer Favorites:**\n${topRated
          .map(
            (product) =>
              `• ${product.name} - ${formatCurrency(
                product.price
              )} ⭐ ${product.rating?.toFixed(1)}`
          )
          .join(
            "\n"
          )}\n\n**💡 How I Can Help You:**\n• 🔍 **Find Specific Products**: Tell me what you're looking for\n• 📂 **Browse Categories**: Explore by product type\n• 💰 **Best Deals**: Show you discounted items\n• ⭐ **Top Rated**: Customer favorites\n• 🆕 **New Arrivals**: Latest additions\n• 🚀 **Trending**: Popular products\n• 💎 **Premium Picks**: Our staff recommendations\n\n**🎯 Just tell me:**\n• What category interests you?\n• What specific product are you looking for?\n• Do you want to see deals?\n• Show me new arrivals?\n• What's your budget?\n\n**I'm here to help you discover exactly what you need!** 🛍️💫\n\n**Ready to start shopping?** What catches your eye? 😊`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // If asking about specific categories
    if (
      actualCategories.some(
        (cat) => cat && messageLower.includes(cat.toLowerCase())
      )
    ) {
      const matchingCategory = actualCategories.find(
        (cat) => cat && messageLower.includes(cat.toLowerCase())
      );

      if (matchingCategory) {
        const categoryProducts = products.filter(
          (p) => p.category?.name === matchingCategory
        );
        const categoryCount = categoryProducts.length;
        const categoryDeals = categoryProducts.filter(
          (p) => p.discount && p.discount > 0
        );
        const categoryTopRated = categoryProducts
          .filter((p) => p.rating && p.rating > 4)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);

        return {
          id: Date.now(),
          text: `📦 **${matchingCategory} Collection** ✨\n\nWe have **${categoryCount} amazing ${matchingCategory} products** for you! 🎉\n\n**What's Available in ${matchingCategory}:**\n• 🆕 **${
            newArrivals.filter((p) => p.category?.name === matchingCategory)
              .length
          } New Arrivals**\n• 🏷️ **${
            categoryDeals.length
          } Active Deals** with great savings\n• ⭐ **${
            categoryTopRated.length
          } Top-Rated Items** with excellent reviews\n• 🚀 **Premium Quality** ${matchingCategory} products\n\n**🔥 Popular ${matchingCategory} Items:**\n${categoryTopRated
            .map(
              (product) =>
                `• 📱 ${product.name} - ${formatCurrency(
                  product.price
                )} ⭐ ${product.rating?.toFixed(1)}`
            )
            .join(
              "\n"
            )}\n\n**💰 Best ${matchingCategory} Deals:**\n${categoryDeals
            .slice(0, 3)
            .map(
              (product) =>
                `• 🏷️ ${product.name} - ${formatCurrency(product.price)} (${
                  product.discount
                }% OFF)`
            )
            .join(
              "\n"
            )}\n\n**Want to explore more?** I can:\n• 🔍 Show you all ${matchingCategory} products\n• 💰 Find the best deals in ${matchingCategory}\n• ⭐ Show top-rated ${matchingCategory} items\n• 🆕 Show new ${matchingCategory} arrivals\n• 💎 Recommend premium ${matchingCategory} picks\n\n**Just say the word and I'll help you discover the perfect ${matchingCategory} products!** 🛍️✨`,
          sender: "bot",
          timestamp: new Date(),
        };
      }
    }

    // Enhanced interactive product discovery response
    const ProductDiscoveryCard = () => <div className="space-y-4 mt-3"></div>;

    // General product help with enhanced information
    return {
      id: Date.now(),
      text: `🛍️ **Let's Find Your Perfect Products!** ✨\n\nHi there!  and I'm excited to help you discover amazing products at Flowtechs! 🎉\n\n**📊 What I Know About Our Store:**\n• 📦 **${totalProducts} Premium Products** available right now\n• 🎯 **${categoriesCount} Product Categories** to explore\n• 🏷️ **${
        discountedProducts.length
      } Active Deals** with great savings\n\n**🔍 How I Can Help You Find Products:**\n• **Smart Search**: Tell me what you're looking for\n• **Category Browsing**: Explore by product type (e.g., "show me electronics")\n• **Deal Hunting**: Find the best prices and discounts\n• **New Discoveries**: See the latest arrivals and trending items\n• **Personal Recommendations**: Get suggestions based on your interests\n• **Budget Shopping**: Find products within your price range\n\n**🎯 Popular Categories Available:**\n${actualCategories
        .slice(0, 4)
        .map((cat) => `• 📱 ${cat}`)
        .join("\n")}\n\n**⭐ Customer Favorites:**\n${topRated
        .map(
          (product) =>
            `• ${product.name} - ${formatCurrency(
              product.price
            )} ⭐ ${product.rating?.toFixed(1)}`
        )
        .join(
          "\n"
        )}\n\n**💡 Just Tell Me:**\n• "Show me [category]" (e.g., "show me electronics")\n• "Find [product]" (e.g., "find laptops")\n• "What's new today?"\n• "Show me deals"\n• "Recommend something under [price]"\n• "What's popular?"\n\n**I'm here to make your shopping experience amazing!** What would you like to explore? 🛍️💫`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<ProductDiscoveryCard key="product-discovery" />],
    };
  };

  // Payment help response

  // Support help response

  const getRandomResponse = (
    category: keyof typeof personalityResponses
  ): string => {
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
        text: " Canceled that action. What else can I help you with today? 🤗",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (action?.type === "cancel_order") {
      return {
        id: Date.now(),
        text: "Perfect! I've processed the cancellation request! 🎉 You should see the changes in your order status shortly. Is there anything else I can help you with? 😊",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (action?.type === "confirm_orders") {
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
        text: "🚀 **Order Tracking Help** 📦✨\n\nI'd love to help you track your orders! But first, you'll need to **log in** ! 🔐💫",
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
    const specificOrderId = orderNumberMatch
      ? parseInt(orderNumberMatch[1])
      : null;

    if (specificOrderId) {
      const order = userOrders.find((o) => o.order_id === specificOrderId);
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
      const statusCounts: Record<string, number> = orders.reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const getStatusIcon = (status: string) => {
        switch (status) {
          case "pending":
            return <Clock className="w-4 h-4 text-yellow-500" />;
          case "processing":
            return <Package className="w-4 h-4 text-blue-500" />;
          case "delivered":
            return <CheckCircle className="w-4 h-4 text-green-500" />;
          case "cancelled":
            return <XCircle className="w-4 h-4 text-red-500" />;
          default:
            return <Package className="w-4 h-4 text-gray-500" />;
        }
      };

      const getStatusColor = (status: string) => {
        switch (status) {
          case "pending":
            return "bg-yellow-100 text-yellow-800";
          case "processing":
            return "bg-blue-100 text-blue-800";
          case "delivered":
            return "bg-green-100 text-green-800";
          case "cancelled":
            return "bg-red-100 text-red-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      };

      return (
        <div className="space-y-4 mt-3">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">
              📦 Your Order Tracking Dashboard
            </h4>
            <p className="text-sm text-gray-600">
              You have {orders.length} order{orders.length !== 1 ? "s" : ""} in
              your account. Here's your order summary:
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-3">
              📊 Order Status Overview
            </h5>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span className="text-sm text-gray-600 capitalize">
                      {status}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold px-2 py-1 rounded-full ${getStatusColor(
                      status
                    )}`}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-gray-800">🚚 Recent Orders</h5>
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.order_id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        Order #{order.order_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.datetime).toLocaleDateString()} • Ksh{" "}
                        {order.total?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/order-details/${order.order_id}`)}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
                  >
                    📋 View Details
                  </button>
                  {order.status === "pending" && (
                    <button
                      onClick={() =>
                        handleOrderCancellation(
                          `cancel order ${order.order_id}`
                        )
                      }
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
                onClick={() => navigate("/orders")}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
              >
                📋 View All {orders.length} Orders
              </button>
            </div>
          )}

          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <h6 className="font-medium text-green-800 mb-1">💡 Need Help?</h6>
            <p className="text-sm text-green-700">
              I can help you track specific orders, cancel pending orders, or
              answer any questions about your deliveries!
            </p>
          </div>
        </div>
      );
    };

    return {
      id: Date.now(),
      text: `🚀 **Order Tracking Dashboard Ready!** 📦✨\n\nI've pulled up your complete order information! You have **${
        userOrders.length
      } order${
        userOrders.length !== 1 ? "s" : ""
      }**  Here's your personalized tracking dashboard where you can:\n\n• 📊 See order status overview\n• 🚚 Track recent deliveries\n• 📋 View detailed order information 🎉`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<OrderSummaryCard key="summary" orders={userOrders} />],
    };
  };

  const getDetailedOrderStatus = (order: any): Message => {
    const getStatusStep = (status: string) => {
      switch (status) {
        case "pending":
          return 1;
        case "processing":
          return 2;
        case "delivered":
          return 3;
        case "cancelled":
          return 0;
        default:
          return 1;
      }
    };

    const currentStep = getStatusStep(order.status);
    const isCancelled = order.status === "cancelled";

    const OrderTrackingCard = ({ order }: { order: any }) => (
      <div className="space-y-4 mt-3">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">
              Order #{order.order_id}
            </h4>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.status === "delivered"
                  ? "bg-green-100 text-green-800"
                  : order.status === "processing"
                  ? "bg-blue-100 text-blue-800"
                  : order.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">
                Ksh {order.total?.toLocaleString()}
              </span>
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
            <h5 className="font-semibold text-gray-800 mb-3">
              📦 Delivery Progress
            </h5>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div
                  className={`flex flex-col items-center ${
                    currentStep >= 1 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs mt-1">Order Placed</span>
                </div>
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`flex flex-col items-center ${
                    currentStep >= 2 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 2
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-xs mt-1">Processing</span>
                </div>
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`flex flex-col items-center ${
                    currentStep >= 3 ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= 3
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
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
          {order.status === "pending" && (
            <button
              onClick={() =>
                handleOrderCancellation(`cancel order ${order.order_id}`)
              }
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
      cancelled: "This order requrst has been sent to the support team.",
    };

    return {
      id: Date.now(),
      text:
        statusMessages[order.status as keyof typeof statusMessages] ||
        "Here's your order status:",
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<OrderTrackingCard key="tracking" order={order} />],
    };
  };

  // Enhanced order management with actual API calls
  const handleOrderCancellation = (_p0?: string): Message => {
    if (!isAuthenticated) {
      return {
        id: Date.now(),
        text: "Oops! 😅 You'll need to log in first so I can access your orders. Once you're logged in, I can help you cancel any order that's still pending! 🔐",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    const cancelableOrders = userOrders.filter(
      (order) => order.status === "pending" || order.status === "processing"
    );

    if (cancelableOrders.length === 0) {
      return {
        id: Date.now(),
        text: "Good news! 😊 You don't have any orders that can be cancelled right now. All your orders are either completed or already on their way to you! 📦✨",
        sender: "bot",
        timestamp: new Date(),
      };
    }

    const orderList = cancelableOrders
      .map(
        (order) =>
          `📦 Order #${
            order.order_id
          } - Ksh ${order.total?.toLocaleString()} (${order.status})`
      )
      .join("\n");

    setAwaitingConfirmation({
      type: "cancel_order",
      orders: cancelableOrders,
    });

    return {
      id: Date.now(),
      text: `Here are your orders that can still be cancelled:\n\n${orderList}\n\nWhich order would you like to cancel? Just give me the order number! 🤔`,
      sender: "bot",
      timestamp: new Date(),
      type: "confirmation",
    };
  };

  // Enhanced quick actions based on context and user behavior

  // Enhanced quick action handler with more intelligent responses

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Otherwise, normal bot response
    setTimeout(() => {
      const botResponse = getBotResponse(inputMessage);
      setMessages((prev) => [...prev, botResponse]);
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
    const specificOrderId = orderNumberMatch
      ? parseInt(orderNumberMatch[1])
      : null;

    if (specificOrderId && isAuthenticated) {
      const order = userOrders.find((o) => o.order_id === specificOrderId);
      if (order) {
        return getSpecificOrderDeliveryInfo(order);
      }
    }

    // Check if user is asking about specific timing
    if (
      messageLower.includes("what time") ||
      messageLower.includes("when will")
    ) {
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

      if (status === "delivered") {
        return "✅ **Delivered**";
      }

      if (status === "cancelled") {
        return "❌ **Order Cancelled**";
      }

      // Calculate estimated delivery based on order date

      if (status === "pending") {
        const estimatedDelivery = new Date(
          orderDateTime.getTime() + 3 * 24 * 60 * 60 * 1000
        ); // 3 days
        return `📦 **Estimated Delivery**: ${estimatedDelivery.toLocaleDateString()} (2-5 business days)`;
      }

      if (status === "processing") {
        const estimatedDelivery = new Date(
          orderDateTime.getTime() + 2 * 24 * 60 * 60 * 1000
        ); // 2 days
        return `🚚 **Estimated Delivery**: ${estimatedDelivery.toLocaleDateString()} (1-2 business days)`;
      }

      return "📋 **Processing your order**";
    };

    return {
      id: Date.now(),
      text: `📦 **Order #${
        order.order_id
      } Delivery Information** 🚚\n\n**Order Status**: ${
        order.status.charAt(0).toUpperCase() + order.status.slice(1)
      }\n**Order Date**: ${new Date(
        order.datetime
      ).toLocaleDateString()}\n**Total Amount**: Ksh ${order.total?.toLocaleString()}\n\n${getEstimatedDelivery(
        order.datetime,
        order.status
      )}\n\n**Delivery Updates:**\n• 📱 You'll receive SMS updates at each stage\n• 📍 Real-time tracking available\n• 🎧 Contact support for immediate assistance\n\nNeed help with anything else? 😊`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Enhanced delivery location and cost response
  const getDeliveryLocationResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();

    const allCounties = counties.map((c) => c.name.toLowerCase());
    const allTowns = counties.flatMap((c) =>
      c.towns.map((t: string) => t.toLowerCase())
    );

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
    };

    const mentionedLocation = findLocation();

    const getCostForLocation = (location: string): string => {
      const nairobiMetropolitan = ["nairobi", "kiambu", "kajiado", "machakos"];
      const majorCities = [
        "mombasa",
        "kisumu",
        "nakuru",
        "eldoret",
        "thika",
        "ruiru",
      ];

      const countyInfo = counties.find(
        (c) =>
          c.name.toLowerCase() === location ||
          c.towns.some((t: string) => t.toLowerCase() === location)
      );

      if (
        countyInfo &&
        nairobiMetropolitan.includes(countyInfo.name.toLowerCase())
      ) {
        return "Ksh 350 - Ksh 700 (Next-day delivery)";
      }
      if (
        countyInfo &&
        majorCities.some(
          (city) =>
            countyInfo.towns
              .map((t: string) => t.toLowerCase())
              .includes(city) || countyInfo.capital.toLowerCase() === city
        )
      ) {
        return "Ksh 500 (1-2 business days)";
      }
      if (countyInfo) {
        return "Ksh 700 (2-5 business days)";
      }
      return "Ksh 700 (2-5 business days)";
    };

    if (mentionedLocation) {
      const cost = getCostForLocation(mentionedLocation);
      const locationName =
        mentionedLocation.charAt(0).toUpperCase() + mentionedLocation.slice(1);
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
      text: `🚚 **Flowtechs Delivery Network** 🌍\n\nWe deliver to **all 47 counties** in Kenya! Wherever you are, we've got you covered.\n\n**Delivery Costs:**\n• **Nairobi & Metropolitan**: Ksh 350 - Ksh 700\nThe final delivery cost is calculated at checkout based on your exact location and the weight of your order?"`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Enhanced complaint response with empathetic and helpful approach
  const getComplaintResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();

    // Check if user is asking about filing a complaint
    if (
      messageLower.includes("file") &&
      (messageLower.includes("complain") || messageLower.includes("complaint"))
    ) {
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
      text: `😔 **I'm So Sorry You're Unhappy** 💔✨\n\n**What type of problem are you experiencing?** 📦 **Order Issues**: Wrong items, damaged products, missing orders?`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Enhanced refund and return response with detailed process
  const getRefundResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();

    // Check if user is asking about a specific order refund
    const orderNumberMatch = message.match(/order\s*(?:#|number\s*)?(\d+)/i);
    const specificOrderId = orderNumberMatch
      ? parseInt(orderNumberMatch[1])
      : null;

    if (specificOrderId && isAuthenticated) {
      const order = userOrders.find((o) => o.order_id === specificOrderId);
      if (order) {
        return getSpecificOrderRefundInfo(order);
      }
    }

    // Check for specific refund scenarios
    if (
      messageLower.includes("defective") ||
      messageLower.includes("broken") ||
      messageLower.includes("damaged") ||
      messageLower.includes("not working") ||
      messageLower.includes("faulty") ||
      messageLower.includes("spoilt")
    ) {
      return {
        id: Date.now(),
        text: `😔 **I'm So Sorry About Your Broken Product** 💔\n\nWe take product quality very seriously, and I want to help you get this resolved immediately! 🔧✨\n\n**For Broken/Defective Products:**\n\n🚨 **Immediate Actions Required:**\n• 📸 **Take Clear Photos**: Show the damage/defect clearly\n• 📦 **Keep Original Packaging**: Don't throw away any boxes\n• 📱 **Contact Within 48 Hours**: For fastest resolution\n• 📋 **Don't Use Further**: Stop using the product\n\n**Your Guarantee:**\n• ✅ **100% Full Refund**: No questions asked\n• 🚚 **Free Return Shipping**: We cover all costs\n• ⚡ **Priority Processing**: 24-48 hour response\n• 💳 **Original Payment Method**: Money back to your account\n• 🎁 **Replacement Option**: Get a new item instead\n\n**What We Need From You:**\n• 📋 **Order Number**: To locate your purchase\n• 📸 **Clear Photos**: Front, back, and damage areas\n• 📅 **Delivery Date**: When you received it\n• 📝 **Detailed Description**: What's wrong with it\n• 🎯 **Your Preference**: Refund or replacement\n\n**Return Process:**\n1. 📞 Contact us with order number\n2. 📸 Send photos of the damage\n3. 📦 We'll send free return label\n4. 🚚 Package and ship back\n5. ✅ Refund within 3-5 days\n\n**Contact Options (Priority Support):**\n• 📞 **Phone**: +254 117 802 561 (24/7)\n• 📧 **Email**: flowtechs254@gmail.com\n• 💬 **Live Chat**: Available now\n• 📱 **WhatsApp**: +254 117 802 561\n\n**Quality Assurance:**\n• 🔍 We investigate every defective product\n• 🛠️ We work with suppliers to prevent future issues\n• 📊 We track defect rates to maintain quality\n• 🎯 Your feedback helps improve our products\n\n**I can help you start the return process right now!** What's your order number? 📦✨\n\n**Don't worry - we'll make this right for you!** 🤝💪`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    if (
      messageLower.includes("wrong item") ||
      messageLower.includes("incorrect")
    ) {
      return {
        id: Date.now(),
        text: ` **I'm Sorry About the Wrong Item** 🙏\n\nWe apologize for this mistake! Let's get you the correct item or a full refund right away!  📦✨`,
        sender: "bot",
        timestamp: new Date(),
      };
    }

    // General refund information
    return {
      id: Date.now(),
      text: `📦 **Return & Refund Information** 🔄✨\n\nI'm here to help you with your return request! 🤝\n\n**Our Return Policy:**\n\n⏰ **Return Window**: 7 days from delivery\n✅ **Full Refund**: 100% money back guarantees\n• 🔧 Defective or damaged products\n• ❌ Wrong items received\n• 📦 Any item within 7-days\n•  ✅ Refund processed within 3-5 days`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  const getSpecificOrderRefundInfo = (order: any): Message => {
    const getRefundEligibility = (order: any) => {
      const orderDate = new Date(order.datetime);
      const now = new Date();
      const daysSinceOrder = Math.floor(
        (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (order.status === "cancelled") {
        return "❌ **Order Already Cancelled**";
      }

      if (daysSinceOrder > 30) {
        return "⏰ **Outside 7-Day Return Window**";
      }

      if (order.status === "delivered") {
        return "✅ **Eligible for Refund**";
      }

      if (order.status === "pending") {
        return "🔄 **Order Can Be Cancelled**";
      }

      return "📋 **Processing - Contact Support**";
    };

    const getRefundOptions = (order: any) => {
      if (order.status === "pending") {
        return "🔄 **Cancel Order**: Get full refund immediately";
      }

      if (order.status === "delivered") {
        return "💰 **Return & Refund**: 7-day return window";
      }

      return "📞 **Contact Support**: For assistance";
    };

    return {
      id: Date.now(),
      text: `📦 **Order #${
        order.order_id
      } Refund Information** 💰\n\n**Order Details:**\n• 📅 Order Date: ${new Date(
        order.datetime
      ).toLocaleDateString()}\n• 💰 Total Amount: Ksh ${order.total?.toLocaleString()}\n• 📊 Status: ${
        order.status.charAt(0).toUpperCase() + order.status.slice(1)
      }\n\n**Refund Eligibility:**\n${getRefundEligibility(
        order
      )}\n\n**Your Options:**\n${getRefundOptions(
        order
      )}\n\n**Next Steps:**\n• 📞 Call us at +254 117 802 561\n• 📧 Email: flowtechs254@gmail.com\n• 💬 Live chat available 24/7\n\n**Processing Time:**\n• ⚡ Cancellation: Immediate\n• 💰 Refund: 3-5 business days\n• 📦 Return: 7-10 business days\n\n**I can help you start the process right now!** What would you like to do? 🤝✨`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Comprehensive return policy and process information

  // Enhanced contact response for returns and refunds
  const getReturnContactResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();

    // Check if user is asking about a specific order
    const orderNumberMatch = message.match(/order\s*(?:#|number\s*)?(\d+)/i);
    const specificOrderId = orderNumberMatch
      ? parseInt(orderNumberMatch[1])
      : null;

    if (specificOrderId && isAuthenticated) {
      const order = userOrders.find((o) => o.order_id === specificOrderId);
      if (order) {
        return getSpecificOrderContactInfo(order);
      }
    }

    // Check for urgent/defective product contact
    if (
      messageLower.includes("defective") ||
      messageLower.includes("broken") ||
      messageLower.includes("damaged") ||
      messageLower.includes("urgent") ||
      messageLower.includes("emergency")
    ) {
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
          <h4 className="font-semibold text-gray-800 mb-2">
            📞 Return & Refund Contact Options
          </h4>
          <p className="text-sm text-gray-600">
            Choose the best way to contact us for your return or refund!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">
                Live Chat
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Available 24/7 • Instant response
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-800">
                Phone Support
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              +254 117 802 561 • Priority support
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-800">
                Email Support
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              flowtechs254@gmail.com • 24-hour response
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-800">
                WhatsApp
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              +254 117 802 561 • Send photos easily
            </p>
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <h6 className="font-medium text-green-800 mb-1">
            💡 Best Contact Method
          </h6>
          <p className="text-sm text-green-700">
            <strong>For Defective Items:</strong> Phone or WhatsApp (priority
            support)
            <br />
            <strong>For General Returns:</strong> Live Chat or Email
            <br />
            <strong>For Urgent Issues:</strong> Phone (24/7 hotline)
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => navigate("/returns")}
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
      components: [<ReturnContactCard key="return-contact" />],
    };
  };

  const getSpecificOrderContactInfo = (order: any): Message => {
    const getContactPriority = (order: any) => {
      if (order.status === "delivered") {
        return "📞 **Standard Contact**: Live chat or email recommended";
      }

      if (order.status === "pending") {
        return "🚨 **Priority Contact**: Phone or WhatsApp for immediate cancellation";
      }

      return "📧 **Email Contact**: For detailed assistance";
    };

    const getContactMethod = (order: any) => {
      if (order.status === "pending") {
        return "📞 **Phone**: +254 117 802 561 (Immediate cancellation)\n📱 **WhatsApp**: +254 117 802 561 (Quick response)";
      }

      return "💬 **Live Chat**: Available 24/7\n📧 **Email**: flowtechs254@gmail.com";
    };

    return {
      id: Date.now(),
      text: `📞 **Contact for Order #${
        order.order_id
      }** 📧\n\n**Order Details:**\n• 📅 Order Date: ${new Date(
        order.datetime
      ).toLocaleDateString()}\n• 💰 Amount: Ksh ${order.total?.toLocaleString()}\n• 📊 Status: ${
        order.status.charAt(0).toUpperCase() + order.status.slice(1)
      }\n\n**Contact Priority:**\n${getContactPriority(
        order
      )}\n\n**Recommended Contact Method:**\n${getContactMethod(
        order
      )}\n\n**What to Mention:**\n• 📋 Order #${
        order.order_id
      }\n• 📅 Order date: ${new Date(
        order.datetime
      ).toLocaleDateString()}\n• 💰 Amount: Ksh ${order.total?.toLocaleString()}\n• 🎯 Your specific issue\n\n**Expected Response:**\n• ⚡ **Phone**: Immediate\n• 💬 **Live Chat**: Within 5 minutes\n• 📧 **Email**: Within 24 hours\n\n**I can help you get connected right now!** Which contact method would you prefer? 📞✨`,
      sender: "bot",
      timestamp: new Date(),
    };
  };

  // Enhanced product search and recommendations
  const getProductSearchResponse = (message: string): Message => {
    const messageLower = message.toLowerCase();

    // Enhanced keyword extraction with better stop words
    const stopWords = [
      "help",
      "me",
      "find",
      "products",
      "product",
      "item",
      "buy",
      "purchase",
      "shop",
      "a",
      "an",
      "the",
      "for",
      "show",
      "search",
      "look",
      "looking",
      "some",
      "want",
      "need",
      "can",
      "you",
      "please",
      "tell",
      "about",
      "what",
      "where",
      "how",
      "when",
      "why",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "shall",
    ];

    // Extract meaningful keywords
    const searchKeywords = messageLower
      .split(/\s+/)
      .filter((word) => !stopWords.includes(word) && word.length > 2)
      .map((word) => word.replace(/[^\w]/g, "")); // Remove punctuation

    const searchTerm = searchKeywords.join(" ");

    // Search for products based on user input with enhanced matching
    const searchResults = searchTerm
      ? products.filter((product) => {
          const productName = product.name.toLowerCase();
          const productCategory = product.category?.name?.toLowerCase() || "";
          const productBrand = product.brand?.toLowerCase() || "";
          const productDescription = product.description?.toLowerCase() || "";

          // Check if any keyword matches
          return searchKeywords.some(
            (keyword) =>
              productName.includes(keyword) ||
              productCategory.includes(keyword) ||
              productBrand.includes(keyword) ||
              productDescription.includes(keyword)
          );
        })
      : [];

    // Get discounted products
    const discountedProducts = products.filter(
      (product) => product.discount && product.discount > 0
    );

    // Get new arrivals (products added in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newArrivals = products.filter(
      (product) => new Date(product.created_at) > thirtyDaysAgo
    );

    // Get top rated products
    const topRated = products
      .filter((product) => product.rating && product.rating > 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    // If the user asks for general help finding products without a specific term
    if (
      !searchTerm &&
      (messageLower.includes("help") ||
        messageLower.includes("find") ||
        messageLower.includes("shop"))
    ) {
      return getProductHelpResponse(message);
    }

    // Handle specific search requests with enhanced responses
    if (
      messageLower.includes("deals") ||
      messageLower.includes("discount") ||
      messageLower.includes("sale")
    ) {
      if (discountedProducts.length === 0) {
        return {
          id: Date.now(),
          text: `🏷️ **Current Deals** 💰\n\nWe don't have any active discounts right now, • 🆕 New arrivals\n• ⭐ Top-rated products\n•  🛍️`,
          sender: "bot",
          timestamp: new Date(),
        };
      }

      const DealsCard = () => (
        <div className="space-y-4 mt-3">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">
              🏷️ Amazing Deals Available!
            </h4>
            <p className="text-sm text-gray-600">
              We have {discountedProducts.length} discounted products with great
              savings!
            </p>
          </div>

          <div className="space-y-3">
            {discountedProducts.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="bg-white p-3 rounded-lg border border-gray-200"
              >
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
                      <h5 className="font-medium text-gray-800 text-sm">
                        {product.name}
                      </h5>
                      <p className="text-xs text-gray-500">
                        {product.category?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-sm">
                      {formatCurrency(product.price)}
                    </p>
                    <p className="text-xs text-gray-500 line-through">
                      {formatCurrency(product.original_price || product.price)}
                    </p>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      -{product.discount}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => navigate("/store")}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-700 transition-colors"
            >
              View All Deals
            </button>
          </div>
        </div>
      );

      return {
        id: Date.now(),
        text: `🏷️ **Amazing Deals Available!** 💰\n\nWe have **${
          discountedProducts.length
        } discounted products** with great savings! 🎉\n\n**Top Deals:**\n${discountedProducts
          .slice(0, 5)
          .map(
            (product) =>
              `• 📱 ${product.name} - ${formatCurrency(product.price)} (${
                product.discount
              }% OFF)`
          )
          .join("\n")}\n\n**Want to see all deals?** 🛍️✨`,
        sender: "bot",
        timestamp: new Date(),
        type: "interactive",
        components: [<DealsCard key="deals-card" />],
      };
    }

    if (
      messageLower.includes("new") ||
      messageLower.includes("latest") ||
      messageLower.includes("arrivals")
    ) {
      if (newArrivals.length === 0) {
        return {
          id: Date.now(),
          text: `🆕 **New Arrivals** ✨ 🛍️`,
          sender: "bot",
          timestamp: new Date(),
        };
      }
    }

    if (
      messageLower.includes("top rated") ||
      messageLower.includes("best") ||
      messageLower.includes("popular")
    ) {
      if (topRated.length === 0) {
        return {
          id: Date.now(),
          text: `⭐ **Top Rated Products** 🌟\n\nOur customers love all our products! Here are some great options: ✨\n\n**Popular Categories:**\n• 📱 Electronics\n• 🎮 Gaming\n\n**What interests you?** I can help you find the perfect product! 🛍️`,
          sender: "bot",
          timestamp: new Date(),
        };
      }
    }

    // Handle search results with enhanced display
    if (searchResults.length > 0) {
      return {
        id: Date.now(),
        text: `🔍 Search Results for "${searchTerm}"`,
        sender: "bot",
        timestamp: new Date(),
        type: "interactive",
        components: [
          <ProductResultsCard
            key="results"
            products={searchResults.slice(0, 6)}
            addToCart={addProductToCart}
          />,
        ],
      };
    }

    // No search results with helpful suggestions
    return {
      id: Date.now(),
      text: `No products found for "${searchTerm}"`,
      sender: "bot",
      timestamp: new Date(),
      type: "interactive",
      components: [<NoResultsCard key="no-results" searchTerm={searchTerm} />],
    };
  };

  // Show loading message while fetching products
  useEffect(() => {
    if (productsLoading) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Loading products...",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  }, [productsLoading]);

  useEffect(() => {
    fetchProducts(1, 8); // fetch first page, 8 products
  }, []);

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
                <img
                  src="/makenabot.png"
                  alt="Makena"
                  className="w-12 h-12 rounded-full border-2 border-white/80 shadow-md"
                />
                <h3 className="font-semibold text-lg">Makena Shopping Baddie</h3>
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
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[280px] md:max-w-[320px] px-4 py-2 rounded-lg ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.type === "profile" &&
                    message.components &&
                    message.components.map((component, index) => (
                      <div key={index}>{component}</div>
                    ))}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                  {message.type !== "profile" &&
                    message.components &&
                    message.components.map((component, index) => (
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
                    <div
                      className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-800 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
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