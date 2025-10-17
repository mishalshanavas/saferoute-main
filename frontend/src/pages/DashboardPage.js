import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { Search, Navigation, Shield, Clock, AlertTriangle, MapPin, Zap } from 'lucide-react';
import { useSelector } from 'react-redux';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LiquidEther from '../components/LiquidEther';
import StarBorder from '../components/StarBorder';
import CardNav from '../components/CardNav';
import logo from '../components/logo.svg';

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
  const containerRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const { isAuthenticated } = useSelector((state) => state.auth);

  const navItems = [
    {
      label: "Routes", 
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "Dashboard", ariaLabel: "Route Dashboard", href: "/dashboard" },
        { label: "History", ariaLabel: "Route History", href: "/route-history" },
        { label: "Saved", ariaLabel: "Saved Routes", href: "/saved-routes" }
      ]
    },
    {
      label: "Safety",
      bgColor: "#170D27", 
      textColor: "#fff",
      links: [
        { label: "Hazards", ariaLabel: "View Hazards" },
        { label: "Reports", ariaLabel: "Safety Reports" }
      ]
    },
    {
      label: "Profile",
      bgColor: "#271E37",
      textColor: "#fff",
      links: [
        { label: "Settings", ariaLabel: "Profile Settings", href: "/profile" },
        { label: "Support", ariaLabel: "Contact Support" }
      ]
    }
  ];

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
    <div className="bg-black text-white overflow-hidden relative min-h-screen">
      {/* Background Animation */}
      <div className="fixed inset-0 z-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {/* Navigation */}
      <CardNav
        logo={logo}
        logoAlt="SafeRoute Logo"
        items={navItems}
        className="relative z-20"
      />

      {/* Main Dashboard Content */}
      <div className="relative z-10 min-h-screen pt-20" ref={containerRef}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-6xl font-light mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Route Planner
              </span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Plan your journey with advanced safety analytics and real-time hazard detection
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Route Planning Panel */}
            <div className="xl:col-span-1 space-y-6">
              <StarBorder
                className="w-full"
                color="#00FFFF"
                speed="4s"
              >
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Navigation className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-light text-white">Plan Your Route</h2>
                  </div>
                  
                  {/* Location Inputs */}
                  <div className="space-y-4">
                    <StarBorder
                      as="div"
                      className="w-full"
                      color="#00FF88"
                      speed="3s"
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full shadow-lg"></div>
                        </div>
                        <input
                          type="text"
                          placeholder="Starting location"
                          className="w-full pl-12 pr-12 py-4 bg-black/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
                          value={startLocation}
                          onChange={(e) => setStartLocation(e.target.value)}
                        />
                        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </StarBorder>

                    <div className="flex justify-center">
                      <StarBorder
                        as="button"
                        className="p-3"
                        color="#FF6B9D"
                        speed="2s"
                        onClick={handleSwapLocations}
                      >
                        <Navigation className="w-5 h-5 text-cyan-400 transform rotate-90 transition-transform hover:rotate-180 duration-300" />
                      </StarBorder>
                    </div>

                    <StarBorder
                      as="div"
                      className="w-full"
                      color="#FF6B9D"
                      speed="3s"
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-red-400 rounded-full shadow-lg"></div>
                        </div>
                        <input
                          type="text"
                          placeholder="Destination"
                          className="w-full pl-12 pr-12 py-4 bg-black/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
                          value={endLocation}
                          onChange={(e) => setEndLocation(e.target.value)}
                        />
                        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                    </StarBorder>
                  </div>

                  {/* Route Type Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-4 block flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Route Preference
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <StarBorder
                        as="button"
                        className={`transition-all duration-300 ${routeType === 'fastest' ? 'scale-105' : ''}`}
                        color={routeType === 'fastest' ? '#00FFFF' : '#666'}
                        speed="2s"
                        onClick={() => setRouteType('fastest')}
                      >
                        <div className="flex items-center justify-center p-3">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Fastest</span>
                        </div>
                      </StarBorder>
                      
                      <StarBorder
                        as="button"
                        className={`transition-all duration-300 ${routeType === 'safest' ? 'scale-105' : ''}`}
                        color={routeType === 'safest' ? '#00FF88' : '#666'}
                        speed="2s"
                        onClick={() => setRouteType('safest')}
                      >
                        <div className="flex items-center justify-center p-3">
                          <Shield className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Safest</span>
                        </div>
                      </StarBorder>
                    </div>
                  </div>

                  {/* Calculate Route Button */}
                  <StarBorder
                    as="button"
                    className="w-full mt-6"
                    color="#FF6B9D"
                    speed="1.5s"
                    onClick={calculateRoute}
                    disabled={!startLocation || !endLocation || isLoading}
                  >
                    <div className="py-4 px-6 text-lg font-medium">
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                          Calculating...
                        </span>
                      ) : (
                        'Calculate Route'
                      )}
                    </div>
                  </StarBorder>
                </div>
              </StarBorder>

              {/* Route Information */}
              {routeData && (
                <StarBorder
                  className="w-full"
                  color="#B19EEF"
                  speed="3s"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-light text-white mb-6 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      Route Analytics
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg backdrop-blur-sm">
                        <span className="text-gray-300">Distance</span>
                        <span className="text-cyan-400 font-medium">{routeData.distance}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg backdrop-blur-sm">
                        <span className="text-gray-300">Duration</span>
                        <span className="text-cyan-400 font-medium">{routeData.duration}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg backdrop-blur-sm">
                        <span className="text-gray-300">Safety Score</span>
                        <span className={`font-medium ${
                          parseInt(routeData.safetyScore) > 85 ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {routeData.safetyScore}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg backdrop-blur-sm">
                        <span className="text-gray-300">Hazards</span>
                        <span className="flex items-center text-orange-400 font-medium">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {routeData.hazardCount}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg backdrop-blur-sm border border-purple-500/20">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {routeType === 'fastest' 
                          ? 'Optimized for shortest travel time with moderate safety considerations and real-time traffic analysis.'
                          : 'Prioritizes maximum safety with AI-powered hazard detection, avoiding high-risk areas and known danger zones.'
                        }
                      </p>
                    </div>
                  </div>
                </StarBorder>
              )}
            </div>

            {/* Map Preview */}
            <div className="xl:col-span-2">
              <StarBorder
                className="w-full h-full"
                color="#5227FF"
                speed="4s"
              >
                <div className="relative h-[500px] xl:h-[700px] overflow-hidden rounded-xl">
                  <MapContainer 
                    center={mapCenter} 
                    zoom={12} 
                    className="h-full w-full rounded-xl"
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
                          <div className="text-sm text-gray-900">
                            <strong>Start:</strong> {startLocation}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* End Location Marker */}
                    {endCoords && (
                      <Marker position={endCoords}>
                        <Popup>
                          <div className="text-sm text-gray-900">
                            <strong>Destination:</strong> {endLocation}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    
                    {/* Route Line */}
                    {routePoints.length > 0 && (
                      <Polyline 
                        positions={routePoints} 
                        color={routeType === 'safest' ? '#10B981' : '#00FFFF'}
                        weight={4}
                        opacity={0.9}
                      />
                    )}
                  </MapContainer>
                  
                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 z-[1000]">
                    <StarBorder
                      as="button"
                      color="#00FFFF"
                      speed="2s"
                    >
                      <div className="p-2">
                        <Navigation className="w-5 h-5 text-cyan-400" />
                      </div>
                    </StarBorder>
                  </div>
                </div>
              </StarBorder>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;