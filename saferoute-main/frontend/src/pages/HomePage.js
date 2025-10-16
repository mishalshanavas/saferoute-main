import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleBypassAuth } from '../store/slices/authSlice';
import { ArrowRight, Shield, Navigation, Clock } from 'lucide-react';

const HomePage = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, bypassAuth } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-6xl md:text-7xl font-light text-gray-900 mb-8 leading-tight">
            Safe
            <span className="font-medium text-gray-700">Route</span>
          </h1>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Intelligent route planning that puts your safety first. 
            <br />Minimal design. Maximum protection.
          </p>
          
          {/* Demo Mode Banner */}
          {bypassAuth && (
            <div className="mb-8 bg-gray-50 border border-gray-200 text-gray-700 px-6 py-4 max-w-md mx-auto">
              <div className="flex items-center justify-center text-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                <span>Demo Mode Active</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {(isAuthenticated || bypassAuth) ? (
              <Link 
                to="/dashboard" 
                className="group bg-gray-900 text-white px-8 py-4 text-sm font-medium hover:bg-gray-800 transition-all duration-200 flex items-center justify-center"
              >
                Open Dashboard
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="bg-gray-900 text-white px-8 py-4 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="border border-gray-300 text-gray-700 px-8 py-4 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-1 max-w-4xl mx-auto">
          <div className="bg-gray-50 p-8 border-r border-gray-200">
            <div className="w-8 h-8 flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Safety Analysis</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Intelligent risk assessment using real-time data and community insights.
            </p>
          </div>

          <div className="bg-gray-50 p-8 border-r border-gray-200">
            <div className="w-8 h-8 flex items-center justify-center mb-6">
              <Navigation className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Smart Navigation</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Adaptive routing that learns from patterns and prioritizes your preferences.
            </p>
          </div>

          <div className="bg-gray-50 p-8">
            <div className="w-8 h-8 flex items-center justify-center mb-6">
              <Clock className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Real-time Updates</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Live hazard monitoring with instant route adjustments and notifications.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 border-t border-gray-200 pt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center max-w-3xl mx-auto">
            <div>
              <div className="text-2xl font-light text-gray-900 mb-1">10K+</div>
              <div className="text-gray-600 text-xs uppercase tracking-wider">Routes</div>
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900 mb-1">98%</div>
              <div className="text-gray-600 text-xs uppercase tracking-wider">Safety</div>
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900 mb-1">24/7</div>
              <div className="text-gray-600 text-xs uppercase tracking-wider">Monitor</div>
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900 mb-1">5M+</div>
              <div className="text-gray-600 text-xs uppercase tracking-wider">Reports</div>
            </div>
          </div>
        </div>
        
        {/* Developer Controls - Only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-16 bg-gray-50 border border-gray-200 p-6 max-w-sm mx-auto">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Developer Mode</h3>
            <button
              onClick={() => dispatch(toggleBypassAuth())}
              className={`w-full px-4 py-2 text-sm font-medium transition-colors ${
                bypassAuth
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {bypassAuth ? 'Disable Bypass' : 'Enable Bypass'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {bypassAuth ? 'Auth bypassed' : 'Normal auth'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;