import React from 'react';

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Profile Settings</h1>
        <div className="bg-white border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border border-gray-300 text-sm"
                placeholder="user@example.com"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Preferred Route Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 text-sm">
                <option>Safest</option>
                <option>Fastest</option>
                <option>Balanced</option>
              </select>
            </div>
            <button className="bg-gray-900 text-white px-6 py-2 text-sm">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;