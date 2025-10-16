import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, bypassAuth } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-light text-gray-900">SafeRoute</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Show authenticated navigation when authenticated OR in bypass mode */}
            {(isAuthenticated || bypassAuth) ? (
              <>
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <Link to="/history" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  History
                </Link>
                <Link to="/saved-routes" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Saved
                </Link>
                
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <div className="w-6 h-6 border border-gray-300 flex items-center justify-center">
                      <User className="w-3 h-3" />
                    </div>
                    {bypassAuth && (
                      <span className="text-xs text-gray-400">Demo</span>
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {bypassAuth && (
                      <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
                        Demo Mode
                      </div>
                    )}
                    <Link 
                      to="/profile" 
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Profile
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {bypassAuth ? 'Reset' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-blue-600">
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