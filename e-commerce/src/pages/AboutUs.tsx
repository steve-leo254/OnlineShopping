import {
  Laptop,
  Store,
  CreditCard,
  Zap,
  Users,
  Target,
  Rocket,
  Globe,
  Mail,
  MessageCircle,
  TrendingUp,
  HandHeart,
  CheckCircle,
  
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const AboutUs = () => {
  const features = [
    {
      icon: <Laptop className="w-8 h-8" />,
      title: "Premium Electronics",
      description:
        "Curated selection of laptops and accessories from top brands",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Custom E-commerce Solutions",
      description: "Tailored web applications to bring your business online",
    },
    {
      icon: <Store className="w-8 h-8" />,
      title: "Integrated POS System",
      description:
        "Seamless point-of-sale solution for hybrid business operations",
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Built-in Payments",
      description: "Secure, unified payment system across all platforms",
    },
  ];

  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Innovation First",
      description: "Pioneering solutions that transform how businesses operate",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Customer Success",
      description: "Your growth is our mission - we succeed when you succeed",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Seamless Integration",
      description: "Unified systems that work together effortlessly",
    },
  ];

  const [open, setOpen] = useState<number | null>(null);

  const webPlans = [
    {
      name: "Startup",
      price: "Ksh 20000",
      note: "One Time Fee / No other hidden cost",
      color: "bg-green-600",
      button: "bg-green-600 hover:bg-green-700",
      features: [
        "Content Management System",
        "Responsive Professional Design",
        "Content & Images Upload (provided by client)",
        "Website Security included/SSL",
        "Social Media, Online forms integrations",
        "Site Upload & Setup of domain emails",
        "Analytics dashboard",
        "2 months support",
        "1 Yr Domain & Hosting Inclusive",
        "Delivery: 7 working days",
      ],
      whatsapp: "https://wa.me/254117802561?text=I'm%20interested%20in%20the%20Startup%20package",
    },
    {
      name: "Small Business",
      price: "Ksh 35000",
      note: "One Time Fee / No other hidden cost",
      color: "bg-red-600",
      button: "bg-red-600 hover:bg-red-700",
      features: [
        "Content Management System",
        "Responsive Professional Design",
        "SEO Content Copywriting",
        "Images Optimization",
        "Products/Services Showcasing module",
        "Enhanced Website Security included (SSL, Firewall)",
        "Social Media, Chat, Online forms integrations",
        "Site Upload & Setup of domain emails",
        "Analytics dashboard",
        "Basic website SEO",
        "Search Engine Submission",
        "1 Yr Domain & Hosting Inclusive",
        "2 months free support",
        "Delivery: 14 working days",
      ],
      whatsapp: "https://wa.me/254117802561?text=I'm%20interested%20in%20the%20Small%20Business%20package",
    },
    {
      name: "Ecommerce/Company",
      price: "Ksh 70000",
      note: "One Time Fee / No other hidden cost",
      color: "bg-gray-800",
      button: "bg-gray-800 hover:bg-gray-900",
      features: [
        "Content Management System",
        "Responsive Professional Design",
        "Keywords Research",
        "SEO Content Copywriting",
        "Images Capture & Optimization",
        "Product/Services Ordering",
        "Enhanced Website Security (SSL, Firewall...)",
        "Social Media Creation, Chat, Online forms integrations",
        "Site Upload & Setup of domain emails",
        "Analytics dashboard",
        "Standard website SEO",
        "Google Business Creation",
        "Search Engine Submission",
        "Local directories Submission",
        "POS Integration",
        "Payments Integration (Mpesa/PayPal)",
        "1 Yr Domain & Hosting Inclusive",
        "3 months free support",
        "Delivery: From 21 working days",
      ],
      whatsapp: "https://wa.me/254117802561?text=I'm%20interested%20in%20the%20Ecommerce%20package",
    },
    {
      name: "Corporate/Portal",
      price: "Ksh 120000",
      note: "One Time Fee / No other hidden cost",
      color: "bg-red-500",
      button: "bg-red-500 hover:bg-red-600",
      features: [
        "Multisite - One site with subsite (branches/countries/etc)",
        "Multi Language website",
        "Content Management System/Customized Portal",
        "Responsive Professional Design",
        "Keywords Research",
        "SEO Content Copywriting",
        "Images Capture & Optimization",
        "Products/Services Showcasing module",
        "Enhanced Website Security (SSL, Firewall...)",
        "Social Media Creation, Chat, Online forms integrations",
        "Site Upload & Setup of domain emails",
        "Analytics dashboard",
        "Standard website SEO",
        "Google Business Creation",
        "POS Integration",
        "Search Engine Submission",
        "Local directories Submission",
        "Custom Features/Modules",
        "3 months free support",
        "1 Yr Domain & Hosting Inclusive",
        "Delivery: From 30 working days",
      ],
      whatsapp: "https://wa.me/254117802561?text=I'm%20interested%20in%20the%20Corporate%20Portal%20package",
    },
  ];

  const planColors = [
    {
      gradient: "from-teal-400 to-emerald-600",
      badge: "bg-teal-400 border-teal-600",
      button: "bg-teal-500 hover:bg-teal-600 text-white",
    },
    {
      gradient: "from-fuchsia-500 to-pink-600",
      badge: "bg-fuchsia-500 border-pink-600",
      button: "bg-fuchsia-600 hover:bg-pink-600 text-white",
    },
    {
      gradient: "from-yellow-400 to-orange-500",
      badge: "bg-yellow-400 border-orange-500",
      button: "bg-yellow-500 hover:bg-orange-500 text-black",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Floating Contact Icons */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-4">
        <a
          href="mailto:flowtechs254@gmail.com"
          className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
        >
          <Mail className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
        </a>
        <a
          href="https://wa.me/254117802561"
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
        >
          <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
        </a>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-blue-200/30 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-300 mb-8">
              <Rocket className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-purple-700 text-sm font-medium">
                Transforming Commerce
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent">
              Welcome to Flowtech
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Your trusted partner for quality products, exceptional service,
              and seamless online shopping experience
            </p>
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="bg-gradient-to-r from-white/60 to-gray-50/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              What We Do
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              From premium products to cutting-edge technology solutions, we
              deliver excellence across every touchpoint
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 border border-purple-200">
                  <TrendingUp className="w-8 h-8 text-purple-600 group-hover:text-purple-700 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Business Empowerment
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  We help entrepreneurs launch and scale their businesses with
                  access to quality products, without the hassle of inventory
                  management.
                </p>
              </div>
            </div>

            <div className="group">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 border border-purple-200">
                  <Zap className="w-8 h-8 text-purple-600 group-hover:text-purple-700 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Fast Delivery
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Reliable and fast shipping options to get your orders
                  delivered safely to your doorstep within the shortest time
                  possible.
                </p>
              </div>
            </div>

            <div className="group">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 border border-purple-200">
                  <HandHeart className="w-8 h-8 text-purple-600 group-hover:text-purple-700 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Partnership Support
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Complete support system for our partners including training,
                  marketing materials, and ongoing business guidance.
                </p>
              </div>
            </div>

            <div className="group">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 border border-purple-200">
                  <Users className="w-8 h-8 text-purple-600 group-hover:text-purple-700 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Customer Support
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  24/7 customer support team ready to assist with orders,
                  returns, and any questions you might have about our products.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Our Journey
            </h2>
            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                What started as a passion for premium electronics has evolved
                into something extraordinary. We began by curating the finest
                laptops and accessories, but our vision extended far beyond
                traditional retail.
              </p>
              <p>
                Today, we're pioneering the future of commerce by creating
                custom e-commerce solutions that empower businesses to thrive in
                the digital age. Our integrated approach combines cutting-edge
                technology with practical business needs.
              </p>
              <p>
                Every solution we build is designed to seamlessly connect your
                online and offline operations, creating a unified ecosystem that
                grows with your business.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-300/30 to-blue-300/30 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-purple-200 shadow-xl">
              <div className="grid grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="text-center group hover:scale-105 transition-transform duration-300"
                  >
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 border border-purple-200">
                      <div className="text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-gray-900 font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Future Vision */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            The Vision
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              In our next update, we're adding a cash register feature that will
              change how you run your business. Whether customers buy from your
              website or walk into your physical store, everything will
              automatically sync up in real-time. Your inventory, sales, and
              payments will all update instantly across every channel. No more
              juggling different systems or worrying about whether your online
              stock matches what's actually on your shelves. It's one unified
              system that handles everything, making your business run smoother
              and saving you time every day
            </p>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 backdrop-blur-xl rounded-3xl p-8 border border-purple-200 shadow-lg">
              <p className="text-2xl font-semibold text-gray-900 mb-4">
                "Unified Commerce, Unlimited Possibilities"
              </p>
              <p className="text-gray-700 text-lg">
                Join us today and be part of the commerce revolution. Your
                business deserves solutions that work as hard as you do.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-r from-white/60 to-gray-50/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="group">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 border border-purple-200">
                    <div className="text-purple-600 group-hover:text-purple-700 transition-colors duration-300">
                      {value.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rate Card */}
      <div className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Our Rate Card
          </h2>
          <p className="text-center text-lg text-gray-600 mb-12">
            Simple, transparent & quality. No hidden fees.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 my-12">
            {webPlans.map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.6, type: "spring" }}
                whileHover={{ scale: 1.04 }}
                className={`rounded-xl shadow-2xl overflow-hidden border border-gray-200 bg-white flex flex-col`}
                style={{ minHeight: 600 }}
              >
                {/* Header */}
                <div className={`${plan.color} px-6 py-6`}>
                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="text-3xl font-extrabold text-white">{plan.price}</div>
                  <div className="text-sm text-white/90 mt-1">{plan.note}</div>
                </div>
                {/* Features */}
                <div className="flex-1 flex flex-col px-6 py-6">
                  <div className="mb-4 font-semibold text-gray-800">
                    {plan.name === "Startup" && "Ideal for Startups with a need to have a professional online presence"}
                    {plan.name === "Small Business" && "For individuals, SMEs that want to share business information online"}
                    {plan.name === "Ecommerce/Company" && "For stores that sell products or companies promoting their brand online"}
                    {plan.name === "Corporate/Portal" && "Ideal for corporate, with custom integrations, multisite, multi language / membership portals"}
                  </div>
                  <ul className="mb-6 space-y-2 text-gray-700 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={plan.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-auto w-full py-3 rounded-lg font-semibold text-white text-center shadow-lg transition-all duration-300 ${plan.button}`}
                  >
                    Whatsapp Chat Now!
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;