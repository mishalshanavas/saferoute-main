import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SimpleMap = ({ 
  startCoords, 
  endCoords, 
  routePoints = [], 
  className = "",
  style = {}
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    mapInstanceRef.current = L.map(mapRef.current).setView([40.7128, -74.0060], 10); // Default to NYC

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    const bounds = [];

    // Add start marker
    if (startCoords) {
      const startMarker = L.marker([startCoords[0], startCoords[1]])
        .addTo(mapInstanceRef.current)
        .bindPopup('Start Location');
      
      markersRef.current.push(startMarker);
      bounds.push([startCoords[0], startCoords[1]]);
    }

    // Add end marker
    if (endCoords) {
      const endMarker = L.marker([endCoords[0], endCoords[1]])
        .addTo(mapInstanceRef.current)
        .bindPopup('End Location');
      
      markersRef.current.push(endMarker);
      bounds.push([endCoords[0], endCoords[1]]);
    }

    // Fit map to show both markers
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        mapInstanceRef.current.setView(bounds[0], 14);
      } else {
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [startCoords, endCoords]);

  // Update route when route points change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing route
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Add new route if we have points
    if (routePoints && routePoints.length > 1) {
      routeLayerRef.current = L.polyline(routePoints, {
        color: '#00FFFF',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(mapInstanceRef.current);

      // Fit map to route
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [20, 20] });
    }
  }, [routePoints]);

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '400px',
        ...style 
      }} 
    />
  );
};

export default SimpleMap;