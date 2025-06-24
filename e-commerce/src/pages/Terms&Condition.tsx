import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Shield,
  Users,
  CreditCard,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Phone,
  Mail,
} from "lucide-react";

const TermsAndConditions: React.FC = () => {
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.pageYOffset / totalHeight) * 100;
      setReadingProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-600",
      content: `By accessing and using FlowTech services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you and FlowTech Ltd.`,
    },
    {
      id: "services",
      title: "Our Services",
      icon: <Globe className="w-6 h-6" />,
      color: "from-blue-500 to-indigo-600",
      content: `FlowTech provides e-commerce solutions, technology products, and related services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time with reasonable notice.`,
    },
    {
      id: "user-accounts",
      title: "User Accounts & Responsibilities",
      icon: <Users className="w-6 h-6" />,
      color: "from-purple-500 to-pink-600",
      content: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration.`,
    },
    {
      id: "payments",
      title: "Payment Terms",
      icon: <CreditCard className="w-6 h-6" />,
      color: "from-orange-500 to-red-600",
      content: `All payments are processed securely through our certified payment partners. Prices are subject to change without notice. Refunds are processed according to our refund policy within 7-14 business days.`,
    },
    {
      id: "shipping",
      title: "Shipping & Delivery",
      icon: <Truck className="w-6 h-6" />,
      color: "from-green-500 to-emerald-600",
      content: `We strive to deliver your orders within the estimated timeframe. Delivery times may vary based on location and product availability. Risk of loss transfers to you upon delivery.`,
    },
    {
      id: "privacy",
      title: "Privacy & Data Protection",
      icon: <Shield className="w-6 h-6" />,
      color: "from-cyan-500 to-blue-600",
      content: `Your privacy is important to us. We collect, use, and protect your personal information in accordance with our Privacy Policy and applicable data protection laws, including GDPR compliance.`,
    },
    {
      id: "limitations",
      title: "Limitations of Liability",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "from-yellow-500 to-orange-600",
      content: `FlowTech's liability is limited to the maximum extent permitted by law. We are not liable for indirect, incidental, special, or consequential damages arising from the use of our services.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white/20 backdrop-blur z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
            Terms & Conditions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Our commitment to transparency and your rights as a valued customer
          </p>
          <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            Last updated: June 19, 2025
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="group bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className="flex items-center justify-between p-8 cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                      {section.title}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <span>Section {index + 1}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                    expandedSections.has(section.id) ? "rotate-90" : ""
                  }`}
                />
              </div>

              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSections.has(section.id)
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-8 pb-8">
                  <div className="pl-16">
                    <div className="w-full h-px bg-gradient-to-r from-gray-200 to-transparent mb-6" />
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Important Information */}
        <div className="mt-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <AlertTriangle className="w-8 h-8 mr-3 text-yellow-300" />
              Important Notice
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">Changes to Terms</h3>
                <p className="text-blue-100 leading-relaxed">
                  We reserve the right to modify these terms at any time.
                  Changes will be effective immediately upon posting on our
                  website. Continued use of our services constitutes acceptance
                  of the revised terms.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Governing Law</h3>
                <p className="text-blue-100 leading-relaxed">
                  These terms are governed by the laws of Kenya. Any disputes
                  shall be resolved through binding arbitration in Nairobi,
                  Kenya, or the courts of competent jurisdiction.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Questions About Our Terms?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Whatsapp Us</h3>
              <a href="https://wa.me/254117802561" className="text-gray-600">
                +254117802561
              </a>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
              <a
                href="mailto:flowtech254@gmail.com"
                className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium hover:underline"
              >
                flowtech254@gmail.com
              </a>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Visit Us</h3>
              <a
                href="https://flowtech.co.ke"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors duration-200 cursor-pointer"
              >
                flowtech.co.ke
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
            <Shield className="w-4 h-4" />
            <span>© 2025 FlowTech Ltd. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;