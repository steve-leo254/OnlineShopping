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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // Import toast

const Home: React.FC = () => {
  const navigate = useNavigate();
  // Use the custom hook to fetch products for carousel
  const { isLoading, products, error, fetchProducts } = useFetchProducts();
  const { addToCart } = useShoppingCart();
  const imgEndPoint = "http://127.0.0.1:8000";

  // Ref for carousel container
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollSpeed = 0.7; // Pixels to scroll per frame

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts(1, 100, ""); // Fetch many more products for carousel
  }, [fetchProducts]);

  // Effect for continuous scroll loop carousel (for products)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || products.length === 0) return;

    let animationFrameId: number;
    let isHovered = false;

    const scrollStep = () => {
      if (!isHovered) {
        // Increment scrollLeft
        carousel.scrollLeft += scrollSpeed;

        // When scrollLeft passes half the scrollWidth, reset to 0
        if (carousel.scrollLeft >= carousel.scrollWidth / 2) {
          carousel.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scrollStep);
    };

    animationFrameId = requestAnimationFrame(scrollStep);

    // Handlers to pause scroll on hover
    const handleMouseEnter = () => {
      isHovered = true;
    };
    const handleMouseLeave = () => {
      isHovered = false;
    };

    carousel.addEventListener("mouseenter", handleMouseEnter);
    carousel.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      carousel.removeEventListener("mouseenter", handleMouseEnter);
      carousel.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [products]); // Restart effect when products change

  // Helper function for adding to cart with enhanced alert notification
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

  //  ============== HERO =============
  //  =================================

  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to clear interval safely
  const clearHeroInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Hero carousel images
  const heroImages = [
    {
      src: "https://images.unsplash.com/photo-1675049626914-b2e051e92f23?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Z2FtaW5nJTIwc2V0dXB8ZW58MHx8MHx8fDA%3D",
      alt: "Premium Gaming Setup",
      title: "Elevate Your Gaming",
      subtitle:
        "Discover premium gaming hardware that delivers unmatched performance",
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

  // Auto-slide for hero carousel
  useEffect(() => {
    clearHeroInterval();

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === heroImages.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => {
      clearHeroInterval();
    };
  }, [heroImages.length]); // Remove currentIndex dependency to prevent unnecessary restarts

  const prevSlide = () => {
    clearHeroInterval(); // Clear auto-slide when user manually navigates
    setCurrentIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    clearHeroInterval(); // Clear auto-slide when user manually navigates
    setCurrentIndex((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    clearHeroInterval(); // Clear auto-slide when user manually navigates
    setCurrentIndex(index);
  };

  return (
    <>
      {/* First Section: Sliding Carousel Showing One Image at a Time with Auto Slide */}
      {/* Hero Section with Enhanced Carousel */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">New Arrivals</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                  {heroImages[currentIndex].title}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent block">
                    Experience
                  </span>
                </h1>
                <p className="text-xl text-white/80 max-w-md leading-relaxed">
                  {heroImages[currentIndex].subtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2">
                    <span>{heroImages[currentIndex].cta}</span>
                    <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </button>
                  <button className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-sm">
                    Learn More
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-6 pt-8">
                {[
                  { icon: Shield, text: "Secure Payment" },
                  { icon: Zap, text: "Fast Delivery" },
                  { icon: Star, text: "Premium Quality" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center space-x-2 text-white/80"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image Carousel */}
            <div className="relative">
              <div className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {heroImages.map((image, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-full h-96 lg:h-[500px]"
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <button
                  onClick={prevSlide}
                  className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-3 transition-all duration-300 group"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-3 transition-all duration-300 group"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {heroImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`transition-all duration-300 rounded-full ${
                        currentIndex === index
                          ? "w-8 h-2 bg-white"
                          : "w-2 h-2 bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Carousel Section */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Featured Products
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Discover Amazing
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Products
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Handpicked selection of premium products that deliver exceptional
              quality and performance
            </p>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-900 py-8">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Loading products...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="font-medium">Error loading products</p>
                <p className="text-sm mt-1">{error}</p>
                <button
                  onClick={() => fetchProducts(1, 100, "")}
                  className="mt-3 text-red-600 hover:text-red-800 underline text-sm"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              No products available at the moment.
            </div>
          ) : (
            <div
              ref={carouselRef}
              className="relative overflow-hidden whitespace-nowrap scrollbar-hide"
              style={{ scrollBehavior: "auto" }}
            >
              {/* Render two sets of products for seamless scrolling */}
              {[...products, ...products].map((product, index) => (
                <div
                  key={`${index}-${product.id}`}
                  className="inline-block w-80 mx-4 align-top bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      src={imgEndPoint + product.img_url}
                      alt={product.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 text-yellow-400 fill-current"
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">(4.5)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(product.price)}
                      </span>

                      <button
                        onClick={() => addToCartWithAlert(product)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 hover:shadow-lg transform hover:scale-105"
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/store")}
              className="group bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl"
            >
              <span>View All Products</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;