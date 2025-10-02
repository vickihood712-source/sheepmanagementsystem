import React from 'react';
import { Sheet as Sheep, Heart, TrendingUp, FileText, Users, Shield, Zap } from 'lucide-react';

interface LandingPageProps {
  onShowAuth: (mode: 'login' | 'register') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onShowAuth }) => {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="liquid-glass shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Sheep className="h-8 w-8 text-blue-500 mr-3" />
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">SheepTracker</span>
            </div>
            <div className="flex space-x-4">
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
          </div>
        </div>
      </header>

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
    
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Admin</h3>
        <p className="text-gray-700">Full system control and user management</p>
      </div>

      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-200 to-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sheep className="h-8 w-8 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Farmer</h3>
        <p className="text-gray-700">Complete flock management and insights</p>
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
            Join thousands of farmers who trust SheepTracker for their flock management
          </p>
          <button
            onClick={() => onShowAuth('register')}
            className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-blue-900 border-t border-blue-800">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-center text-white">
      <Sheep className="h-6 w-6 text-green-400 mr-2" />
      <span className="font-semibold">SheepTracker</span>
      <span className="text-gray-300 ml-4">© 2025 Smart Sheep Management System</span>
    </div>
  </div>
</footer>
    </div>
  );
};

export default LandingPage;