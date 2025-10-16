import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { Search, Navigation, Shield, Clock, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DashboardPage = () => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [routeType, setRouteType] = useState('fastest');
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter] = useState([37.7749, -122.4194]); // San Francisco default
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);

  // Mock geocoding function (replace with real API)
  const geocodeAddress = async (address) => {
    // This is a mock function. In real implementation, use Google Geocoding API or similar
    const mockCoords = {
      'San Francisco': [37.7749, -122.4194],
      'New York': [40.7128, -74.0060],
      'Los Angeles': [34.0522, -118.2437],
      'Chicago': [41.8781, -87.6298]
    };
    
    const key = Object.keys(mockCoords).find(k => 
      address.toLowerCase().includes(k.toLowerCase())
    );
    
    return key ? mockCoords[key] : [37.7749 + Math.random() * 0.1, -122.4194 + Math.random() * 0.1];
  };

  // Mock route calculation
  const calculateRoute = async () => {
    if (!startLocation || !endLocation) return;
    
    setIsLoading(true);
    
    try {
      const startCoords = await geocodeAddress(startLocation);
      const endCoords = await geocodeAddress(endLocation);
      
      setStartCoords(startCoords);
      setEndCoords(endCoords);
      
      // Mock route points (in real implementation, use routing API)
      const points = [
        startCoords,
        [
          startCoords[0] + (endCoords[0] - startCoords[0]) * 0.3,
          startCoords[1] + (endCoords[1] - startCoords[1]) * 0.3
        ],
        [
          startCoords[0] + (endCoords[0] - startCoords[0]) * 0.7,
          startCoords[1] + (endCoords[1] - startCoords[1]) * 0.7
        ],
        endCoords
      ];
      
      setRoutePoints(points);
      
      // Mock route data
      setRouteData({
        distance: '15.2 km',
        duration: routeType === 'fastest' ? '18 mins' : '22 mins',
        safetyScore: routeType === 'safest' ? '95%' : '78%',
        hazardCount: routeType === 'safest' ? 1 : 3,
        routeType: routeType
      });
      
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLocations = () => {
    const temp = startLocation;
    setStartLocation(endLocation);
    setEndLocation(temp);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Route Planner</h1>
          <p className="text-gray-600 text-sm">Plan your journey with safety and efficiency in mind</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Planning Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Plan Your Route</h2>
              
              {/* Location Inputs */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <input
                    type="text"
                    placeholder="Starting location"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleSwapLocations}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Navigation className="w-4 h-4 transform rotate-90" />
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <input
                    type="text"
                    placeholder="Destination"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Route Type Selection */}
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Route Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRouteType('fastest')}
                    className={`flex items-center justify-center p-3 rounded-md text-sm font-medium transition-colors ${
                      routeType === 'fastest'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Fastest
                  </button>
                  <button
                    onClick={() => setRouteType('safest')}
                    className={`flex items-center justify-center p-3 rounded-md text-sm font-medium transition-colors ${
                      routeType === 'safest'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Safest
                  </button>
                </div>
              </div>

              {/* Calculate Route Button */}
              <button
                onClick={calculateRoute}
                disabled={!startLocation || !endLocation || isLoading}
                className="w-full mt-6 bg-gray-900 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Calculating...' : 'Calculate Route'}
              </button>
            </div>

            {/* Route Information */}
            {routeData && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Route Details</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Distance</span>
                    <span className="text-sm font-medium">{routeData.distance}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="text-sm font-medium">{routeData.duration}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Safety Score</span>
                    <span className={`text-sm font-medium ${
                      parseInt(routeData.safetyScore) > 85 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {routeData.safetyScore}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hazards</span>
                    <span className="flex items-center text-sm font-medium">
                      <AlertTriangle className="w-3 h-3 mr-1 text-orange-500" />
                      {routeData.hazardCount}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-600">
                    {routeType === 'fastest' 
                      ? 'Optimized for shortest travel time with moderate safety considerations.'
                      : 'Prioritizes safety over speed, avoiding high-risk areas and known hazards.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Map Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="h-96 lg:h-[600px] relative">
                <MapContainer 
                  center={mapCenter} 
                  zoom={12} 
                  className="h-full w-full"
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Start Location Marker */}
                  {startCoords && (
                    <Marker position={startCoords}>
                      <Popup>
                        <div className="text-sm">
                          <strong>Start:</strong> {startLocation}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* End Location Marker */}
                  {endCoords && (
                    <Marker position={endCoords}>
                      <Popup>
                        <div className="text-sm">
                          <strong>Destination:</strong> {endLocation}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Route Line */}
                  {routePoints.length > 0 && (
                    <Polyline 
                      positions={routePoints} 
                      color={routeType === 'safest' ? '#10B981' : '#3B82F6'}
                      weight={4}
                      opacity={0.8}
                    />
                  )}
                </MapContainer>
                
                {/* Map Controls */}
                <div className="absolute top-4 right-4 z-[1000] bg-white rounded-md shadow-md">
                  <button className="p-2 text-gray-600 hover:text-gray-900">
                    <Navigation className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;