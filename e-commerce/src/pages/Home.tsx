import React, { useState, useEffect, useRef } from "react";
import { useFetchProducts } from "../components/UseFetchProducts";
import { useShoppingCart } from "../context/ShoppingCartContext";
import { formatCurrency } from "../cart/formatCurrency";
import { Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUserStats } from "../context/UserStatsContext";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, products, fetchProducts } = useFetchProducts();
  const { addToCart } = useShoppingCart();
  const imgEndPoint = import.meta.env.VITE_API_BASE_URL;
  const { refreshStats } = useUserStats();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
              <img
                src={heroImages[currentIndex].src}
                alt={heroImages[currentIndex].alt}
                className="rounded-2xl shadow-2xl w-full object-cover max-h-[500px]"
              />
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
                {" "}
                Products
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      src={imgEndPoint + product.img_url}
                      alt={product.name}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {product.name}
                    </h3>
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
    </>
  );
};

export default Home;
