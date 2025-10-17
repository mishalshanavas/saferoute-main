import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Minimal Navigation */}
      <nav className="border-b border-gray-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-light text-gray-900">
              SafeRoute
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/contribute" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Contribute
              </Link>
              <Link 
                to={isAuthenticated ? "/dashboard" : "/login"}
                className="px-6 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
              >
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-light text-gray-900 mb-6 leading-none">
            SafeRoute
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-10 font-light">
            Navigate safely. Arrive securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="px-8 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2"
            >
              {isAuthenticated ? 'Dashboard' : 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contribute"
              className="px-8 py-3 border border-gray-200 text-gray-900 text-sm font-medium rounded-full hover:bg-gray-50 transition-colors"
            >
              Contribute
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <div>© 2025 SafeRoute</div>
            <div className="flex gap-6">
              <Link to="/contribute" className="hover:text-gray-900 transition-colors">
                Contribute
              </Link>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-900 transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
