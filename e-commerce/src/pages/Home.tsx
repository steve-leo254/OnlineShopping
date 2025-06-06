import React, { useState, useEffect, useRef } from "react";
import { useFetchProducts } from "../components/UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import { toast } from "react-toastify";
import {
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react";
import profesional from "../static/profesional.jpg"; // Assuming you have a profesional image

const Home: React.FC = () => {
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
    if (!carousel) return;

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

  // Helper function for adding to cart with toast notification
  const addToCartWithToast = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      img_url: imgEndPoint + product.img_url,
    });
    toast.success(`${product.name} added to cart!`);
  };
  //  ============== HERO =============
  //  =================================

  const [currentIndex, setCurrentIndex] = useState(0);
  // const carouselRef = useRef(null);
  const intervalRef = useRef(null);
  // const scrollSpeed = 0.5;

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
      src:"https://images.pexels.com/photos/17753940/pexels-photo-17753940/free-photo-of-an-iphone-lying-next-to-a-keyboard-on-a-desk.jpeg?auto=compress&cs=tinysrgb&w=400",
      alt: "Latest Technology",
      title: "Latest Technology",
      subtitle: "Stay ahead with the newest innovations in tech",
      cta: "View New Arrivals",
    },
  ];

  // Auto-slide for hero carousel
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === heroImages.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, heroImages.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* First Section: Sliding Carousel Showing One Image at a Time with Auto Slide */}
      {/* Hero Section with Enhanced Carousel */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
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
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <button
                  onClick={prevSlide}
                  className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-3 transition-all duration-300 group"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-3 transition-all duration-300 group"
                >
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {heroImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`transition-all duration-300 rounded-full ${
                        currentIndex === index
                          ? "w-8 h-2 bg-white"
                          : "w-2 h-2 bg-white/50 hover:bg-white/75"
                      }`}
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
            <div className="text-center text-gray-900 dark:text-white">
              Loading products...
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400">
              Error loading products: {error}
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
                  className="inline-block w-80 mx-4 align-top bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      src={imgEndPoint + product.img_url}
                      alt={product.name}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="h-4 w-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-600 ">
                        (4.5)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold  bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(product.price)}
                      </span>
                      
                      <button
                        onClick={() => addToCartWithToast(product)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                      >
                        
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L2 1M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                          />
                        </svg>
                        <span>Add to cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <button className="group bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl">
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
