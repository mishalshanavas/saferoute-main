import React from 'react';
import { Camera, AlertTriangle, Eye } from 'lucide-react';

const MapOverlayFilters = ({ 
  activeFilters = [], 
  onFilterToggle, 
  className = "" 
}) => {
  const filters = [
    {
      id: 'cctvCameras',
      label: 'CCTV Cameras',
      icon: Camera,
      emoji: '📹'
    },
    {
      id: 'securityCameras',
      label: 'No Street Lights',
      icon: Eye,
      emoji: '�'
    },
    {
      id: 'highRiskAreas',
      label: 'High Risk Areas',
      icon: AlertTriangle,
      emoji: '⚠️'
    }
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      {filters.map(filter => {
        const isActive = activeFilters.includes(filter.id);
        const IconComponent = filter.icon;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterToggle(filter.id)}
            className={`w-full px-3 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
              isActive 
                ? 'bg-black text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{filter.emoji}</span>
            <IconComponent className="w-3 h-3" />
            <span>{filter.label}</span>
            {isActive && (
              <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MapOverlayFilters;