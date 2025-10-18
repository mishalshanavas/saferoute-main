import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight } from 'lucide-react';
import Silk from '../components/Silk';

const HomePage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col relative">
      {/* Silk Background */}
      <div className="absolute inset-0 z-0">
        <Silk
          speed={5}
          scale={1}
          color="#7B7481"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Minimal Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-sm flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-light text-white">
                SafeRoute
              </Link>
              <div className="flex items-center gap-6">
                <Link to="/contribute" className="text-sm text-white/70 hover:text-white transition-colors">
                  Contribute
                </Link>
                <Link 
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full hover:bg-white/20 transition-colors border border-white/20"
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
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-light text-white mb-6 leading-none">
              SafeRoute
            </h1>
            <p className="text-lg sm:text-xl text-white/70 mb-10 font-light">
              Navigate safely. Arrive securely.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="px-8 py-3 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                {isAuthenticated ? 'Dashboard' : 'Get Started'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contribute"
                className="px-8 py-3 border border-white/20 text-white text-sm font-medium rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm"
              >
                Contribute
              </Link>
            </div>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-white/10 flex-shrink-0 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/60">
              <div>© 2025 SafeRoute</div>
              <div className="flex gap-6">
                <Link to="/contribute" className="hover:text-white transition-colors">
                  Contribute
                </Link>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
