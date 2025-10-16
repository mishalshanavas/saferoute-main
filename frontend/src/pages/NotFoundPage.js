import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-light text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-8 text-sm">
          Page not found
        </p>
        <Link 
          to="/" 
          className="bg-gray-900 text-white px-6 py-3 text-sm hover:bg-gray-800 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;