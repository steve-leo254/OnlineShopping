import React, { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  number: string;
  label: string;
}

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
}

interface ValueCardProps {
  title: string;
  description: string;
}

interface TeamMemberProps {
  initials: string;
  name: string;
  role: string;
}

const AboutUs: React.FC = () => {
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          if (id) {
            setIsVisible(prev => ({ ...prev, [id]: true }));
          }
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('[data-id]');
    elements.forEach(el => {
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const StatCard: React.FC<StatCardProps> = ({ number, label }) => {
    const [animatedNumber, setAnimatedNumber] = useState('0');
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
      if (isVisible['stats'] && !hasAnimated) {
        setHasAnimated(true);
        const finalText = number;
        const hasPlus = finalText.includes('+');
        const hasPercent = finalText.includes('%');
        const numericValue = parseInt(finalText.replace(/\D/g, ''));
        
        if (numericValue > 0) {
          let current = 0;
          const increment = numericValue / 50;
          const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
              setAnimatedNumber(finalText);
              clearInterval(timer);
            } else {
              let display = Math.floor(current).toString();
              if (hasPercent) display += '%';
              if (hasPlus) display += '+';
              if (finalText.includes('/')) display = Math.floor(current) + '/7';
              setAnimatedNumber(display);
            }
          }, 30);
        }
      }
    }, [isVisible, number, hasAnimated]);

    return (
      <div className="stat-card">
        <span className="stat-number">{animatedNumber}</span>
        <span className="stat-label">{label}</span>
      </div>
    );
  };

  const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description }) => (
    <div className="service-card">
      <div className="service-icon">{icon}</div>
      <h3 className="service-title">{title}</h3>
      <p className="service-desc">{description}</p>
    </div>
  );

  const ValueCard: React.FC<ValueCardProps> = ({ title, description }) => (
    <div className="value-card">
      <h3 className="value-title">{title}</h3>
      <p className="value-desc">{description}</p>
    </div>
  );

  const TeamMember: React.FC<TeamMemberProps> = ({ initials, name, role }) => (
    <div className="team-card">
      <div className="team-avatar">{initials}</div>
      <h3 className="team-name">{name}</h3>
      <p className="team-role">{role}</p>
    </div>
  );

  const services = [
    {
      icon: "🛍️",
      title: "Online Marketplace",
      description: "Curated selection of quality products across multiple categories, from electronics to fashion, home goods to health products."
    },
    {
      icon: "🚚",
      title: "Fast Delivery",
      description: "Reliable and fast shipping options to get your orders delivered safely to your doorstep within the shortest time possible."
    },
    {
      icon: "🔒",
      title: "Secure Payments",
      description: "Multiple secure payment options including mobile money, bank transfers, and card payments with advanced encryption technology."
    },
    {
      icon: "💬",
      title: "Customer Support",
      description: "24/7 customer support team ready to assist with orders, returns, and any questions you might have about our products."
    }
  ];

  const stats = [
    { number: "50K+", label: "Happy Customers" },
    { number: "10K+", label: "Products Available" },
    { number: "500+", label: "Orders Daily" },
    { number: "98%", label: "Customer Satisfaction" },
    { number: "24/7", label: "Customer Support" },
    { number: "15+", label: "Counties Served" }
  ];

  const values = [
    {
      title: "Quality First",
      description: "We carefully select every product in our catalog to ensure our customers receive only the highest quality items that meet our strict standards."
    },
    {
      title: "Customer-Centric",
      description: "Every decision we make is centered around providing the best possible experience for our customers, from browsing to delivery and beyond."
    },
    {
      title: "Trust & Transparency",
      description: "We believe in honest communication, transparent pricing, and building long-term relationships based on trust and reliability."
    },
    {
      title: "Innovation",
      description: "We continuously improve our platform and services using the latest technology to make online shopping easier and more enjoyable."
    }
  ];

  const teamMembers = [
    { initials: "SM", name: "Sarah Mwangi", role: "CEO & Founder" },
    { initials: "JK", name: "John Kamau", role: "Head of Operations" },
    { initials: "GN", name: "Grace Njeri", role: "Customer Success Manager" },
    { initials: "DO", name: "David Ochieng", role: "Head of Technology" }
  ];

  return (
    <div className="about-us">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
        }

        .about-us {
          min-height: 100vh;
        }

        .navbar {
          background: #fff;
          padding: 1rem 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
        }

        .logo {
          font-size: 2rem;
          font-weight: bold;
          color: #ff6600;
          cursor: pointer;
        }

        .nav-links {
          display: flex;
          list-style: none;
          gap: 2rem;
        }

        .nav-links a {
          text-decoration: none;
          color: #333;
          font-weight: 500;
          transition: color 0.3s;
          cursor: pointer;
        }

        .nav-links a:hover {
          color: #ff6600;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .hero-section {
          background: linear-gradient(135deg, #ff6600 0%, #ff8533 100%);
          color: white;
          padding: 80px 0;
          text-align: center;
        }

        .hero-title {
          font-size: 3rem;
          margin-bottom: 20px;
          font-weight: 300;
        }

        .hero-subtitle {
          font-size: 1.3rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto;
        }

        .section {
          padding: 60px 0;
        }

        .section-white {
          background: white;
        }

        .section-title {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 50px;
          color: #333;
          font-weight: 300;
        }

        .mission-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          align-items: center;
          margin-bottom: 40px;
        }

        .mission-content h3 {
          color: #ff6600;
          font-size: 2rem;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .mission-content p {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #666;
        }

        .mission-image {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .mission-image img {
          width: 100%;
          height: 350px;
          object-fit: cover;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
          margin-top: 40px;
        }

        .service-card {
          background: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 5px 20px rgba(0,0,0,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid #eee;
        }

        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }

        .service-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          color: #ff6600;
        }

        .service-title {
          font-size: 1.4rem;
          margin-bottom: 15px;
          color: #333;
          font-weight: 600;
        }

        .service-desc {
          color: #666;
          line-height: 1.6;
        }

        .stats-section {
          background: #333;
          color: white;
          padding: 60px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 30px;
          text-align: center;
        }

        .stat-card {
          padding: 20px;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: bold;
          color: #ff6600;
          display: block;
          margin-bottom: 10px;
        }

        .stat-label {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-top: 40px;
        }

        .value-card {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.08);
          border-left: 4px solid #ff6600;
        }

        .value-title {
          font-size: 1.3rem;
          margin-bottom: 15px;
          color: #333;
          font-weight: 600;
        }

        .value-desc {
          color: #666;
          line-height: 1.6;
        }

        .team-section {
          background: white;
          padding: 60px 0;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-top: 40px;
        }

        .team-card {
          text-align: center;
          padding: 20px;
        }

        .team-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #ff6600, #ff8533);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
          font-weight: bold;
        }

        .team-name {
          font-size: 1.3rem;
          margin-bottom: 5px;
          color: #333;
          font-weight: 600;
        }

        .team-role {
          color: #ff6600;
          font-weight: 500;
        }

        .cta-section {
          background: linear-gradient(135deg, #ff6600 0%, #ff8533 100%);
          color: white;
          padding: 60px 0;
          text-align: center;
        }

        .cta-title {
          font-size: 2.5rem;
          margin-bottom: 20px;
          font-weight: 300;
        }

        .cta-subtitle {
          font-size: 1.2rem;
          margin-bottom: 30px;
          opacity: 0.9;
        }

        .cta-button {
          display: inline-block;
          background: white;
          color: #ff6600;
          padding: 15px 40px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          transition: transform 0.3s ease;
          cursor: pointer;
          border: none;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .mission-grid {
            grid-template-columns: 1fr;
          }
          
          .hero-title {
            font-size: 2rem;
          }
          
          .nav-links {
            display: none;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">FLOWTECH</div>
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#products">Products</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">Welcome to Flowtech</h1>
          <p className="hero-subtitle">Your trusted partner for quality products, exceptional service, and seamless online shopping experience</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section section-white">
        <div className="container">
          <div 
            className={`mission-grid fade-in ${isVisible['mission'] ? 'visible' : ''}`}
            data-id="mission"
          >
            <div className="mission-content">
              <h3>Our Mission</h3>
              <p>At Flowtech, we're committed to revolutionizing online shopping by providing customers with access to high-quality products at competitive prices. We believe shopping should be convenient, secure, and enjoyable. Our mission is to connect people with the products they love while delivering exceptional customer service every step of the way.</p>
            </div>
            <div className="mission-image">
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Online shopping experience" />
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="section">
        <div className="container">
          <h2 
            className={`section-title fade-in ${isVisible['services-title'] ? 'visible' : ''}`}
            data-id="services-title"
          >
            What We Do
          </h2>
          <div className="services-grid">
            {services.map((service, index) => (
              <div 
                key={index}
                className={`fade-in ${isVisible[`service-${index}`] ? 'visible' : ''}`}
                data-id={`service-${index}`}
              >
                <ServiceCard {...service} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" data-id="stats">
        <div className="container">
          <h2 className="section-title" style={{ color: 'white' }}>Key Figures</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section section-white">
        <div className="container">
          <h2 
            className={`section-title fade-in ${isVisible['values-title'] ? 'visible' : ''}`}
            data-id="values-title"
          >
            Our Values
          </h2>
          <div className="values-grid">
            {values.map((value, index) => (
              <div 
                key={index}
                className={`fade-in ${isVisible[`value-${index}`] ? 'visible' : ''}`}
                data-id={`value-${index}`}
              >
                <ValueCard {...value} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <h2 
            className={`section-title fade-in ${isVisible['team-title'] ? 'visible' : ''}`}
            data-id="team-title"
          >
            Meet Our Team
          </h2>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div 
                key={index}
                className={`fade-in ${isVisible[`team-${index}`] ? 'visible' : ''}`}
                data-id={`team-${index}`}
              >
                <TeamMember {...member} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to Start Shopping?</h2>
          <p className="cta-subtitle">Join thousands of satisfied customers and discover amazing products at great prices</p>
          <button className="cta-button" onClick={() => console.log('Navigate to shop')}>
            Shop Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;