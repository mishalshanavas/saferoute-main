import React from 'react';

const SavedRoutesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Saved Routes</h1>
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No saved routes</p>
          <p className="text-gray-400 text-xs mt-2">Routes you save will be stored here</p>
        </div>
      </div>
    </div>
  );
};

export default SavedRoutesPage;