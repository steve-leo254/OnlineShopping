import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Target,
  Award,
  Zap,
  Heart,
  Mail,
  Phone,
} from "lucide-react";

interface VisibilityState {
  [key: string]: boolean;
}

const AboutPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState<VisibilityState>({});

  // Gallery images
  const galleryImages = [
    "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg",
    "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg",
    "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg",
    "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg",
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [galleryImages.length]);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll("[data-animate]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
    );
  };

  // Enhanced Contact Button Handlers
  const handleEmailClick = () => {
    const email = "flowtechs254@gmail.com";
    const subject = "Inquiry from Website - Let's Work Together";
    const body = "Hello Steve,\n\nI'm interested in discussing a potential project with you. I'd love to learn more about your services and how we can collaborate.\n\nBest regards,";
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handlePhoneClick = () => {
    const phoneNumber = "0758510206";
    window.location.href = `tel:${phoneNumber}`;
  };

  const values = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Innovation First",
      description:
        "We push boundaries and embrace cutting-edge solutions to deliver exceptional results for our clients.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Client-Centric",
      description:
        "Your success is our priority. We build lasting partnerships through transparency and dedication.",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Quality Excellence",
      description:
        "We maintain the highest standards in every project, ensuring premium results that exceed expectations.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Agile Delivery",
      description:
        "Fast turnaround without compromising quality. We adapt quickly to meet your evolving needs.",
    },
  ];

  const stats = [
    { number: "500+", label: "Projects Completed" },
    { number: "1500+", label: "Happy Clients" },
    { number: "1+", label: "Year Experience" },
    { number: "24/7", label: "Support Available" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              id="hero-text"
              data-animate
              className={`transform transition-all duration-1000 ${
                isVisible["hero-text"]
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-12 opacity-0"
              }`}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                We Build
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}
                  Digital Dreams
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                We're a team of passionate strategists, designers, and
                developers who transform ideas into exceptional digital
                experiences. Small enough to be agile, experienced enough to
                deliver at scale.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/store">
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    Our Products
                  </button>
                </Link>
                <button className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
                  View Our Work
                </button>
              </div>
            </div>

            <div
              id="hero-image"
              data-animate
              className={`transform transition-all duration-1000 delay-300 ${
                isVisible["hero-image"]
                  ? "translate-x-0 opacity-100"
                  : "translate-x-12 opacity-0"
              }`}
            >
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <img
                    className="w-full rounded-2xl shadow-2xl hover:shadow-3xl transition-shadow duration-300"
                    src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/content/office-long-2.png"
                    alt="Our creative workspace"
                  />
                  <img
                    className="w-full rounded-2xl shadow-2xl hover:shadow-3xl transition-shadow duration-300 mt-8"
                    src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/content/office-long-1.png"
                    alt="Team collaboration"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                id={`stat-${index}`}
                data-animate
                className={`text-center transform transition-all duration-700 delay-${
                  index * 100
                } ${
                  isVisible[`stat-${index}`]
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
              >
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            id="values-header"
            data-animate
            className={`text-center mb-16 transform transition-all duration-1000 ${
              isVisible["values-header"]
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Drives Us Forward
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our core values shape every decision we make and every solution we
              create for our clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                id={`value-${index}`}
                data-animate
                className={`group p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                  isVisible[`value-${index}`]
                    ? "translate-y-0 opacity-100"
                    : "translate-y-12 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            id="gallery-header"
            data-animate
            className={`text-center mb-12 transform transition-all duration-1000 ${
              isVisible["gallery-header"]
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Behind the Scenes
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Take a peek into our creative workspace and collaborative
              environment.
            </p>
          </div>

          <div
            id="gallery"
            data-animate
            className={`relative w-full max-w-4xl mx-auto transform transition-all duration-1000 delay-300 ${
              isVisible["gallery"]
                ? "scale-100 opacity-100"
                : "scale-95 opacity-0"
            }`}
          >
            <div className="relative h-96 overflow-hidden rounded-2xl shadow-2xl">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={image}
                    className="w-full h-full object-cover"
                    alt={`Gallery image ${index + 1}`}
                  />
                </div>
              ))}

              {/* Navigation buttons */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 group"
              >
                <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 group"
              >
                <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>

              {/* Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {galleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section with New Contact Buttons */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div
            id="cta"
            data-animate
            className={`transform transition-all duration-1000 ${
              isVisible["cta"]
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
          >
            <Heart className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Build Something Amazing?
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Let's collaborate and turn your vision into reality. We're excited
              to hear about your next project.
            </p>
            
            {/* Enhanced Contact Buttons */}
            {/* Enhanced Contact Buttons with Popup Effects */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center max-w-3xl mx-auto">
              {/* Email Button with Popup */}
              <div className="relative group">
                {/* Floating Popup */}
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-20 border border-blue-200">
                  <div className="text-sm font-medium">💬 Send us a message</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
                </div>

                <button 
                  onClick={handleEmailClick}
                  className="group relative bg-white/10 backdrop-blur-sm text-white px-12 py-6 rounded-3xl font-bold hover:shadow-2xl transform hover:scale-110 transition-all duration-500 overflow-hidden border-2 border-white/20 hover:border-white/40 min-w-[320px] hover:bg-white hover:text-blue-600"
                >
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                  
                  {/* Ripple Effect */}
                  <div className="absolute inset-0 bg-white/20 rounded-3xl scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-30 transition-all duration-700"></div>
                  
                  {/* Floating Particles */}
                  <div className="absolute top-2 left-4 w-2 h-2 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300 delay-100"></div>
                  <div className="absolute bottom-3 right-6 w-1 h-1 bg-white/60 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300 delay-300"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center mb-3">
                      <div className="bg-white/20 p-3 rounded-full mr-4 group-hover:bg-blue-100 transition-all duration-300 group-hover:scale-110">
                        <Mail className="w-7 h-7 text-white group-hover:text-blue-600 group-hover:animate-pulse" />
                      </div>
                      <span className="text-xl font-bold tracking-wide">Get In Touch</span>
                    </div>
                    <div className="text-sm text-white/90 group-hover:text-blue-500 font-medium transition-all duration-300 bg-white/10 group-hover:bg-blue-50 px-3 py-1 rounded-full">
                      📧 flowtechs254@gmail.com
                    </div>
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 group-hover:left-full transition-all duration-1000 transform skew-x-12"></div>
                </button>
              </div>

              {/* Phone Button with Popup */}
              <div className="relative group">
                {/* Floating Popup */}
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-20 border border-green-200">
                  <div className="text-sm font-medium">📞 Let's talk directly</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
                </div>

                <button 
                  onClick={handlePhoneClick}
                  className="group relative bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm text-white px-12 py-6 rounded-3xl font-bold hover:shadow-2xl transform hover:scale-110 transition-all duration-500 overflow-hidden border-2 border-green-400/30 hover:border-green-400/60 min-w-[320px] hover:from-green-400 hover:to-emerald-400"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 via-emerald-400/30 to-teal-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="absolute inset-0 border-2 border-green-400/50 rounded-3xl scale-100 group-hover:scale-110 opacity-0 group-hover:opacity-60 transition-all duration-700"></div>
                  <div className="absolute inset-0 border-2 border-green-400/30 rounded-3xl scale-100 group-hover:scale-125 opacity-0 group-hover:opacity-40 transition-all duration-1000 delay-200"></div>
                  
                  <div className="absolute top-3 right-4 w-2 h-2 bg-green-300/60 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300 delay-150"></div>
                  <div className="absolute bottom-4 left-6 w-1 h-1 bg-emerald-300/80 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-300 delay-400"></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center mb-3">
                      <div className="bg-green-400/30 p-3 rounded-full mr-4 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                        <Phone className="w-7 h-7 text-white group-hover:animate-pulse" />
                      </div>
                      <span className="text-xl font-bold tracking-wide">Schedule a Call</span>
                    </div>
                    <div className="text-sm text-white/90 font-medium transition-all duration-300 bg-green-400/20 group-hover:bg-white/20 px-3 py-1 rounded-full">
                      📞 +254 758 510 206
                    </div>
                  </div>
                  
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:left-full transition-all duration-1000 transform skew-x-12"></div>
                </button>
              </div>
            </div>

            <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-300/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;