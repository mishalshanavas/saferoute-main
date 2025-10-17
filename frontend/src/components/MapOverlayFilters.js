import React from 'react';
import { Shield, Camera, AlertTriangle, Eye } from 'lucide-react';

const MapOverlayFilters = ({ 
  activeFilters, 
  onFilterToggle, 
  className = "" 
}) => {
  const filters = [
    {
      id: 'securityCameras',
      label: 'Security Cameras',
      icon: Camera,
      emoji: '📹',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      activeColor: 'bg-blue-500/40 text-blue-300 border-blue-400'
    },
    {
      id: 'cctvCameras',
      label: 'CCTV Cameras',
      icon: Eye,
      emoji: '📷',
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      activeColor: 'bg-green-500/40 text-green-300 border-green-400'
    },
    {
      id: 'highRiskAreas',
      label: 'High Risk Areas',
      icon: AlertTriangle,
      emoji: '⚠️',
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      activeColor: 'bg-red-500/40 text-red-300 border-red-400'
    }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-medium text-white">Map Overlays</h3>
      </div>
      
      <div className="space-y-2">
        {filters.map(filter => {
          const isActive = activeFilters.includes(filter.id);
          const IconComponent = filter.icon;
          
          return (
            <button
              key={filter.id}
              onClick={() => onFilterToggle(filter.id)}
              className={`w-full p-3 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                isActive ? filter.activeColor : filter.color
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{filter.emoji}</span>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{filter.label}</span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {activeFilters.length > 0 && (
        <div className="mt-4 p-3 bg-black/30 rounded-lg border border-gray-600">
          <div className="text-xs text-gray-400 mb-2">Active Overlays:</div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(filterId => {
              const filter = filters.find(f => f.id === filterId);
              return (
                <span
                  key={filterId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-black/40 rounded-full text-xs"
                >
                  <span>{filter.emoji}</span>
                  <span className="text-gray-300">{filter.label}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapOverlayFilters;