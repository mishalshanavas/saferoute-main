import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// You can get a free API key from https://www.mapbox.com/
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'; // Demo token - replace with your own

const MapboxMap = ({ 
  startCoords, 
  endCoords, 
  routePoints = [], 
  className = "w-full h-96" 
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return; // Map already initialized

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-122.4194, 37.7749], // San Francisco
      zoom: 12
    });

    // Add navigation controls
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when coordinates change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
    }

    // Add start marker
    if (startCoords) {
      const startEl = document.createElement('div');
      startEl.className = 'w-8 h-8 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer';
      startEl.innerHTML = '<div class="w-3 h-3 bg-white rounded-full"></div>';
      
      startMarkerRef.current = new mapboxgl.Marker({
        element: startEl,
        anchor: 'bottom'
      })
        .setLngLat([startCoords[1], startCoords[0]])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="text-gray-900 text-sm"><strong>Start Location</strong></div>'))
        .addTo(mapRef.current);
    }

    // Add end marker
    if (endCoords) {
      const endEl = document.createElement('div');
      endEl.className = 'w-8 h-8 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer';
      endEl.innerHTML = '<div class="w-4 h-4 text-white">📍</div>';
      
      endMarkerRef.current = new mapboxgl.Marker({
        element: endEl,
        anchor: 'bottom'
      })
        .setLngLat([endCoords[1], endCoords[0]])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="text-gray-900 text-sm"><strong>Destination</strong></div>'))
        .addTo(mapRef.current);
    }

    // Fit bounds if both markers exist
    if (startCoords && endCoords) {
      const bounds = new mapboxgl.LngLatBounds()
        .extend([startCoords[1], startCoords[0]])
        .extend([endCoords[1], endCoords[0]]);
      
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        duration: 1000
      });
    }
  }, [startCoords, endCoords]);

  // Update route when route points change
  useEffect(() => {
    if (!mapRef.current || routePoints.length === 0) return;

    mapRef.current.on('load', () => {
      // Remove existing route layers and sources
      if (mapRef.current.getLayer('route-shadow')) mapRef.current.removeLayer('route-shadow');
      if (mapRef.current.getLayer('route')) mapRef.current.removeLayer('route');
      if (mapRef.current.getSource('route')) mapRef.current.removeSource('route');

      // Create route GeoJSON
      const routeGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routePoints.map(point => [point[1], point[0]]) // [lng, lat]
        }
      };

      // Add route source and layers
      mapRef.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON
      });

      // Add shadow layer
      mapRef.current.addLayer({
        id: 'route-shadow',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#000000',
          'line-width': 6,
          'line-opacity': 0.4
        }
      });

      // Add main route layer
      mapRef.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00FFFF',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    });

    // If map is already loaded, add route immediately
    if (mapRef.current.isStyleLoaded()) {
      // Remove existing route layers and sources
      if (mapRef.current.getLayer('route-shadow')) mapRef.current.removeLayer('route-shadow');
      if (mapRef.current.getLayer('route')) mapRef.current.removeLayer('route');
      if (mapRef.current.getSource('route')) mapRef.current.removeSource('route');

      // Create route GeoJSON
      const routeGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routePoints.map(point => [point[1], point[0]]) // [lng, lat]
        }
      };

      // Add route source and layers
      mapRef.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON
      });

      // Add shadow layer
      mapRef.current.addLayer({
        id: 'route-shadow',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#000000',
          'line-width': 6,
          'line-opacity': 0.4
        }
      });

      // Add main route layer
      mapRef.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00FFFF',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }
  }, [routePoints]);

  return (
    <div className={className}>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-xl"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default MapboxMap;