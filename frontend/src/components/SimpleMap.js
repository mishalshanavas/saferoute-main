import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { generateOverlayData } from '../data/mapOverlays';

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
  overlayData = null,
  activeOverlays = [],
  className = "",
  style = {}
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const overlayMarkersRef = useRef([]);
  const overlayDataRef = useRef(null);

  // Helper function to create custom emoji markers
  const createEmojiMarker = (emoji, item) => {
    const markerHtml = `
      <div style="
        background: ${item.type === 'high_risk_area' ? '#ff4444' : 
                     item.type === 'security_camera' ? '#4CAF50' : '#2196F3'};
        border: 3px solid white;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        transition: all 0.2s ease;
      " 
      onmouseover="this.style.transform='scale(1.15)'; this.style.zIndex='1001';"
      onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1000';">
        ${emoji}
      </div>
    `;
    
    return L.divIcon({
      html: markerHtml,
      className: 'custom-emoji-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  };

  // Update overlay data - use passed prop or generate if not provided
  const updateOverlayData = () => {
    if (!mapInstanceRef.current) return;
    
    // Use passed overlayData prop if available, otherwise generate random data
    if (overlayData) {
      console.log('📍 Using real overlay data from database');
      overlayDataRef.current = overlayData;
    } else {
      console.log('⚠️ No overlay data provided, generating random data');
      const center = mapInstanceRef.current.getCenter();
      overlayDataRef.current = generateOverlayData(center.lat, center.lng, 15);
    }
    updateOverlayMarkers();
  };

  // Update overlay markers based on active filters
  const updateOverlayMarkers = () => {
    if (!mapInstanceRef.current || !overlayDataRef.current) return;

    // Clear existing overlay markers with proper null checks
    overlayMarkersRef.current.forEach(marker => {
      if (marker && mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker)) {
        try {
          mapInstanceRef.current.removeLayer(marker);
        } catch (error) {
          console.warn('Error removing overlay marker:', error);
        }
      }
    });
    overlayMarkersRef.current = [];

    // Add markers for active overlays
    activeOverlays.forEach(overlayType => {
      const items = overlayDataRef.current[overlayType] || [];
      
      items.forEach(item => {
        const marker = L.marker([item.lat, item.lng], {
          icon: createEmojiMarker(item.icon, item)
        }).addTo(mapInstanceRef.current);

        // Add popup with enhanced item details
        const popupContent = `
          <div style="font-family: system-ui; min-width: 250px; max-width: 300px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 20px;">${item.icon}</span>
              <strong style="color: #333; font-size: 16px;">${item.name}</strong>
            </div>
            <p style="margin: 4px 0; color: #666; font-size: 14px; line-height: 1.4;">${item.description}</p>
            <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid ${item.type === 'high_risk_area' ? '#ff4444' : item.type === 'security_camera' ? '#4CAF50' : '#2196F3'};">
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                <strong>Category:</strong> ${item.category}
              </div>
              ${item.roadName ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;"><strong>Location:</strong> ${item.roadName}</div>` : ''}
              ${item.riskLevel ? `<div style="font-size: 12px; margin-bottom: 4px;"><strong>Risk Level:</strong> <span style="color: ${item.riskLevel === 'high' ? '#ff4444' : '#ff8800'}; font-weight: bold; text-transform: uppercase;">${item.riskLevel}</span></div>` : ''}
              ${item.isIntersection ? '<div style="font-size: 12px; color: #2196F3; font-weight: bold;">📍 Major Intersection</div>' : ''}
              <div style="font-size: 11px; color: #999; margin-top: 6px; padding-top: 4px; border-top: 1px solid #eee;">
                Coordinates: ${item.lat.toFixed(6)}, ${item.lng.toFixed(6)}
              </div>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        overlayMarkersRef.current.push(marker);
      });
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('Initializing map...');
    
    // Create map instance
    mapInstanceRef.current = L.map(mapRef.current, {
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      zoomControl: true
    }).setView([40.7128, -74.0060], 10); // Default to NYC

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);

    console.log('Map initialized successfully');

    // Generate initial overlay data
    updateOverlayData();

    // Add event listener for map move to regenerate overlays
    mapInstanceRef.current.on('moveend', () => {
      setTimeout(() => {
        updateOverlayData();
      }, 500);
    });

    return () => {
      // Clean up overlay markers
      if (overlayMarkersRef.current && mapInstanceRef.current) {
        overlayMarkersRef.current.forEach(marker => {
          if (marker && mapInstanceRef.current.hasLayer(marker)) {
            try {
              mapInstanceRef.current.removeLayer(marker);
            } catch (error) {
              console.warn('Error removing overlay marker during cleanup:', error);
            }
          }
        });
        overlayMarkersRef.current = [];
      }

      // Clean up route markers
      if (markersRef.current && mapInstanceRef.current) {
        markersRef.current.forEach(marker => {
          if (marker && mapInstanceRef.current.hasLayer(marker)) {
            try {
              mapInstanceRef.current.removeLayer(marker);
            } catch (error) {
              console.warn('Error removing route marker during cleanup:', error);
            }
          }
        });
        markersRef.current = [];
      }

      // Clean up route layer
      if (routeLayerRef.current && mapInstanceRef.current && mapInstanceRef.current.hasLayer(routeLayerRef.current)) {
        try {
          mapInstanceRef.current.removeLayer(routeLayerRef.current);
        } catch (error) {
          console.warn('Error removing route layer during cleanup:', error);
        }
        routeLayerRef.current = null;
      }

      // Remove the map instance
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error removing map instance:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update overlay data when overlayData prop changes
  useEffect(() => {
    if (overlayData) {
      console.log('📍 Overlay data updated, refreshing markers');
      updateOverlayData();
    }
  }, [overlayData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update overlay markers when activeOverlays changes
  useEffect(() => {
    updateOverlayMarkers();
  }, [activeOverlays]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    console.log('Updating markers with coords:', { startCoords, endCoords });

    // Clear existing route markers with proper null checks
    markersRef.current.forEach(marker => {
      if (marker && mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker)) {
        try {
          mapInstanceRef.current.removeLayer(marker);
        } catch (error) {
          console.warn('Error removing route marker:', error);
        }
      }
    });
    markersRef.current = [];

    const bounds = [];

    // Add start marker
    if (startCoords && startCoords.length === 2) {
      console.log('Adding start marker at:', startCoords);
      const startMarker = L.marker([startCoords[0], startCoords[1]])
        .addTo(mapInstanceRef.current)
        .bindPopup('Start Location');
      
      markersRef.current.push(startMarker);
      bounds.push([startCoords[0], startCoords[1]]);
    }

    // Add end marker
    if (endCoords && endCoords.length === 2) {
      console.log('Adding end marker at:', endCoords);
      const endMarker = L.marker([endCoords[0], endCoords[1]])
        .addTo(mapInstanceRef.current)
        .bindPopup('End Location');
      
      markersRef.current.push(endMarker);
      bounds.push([endCoords[0], endCoords[1]]);
    }

    // Fit map to show both markers
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        console.log('Centering map on single marker');
        mapInstanceRef.current.setView(bounds[0], 14);
      } else {
        console.log('Fitting map to bounds for multiple markers');
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [startCoords, endCoords]);

  // Update route when route points change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing route with proper null checks
    if (routeLayerRef.current && mapInstanceRef.current && mapInstanceRef.current.hasLayer(routeLayerRef.current)) {
      try {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
      } catch (error) {
        console.warn('Error removing route layer:', error);
      }
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
        position: 'relative',
        zIndex: 1,
        ...style 
      }} 
    />
  );
};

export default SimpleMap;