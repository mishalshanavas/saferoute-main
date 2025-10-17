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

const ContributionMap = ({ 
  center = { latitude: 12.9716, longitude: 77.5946 },
  zoom = 13,
  onMapClick,
  markers = [],
  className = "w-full h-96"
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapRef.current).setView(
      [center.latitude, center.longitude],
      zoom
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Handle map clicks
    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        });
      });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.latitude, center.longitude], zoom);
    }
  }, [center.latitude, center.longitude, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = L.marker([markerData.coordinates.latitude, markerData.coordinates.longitude])
        .addTo(mapInstanceRef.current);

      if (markerData.popup) {
        marker.bindPopup(markerData.popup);
      }

      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
    />
  );
};

export default ContributionMap;
