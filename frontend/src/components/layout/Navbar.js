import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, bypassAuth } = useSelector((state) => state.auth);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const navClasses = isHomePage 
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-md border-b border-cyan-500/20' 
          : 'bg-transparent'
      }`
    : 'bg-white border-b border-gray-200';

  const linkClasses = isHomePage 
    ? 'text-gray-300 hover:text-cyan-400 transition-colors duration-300'
    : 'text-gray-600 hover:text-gray-900 transition-colors';

  return (
    <nav className={navClasses}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            {isHomePage ? (
              <span className="text-xl font-light bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-400 transition-all duration-300">
                SafeRoute
              </span>
            ) : (
              <span className="text-xl font-light text-gray-900">SafeRoute</span>
            )}
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Show authenticated navigation when authenticated OR in bypass mode */}
            {(isAuthenticated || bypassAuth) ? (
              <>
                <Link to="/dashboard" className={linkClasses}>
                  Dashboard
                </Link>
                <Link to="/history" className={linkClasses}>
                  History
                </Link>
                <Link to="/saved-routes" className={linkClasses}>
                  Saved
                </Link>
                <Link to="/contribute" className={linkClasses}>
                  Contribute
                </Link>
                
                {/* User Menu */}
                <div className="relative group">
                  <button className={`flex items-center space-x-2 ${linkClasses}`}>
                    <div className={`w-6 h-6 border ${isHomePage ? 'border-cyan-400' : 'border-gray-300'} flex items-center justify-center`}>
                      <User className="w-3 h-3" />
                    </div>
                    {bypassAuth && (
                      <span className="text-xs text-purple-400">Demo</span>
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-2 w-40 ${
                    isHomePage 
                      ? 'bg-black/90 backdrop-blur-md border border-cyan-500/20' 
                      : 'bg-white border border-gray-200'
                  } py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200`}>
                    {bypassAuth && (
                      <div className={`px-3 py-2 text-xs border-b ${
                        isHomePage 
                          ? 'text-purple-400 border-cyan-500/20' 
                          : 'text-gray-500 border-gray-200'
                      }`}>
                        Demo Mode
                      </div>
                    )}
                    <Link 
                      to="/profile" 
                      className={`block px-3 py-2 text-sm transition-colors ${
                        isHomePage 
                          ? 'text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Profile
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                        isHomePage 
                          ? 'text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {bypassAuth ? 'Reset' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/contribute" className={linkClasses}>
                  Contribute
                </Link>
                <Link to="/login" className={linkClasses}>
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className={isHomePage 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black px-4 py-2 text-sm hover:from-cyan-400 hover:to-blue-500 transition-all duration-300'
                    : 'bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 transition-colors'
                  }
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className={linkClasses}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;