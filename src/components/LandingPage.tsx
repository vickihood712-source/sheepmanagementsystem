import React, { useState } from 'react';
import { Sheet as Sheep, Heart, TrendingUp, FileText, Users, Shield, Mail, Phone, MapPin, ShoppingBag, Store, Menu, X } from 'lucide-react';

interface LandingPageProps {
  onShowAuth: (mode: 'login' | 'register') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onShowAuth }) => {
  const [activePage, setActivePage] = useState<'home' | 'about' | 'contact' | 'markets'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (page: 'home' | 'about' | 'contact' | 'markets') => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="liquid-glass shadow-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center cursor-pointer" onClick={() => scrollToSection('home')}>
              <Sheep className="h-8 w-8 text-blue-500 mr-3" />
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">SheepMS</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className={`text-sm font-medium transition-colors ${
                  activePage === 'home' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className={`text-sm font-medium transition-colors ${
                  activePage === 'about' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                About Us
              </button>
              <button
                onClick={() => scrollToSection('markets')}
                className={`text-sm font-medium transition-colors ${
                  activePage === 'markets' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                Markets
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`text-sm font-medium transition-colors ${
                  activePage === 'contact' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                Contact Us
              </button>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex space-x-4">
              <button
                onClick={() => onShowAuth('login')}
                className="px-6 py-2 text-gray-600 hover:text-blue-500 transition-colors font-medium"
              >
                Login
              </button>
              <button
                onClick={() => onShowAuth('register')}
                className="px-6 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-105 shadow-md"
              >
                Register
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-500 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-green-100">
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection('home')}
                  className={`text-left px-4 py-2 text-sm font-medium transition-colors ${
                    activePage === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                  } rounded-md`}
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className={`text-left px-4 py-2 text-sm font-medium transition-colors ${
                    activePage === 'about' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                  } rounded-md`}
                >
                  About Us
                </button>
                <button
                  onClick={() => scrollToSection('markets')}
                  className={`text-left px-4 py-2 text-sm font-medium transition-colors ${
                    activePage === 'markets' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                  } rounded-md`}
                >
                  Markets
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className={`text-left px-4 py-2 text-sm font-medium transition-colors ${
                    activePage === 'contact' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                  } rounded-md`}
                >
                  Contact Us
                </button>
                <div className="border-t border-green-100 pt-4 space-y-2">
                  <button
                    onClick={() => { onShowAuth('login'); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-2 text-gray-600 hover:text-blue-500 transition-colors font-medium text-left rounded-md hover:bg-gray-50"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { onShowAuth('register'); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg hover:from-green-500 hover:to-blue-600 transition-all shadow-md font-medium"
                  >
                    Register
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Content based on active page */}
      {activePage === 'home' && <HomePage onShowAuth={onShowAuth} />}
      {activePage === 'about' && <AboutPage />}
      {activePage === 'markets' && <MarketsPage />}
      {activePage === 'contact' && <ContactPage />}

      {/* Footer */}
      <footer className="py-12 bg-blue-900 border-t border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Sheep className="h-6 w-6 text-green-400 mr-2" />
                <span className="font-semibold text-white">SheepMS</span>
              </div>
              <p className="text-gray-300 text-sm">
                Smart Sheep Management System for modern farmers
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <button onClick={() => scrollToSection('home')} className="block text-gray-300 hover:text-white text-sm transition-colors">Home</button>
                <button onClick={() => scrollToSection('about')} className="block text-gray-300 hover:text-white text-sm transition-colors">About Us</button>
                <button onClick={() => scrollToSection('markets')} className="block text-gray-300 hover:text-white text-sm transition-colors">Markets</button>
                <button onClick={() => scrollToSection('contact')} className="block text-gray-300 hover:text-white text-sm transition-colors">Contact</button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-300 text-sm">
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  info@sheepms.com
                </p>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  +254 700 000 000
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-800 pt-8 text-center">
            <span className="text-gray-300">© 2025 Smart Sheep Management System. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const HomePage: React.FC<{ onShowAuth: (mode: 'login' | 'register') => void }> = ({ onShowAuth }) => {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 content-glass">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Smart Sheep Management Made Easy
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Revolutionize your sheep farming with AI-powered health tracking,
            comprehensive breeding management, and intelligent financial insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onShowAuth('register')}
              className="px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white text-lg font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started Free
            </button>
            <button
              onClick={() => onShowAuth('login')}
              className="px-8 py-4 border-2 border-blue-300 text-gray-700 text-lg font-semibold rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              Login Now
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 content-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Everything You Need to Manage Your Flock
            </h2>
            <p className="text-lg text-gray-600">
              Powerful tools designed by farmers, for farmers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="liquid-glass p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Health Tracking</h3>
              <p className="text-gray-600">
                Advanced algorithms predict health issues before they become serious problems.
              </p>
            </div>

            <div className="liquid-glass p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mb-4">
                <Sheep className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Breeding Management</h3>
              <p className="text-gray-600">
                Track fertility cycles, manage breeding programs, and optimize reproduction.
              </p>
            </div>

            <div className="liquid-glass p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Financial Insights</h3>
              <p className="text-gray-600">
                Comprehensive expense tracking, revenue analysis, and profit optimization.
              </p>
            </div>

            <div className="liquid-glass p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Smart Reports</h3>
              <p className="text-gray-600">
                Generate detailed PDF and Excel reports for better decision making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-based Access Section */}
      <section className="py-20" style={{ backgroundColor: "#98FFB3" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Built for Every Team Member
            </h2>
            <p className="text-lg text-gray-700">
              Role-based dashboards tailored to your specific needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Admin</h3>
              <p className="text-gray-700">Full system control and user management</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Veterinarian</h3>
              <p className="text-gray-700">Health monitoring and medical records</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Staff</h3>
              <p className="text-gray-700">Daily task management and record keeping</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-400 to-blue-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Sheep Farm?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of farmers who trust SheepMS for their flock management
          </p>
          <button
            onClick={() => onShowAuth('register')}
            className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Your Free Trial
          </button>
        </div>
      </section>
    </>
  );
};

const AboutPage: React.FC = () => {
  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">About SheepMS</h1>
          <p className="text-xl text-gray-600">
            Transforming sheep farming through technology and innovation
          </p>
        </div>

        <div className="liquid-glass rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Story</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Founded in 2025, SheepMS was born from a simple observation: sheep farmers needed better tools to manage their flocks efficiently. Our founders, coming from both agricultural and technology backgrounds, recognized the gap between traditional farming methods and modern technology.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Today, SheepMS serves farmers across multiple places, helping them increase productivity, reduce costs, and make data-driven decisions for their operations.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="liquid-glass p-6 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Farmer-First</h3>
              <p className="text-gray-600">
                Every feature we build is designed with farmers' needs in mind, ensuring practical solutions for real-world challenges.
              </p>
            </div>

            <div className="liquid-glass p-6 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Innovation</h3>
              <p className="text-gray-600">
                We continuously improve our platform with cutting-edge technology to give you the competitive edge.
              </p>
            </div>

            <div className="liquid-glass p-6 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Reliability</h3>
              <p className="text-gray-600">
                Your data is secure with us. We maintain 99.9% uptime and enterprise-grade security measures.
              </p>
            </div>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            To empower sheep farmers worldwide with intelligent, accessible, and affordable management tools that drive profitability and sustainability. We believe that every farmer, regardless of their flock size, deserves access to world-class technology that makes their work easier and more rewarding.
          </p>
        </div>
      </div>
    </div>
  );
};

const MarketsPage: React.FC = () => {
  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Marketplace</h1>
          <p className="text-xl text-gray-600">
            Connect with buyers and sellers in the sheep farming community
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="liquid-glass p-8 rounded-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mb-6">
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Buy Sheep</h2>
            <p className="text-gray-600 mb-4">
              Browse our marketplace to find quality sheep from verified sellers. Filter by breed, age, health status, and location to find exactly what you need for your flock.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Verified seller profiles
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Health certificates included
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Secure payment processing
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Transport coordination available
              </li>
            </ul>
          </div>

          <div className="liquid-glass p-8 rounded-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mb-6">
              <Store className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sell Sheep</h2>
            <p className="text-gray-600 mb-4">
              List your sheep for sale and reach thousands of potential buyers. Our platform makes it easy to showcase your animals and manage sales efficiently.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Free listings for registered users
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Wide audience reach
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Integrated inventory management
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Real-time messaging with buyers
              </li>
            </ul>
          </div>
        </div>

        <div className="liquid-glass rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Featured Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Sheep className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">Breeding Stock</h3>
              <p className="text-sm text-gray-500">Premium genetics</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Sheep className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">Lambs</h3>
              <p className="text-sm text-gray-500">Young stock</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Sheep className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">Wool Producers</h3>
              <p className="text-sm text-gray-500">Quality fleece</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Sheep className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-800">Meat Breeds</h3>
              <p className="text-sm text-gray-500">Market ready</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-lg mb-6">Join our marketplace and connect with the sheep farming community</p>
          <a
            href="https://jiji.co.ke/74-sheeps/white"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Access Marketplace
          </a>
        </div>
      </div>
    </div>
  );
};

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">Contact Us</h1>
          <p className="text-xl text-gray-600">
            We're here to help. Reach out to us anytime!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="liquid-glass rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Get In Touch</h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                    <p className="text-gray-600">info@sheepms.com</p>
                    <p className="text-gray-600">support@sheepms.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Phone className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Phone</h3>
                    <p className="text-gray-600">+254 700 000 000</p>
                    <p className="text-gray-600">Mon-Fri, 8am-6pm EAT</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-green-300 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <MapPin className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Office</h3>
                    <p className="text-gray-600">Nairobi, Kenya</p>
                    <p className="text-gray-600">East Africa</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="liquid-glass rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Business Hours</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>9:00 AM - 3:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="liquid-glass rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Us a Message</h2>

              {submitted && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  Thank you for your message! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-lg hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-105 shadow-md"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
