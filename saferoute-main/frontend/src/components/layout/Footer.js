import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-lg font-light text-gray-900">SafeRoute</span>
          </div>
          
          <div className="flex space-x-8 text-sm text-gray-600">
            <a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="/help" className="hover:text-gray-900 transition-colors">Help</a>
                        </div>
          
          <div className="text-xs text-gray-500">
            © 2024 SafeRoute
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;