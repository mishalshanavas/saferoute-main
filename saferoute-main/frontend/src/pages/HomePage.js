import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleBypassAuth } from '../store/slices/authSlice';

const HomePage = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, bypassAuth } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Navigate <span className="text-blue-600">Safely</span>
            <br />
            Route <span className="text-blue-600">Smartly</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Advanced route planning that prioritizes your safety. Get real-time hazard updates, 
            community-driven insights, and intelligent route optimization powered by AI.
          </p>
          
          {/* Demo Mode Banner */}
          {bypassAuth && (
            <div className="mb-6 bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Demo Mode: Authentication bypassed - all features accessible</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {(isAuthenticated || bypassAuth) ? (
              <Link 
                to="/dashboard" 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Get Started Free
                </Link>
                <Link 
                  to="/login" 
                  className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Safety First</h3>
            <p className="text-gray-600">
              Advanced algorithms analyze crime data, accident reports, and community feedback to recommend the safest routes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Updates</h3>
            <p className="text-gray-600">
              Get instant notifications about hazards, road closures, and traffic conditions from our community network.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Routing</h3>
            <p className="text-gray-600">
              AI-powered route optimization balances safety, speed, and efficiency based on your personal preferences.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Safe Routes Calculated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">98%</div>
              <div className="text-gray-600">Safety Score Average</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">Real-time Monitoring</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">5M+</div>
              <div className="text-gray-600">Community Reports</div>
            </div>
          </div>
        </div>
        
        {/* Developer Controls - Only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 bg-gray-100 border border-gray-300 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Developer Controls</h3>
            <button
              onClick={() => dispatch(toggleBypassAuth())}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                bypassAuth
                  ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
              }`}
            >
              {bypassAuth ? 'Disable Auth Bypass' : 'Enable Auth Bypass'}
            </button>
            <p className="text-xs text-gray-600 mt-2">
              Current: {bypassAuth ? 'Authentication bypassed' : 'Normal authentication'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;