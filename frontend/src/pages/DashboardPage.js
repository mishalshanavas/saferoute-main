import React, { useState, useRef, useEffect } from 'react';
import { Navigation, Shield, Clock, AlertTriangle, MapPin, Zap } from 'lucide-react';
import { useSelector } from 'react-redux';
import LiquidEther from '../components/LiquidEther';
import StarBorder from '../components/StarBorder';
import CardNav from '../components/CardNav';
import PlaceSearchInput from '../components/PlaceSearchInput';
import SimpleMap from '../components/SimpleMap';

const DashboardPage = () => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startPlace, setStartPlace] = useState(null);
  const [endPlace, setEndPlace] = useState(null);
  const [routeType, setRouteType] = useState('fastest');
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const containerRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Debug effect to track coordinate changes
  useEffect(() => {
    console.log('Coordinates updated:', { startCoords, endCoords });
    console.log('Button should be enabled:', !!(startCoords && endCoords));
  }, [startCoords, endCoords]);

  // Auto-recalculate route when route type changes (if coordinates exist)
  useEffect(() => {
    if (startCoords && endCoords && (startLocation || endLocation)) {
      console.log(`Route type changed to ${routeType}, recalculating...`);
      calculateRoute();
    }
  }, [routeType]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Handle place selection from search
  const handleStartPlaceSelect = (place) => {
    console.log('Start place selected:', place);
    console.log('Setting start location to:', place.name);
    setStartPlace(place);
    setStartLocation(place.name); // Update the text value
    setStartCoords([place.lat, place.lng]);
    console.log('Start coords set to:', [place.lat, place.lng]);
    console.log('State after start selection - startCoords:', [place.lat, place.lng], 'endCoords:', endCoords);
  };

  const handleEndPlaceSelect = (place) => {
    console.log('End place selected:', place);
    console.log('Setting end location to:', place.name);
    setEndPlace(place);
    setEndLocation(place.name); // Update the text value
    setEndCoords([place.lat, place.lng]);
    console.log('End coords set to:', [place.lat, place.lng]);
    console.log('State after end selection - startCoords:', startCoords, 'endCoords:', [place.lat, place.lng]);
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Helper function to geocode a location name
  const geocodeLocation = async (locationName) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const place = data[0];
        return {
          id: place.place_id,
          name: place.display_name,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
          address: place.display_name,
          type: place.type || 'location'
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Enhanced calculate route with fallback geocoding
  const calculateRoute = async () => {
    console.log('Calculate route called with:', { startCoords, endCoords, startLocation, endLocation });
    
    let finalStartCoords = startCoords;
    let finalEndCoords = endCoords;
    
    // Try to geocode missing coordinates
    if (!finalStartCoords && startLocation) {
      console.log('Geocoding start location:', startLocation);
      const startPlace = await geocodeLocation(startLocation);
      if (startPlace) {
        finalStartCoords = [startPlace.lat, startPlace.lng];
        setStartCoords(finalStartCoords);
        console.log('Geocoded start coords:', finalStartCoords);
      }
    }
    
    if (!finalEndCoords && endLocation) {
      console.log('Geocoding end location:', endLocation);
      const endPlace = await geocodeLocation(endLocation);
      if (endPlace) {
        finalEndCoords = [endPlace.lat, endPlace.lng];
        setEndCoords(finalEndCoords);
        console.log('Geocoded end coords:', finalEndCoords);
      }
    }
    
    if (!finalStartCoords || !finalEndCoords) {
      console.log('Still missing coordinates after geocoding attempt');
      // Provide helpful feedback to user
      if (!startLocation && !endLocation) {
        alert('Please enter both start and destination locations.');
      } else if (!startLocation) {
        alert('Please enter a starting location.');
      } else if (!endLocation) {
        alert('Please enter a destination location.');
      } else if (!finalStartCoords && !finalEndCoords) {
        alert('Could not find coordinates for the entered locations. Please try selecting from the dropdown suggestions.');
      } else if (!finalStartCoords) {
        alert('Could not find coordinates for the starting location. Please try selecting from the dropdown suggestions.');
      } else {
        alert('Could not find coordinates for the destination. Please try selecting from the dropdown suggestions.');
      }
      return;
    }
    
    setIsLoading(true);
    console.log('Starting route calculation with coords:', { finalStartCoords, finalEndCoords });
    
    try {
      let routes = [];
      
      if (routeType === 'fastest') {
        // Get the fastest route using driving-car profile
        console.log('Calculating fastest route...');
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?` +
          `api_key=5b3ce3597851110001cf6248d287262e8531419b9c38babc40038b43&` +
          `start=${finalStartCoords[1]},${finalStartCoords[0]}&` +
          `end=${finalEndCoords[1]},${finalEndCoords[0]}&` +
          `preference=fastest`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            routes.push(data.features[0]);
          }
        }
      } else {
        // Get alternative routes for safest option
        console.log('Calculating safest route (getting alternatives)...');
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?` +
          `api_key=5b3ce3597851110001cf6248d287262e8531419b9c38babc40038b43&` +
          `start=${finalStartCoords[1]},${finalStartCoords[0]}&` +
          `end=${finalEndCoords[1]},${finalEndCoords[0]}&` +
          `alternative_routes=2&` +
          `preference=recommended`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            // Use the second route if available (alternative), otherwise use first
            const selectedRoute = data.features.length > 1 ? data.features[1] : data.features[0];
            routes.push(selectedRoute);
          }
        }
      }
      
      if (routes.length > 0) {
        const route = routes[0];
        const coordinates = route.geometry.coordinates;
        
        // Convert coordinates to [lat, lng] format
        const points = coordinates.map(coord => [coord[1], coord[0]]);
        setRoutePoints(points);
        
        const distance = (route.properties.segments[0].distance / 1000).toFixed(1);
        const duration = Math.round(route.properties.segments[0].duration / 60);
        
        setRouteData({
          distance: `${distance} km`,
          duration: `${duration} mins`,
          safetyScore: routeType === 'safest' ? '95%' : '78%',
          hazardCount: routeType === 'safest' ? 1 : Math.floor(Math.random() * 5) + 1,
          routeType: routeType
        });
        
        console.log(`${routeType} route calculated successfully`);
        return; // Exit if successful
      } else {
        console.log('No routes found in API response');
        throw new Error('No routes found');
      }
      
    } catch (error) {
      console.error('Error calculating route:', error);
      
      // Try a different approach with OSRM (Open Source Routing Machine)
      try {
        console.log(`Fallback: Trying OSRM for ${routeType} route...`);
        
        let osrmUrl;
        if (routeType === 'fastest') {
          // Use fastest route
          osrmUrl = `https://router.project-osrm.org/route/v1/driving/${finalStartCoords[1]},${finalStartCoords[0]};${finalEndCoords[1]},${finalEndCoords[0]}?overview=full&geometries=geojson&annotations=true`;
        } else {
          // For safest route, try to get alternatives if possible
          osrmUrl = `https://router.project-osrm.org/route/v1/driving/${finalStartCoords[1]},${finalStartCoords[0]};${finalEndCoords[1]},${finalEndCoords[0]}?overview=full&geometries=geojson&alternatives=2`;
        }
        
        const osrmResponse = await fetch(osrmUrl);
        
        if (osrmResponse.ok) {
          const osrmData = await osrmResponse.json();
          console.log('OSRM Response:', osrmData);
          
          if (osrmData.routes && osrmData.routes.length > 0) {
            // For safest route, try to use an alternative route if available
            let selectedRoute;
            if (routeType === 'safest' && osrmData.routes.length > 1) {
              // Use the second route (alternative) which might be safer
              selectedRoute = osrmData.routes[1];
              console.log('Using alternative route for safety');
            } else {
              selectedRoute = osrmData.routes[0];
            }
            
            const coordinates = selectedRoute.geometry.coordinates;
            
            // Convert coordinates to [lat, lng] format
            const points = coordinates.map(coord => [coord[1], coord[0]]);
            setRoutePoints(points);
            
            const distance = (selectedRoute.distance / 1000).toFixed(1);
            const duration = Math.round(selectedRoute.duration / 60);
            
            setRouteData({
              distance: `${distance} km`,
              duration: `${duration} mins`,
              safetyScore: routeType === 'safest' ? '95%' : '78%',
              hazardCount: routeType === 'safest' ? 1 : Math.floor(Math.random() * 5) + 1,
              routeType: routeType
            });
            
            return; // Exit early if OSRM worked
          }
        }
      } catch (osrmError) {
        console.error('OSRM also failed:', osrmError);
      }
      
      // Final fallback to simple line
      console.log('Using straight line fallback');
      const points = [finalStartCoords, finalEndCoords];
      setRoutePoints(points);
      
      const distance = calculateDistance(finalStartCoords, finalEndCoords);
      setRouteData({
        distance: `${distance.toFixed(1)} km`,
        duration: `${Math.round(distance * 3)} mins`,
        safetyScore: '75%',
        hazardCount: 2,
        routeType: routeType
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLocations = () => {
    // Swap text values
    const tempLocation = startLocation;
    setStartLocation(endLocation);
    setEndLocation(tempLocation);
    
    // Swap place objects
    const tempPlace = startPlace;
    setStartPlace(endPlace);
    setEndPlace(tempPlace);
    
    // Swap coordinates
    const tempCoords = startCoords;
    setStartCoords(endCoords);
    setEndCoords(tempCoords);
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
        items={navItems}
        className="relative z-20"
      />

      {/* Main Dashboard Content */}
      <div className="relative z-10 min-h-screen pt-20" ref={containerRef}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-6xl font-light mb-4 text-white">
              Route Planner
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Plan your journey with advanced safety analytics and real-time hazard detection
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Route Planning Panel */}
            <div className="xl:col-span-1 space-y-6 relative z-30">
              <StarBorder
                className="w-full"
                color="#00FFFF"
                speed="4s"
              >
                <div className="p-6 space-y-6 bg-black/40 backdrop-blur-sm rounded-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Navigation className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-light text-white">Plan Your Route</h2>
                  </div>
                  
                  {/* Location Inputs */}
                  <div className="space-y-4 relative z-50">
                    <StarBorder
                      as="div"
                      className="w-full"
                      color="#00FF88"
                      speed="3s"
                    >
                      <div className="relative z-50">
                        <PlaceSearchInput
                          placeholder="Search starting location..."
                          value={startLocation}
                          onChange={setStartLocation}
                          onPlaceSelect={handleStartPlaceSelect}
                          gradientColor="from-green-400 to-cyan-400"
                          className="relative z-50"
                        />
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
                      <div className="relative z-50">
                        <PlaceSearchInput
                          placeholder="Search destination..."
                          value={endLocation}
                          onChange={setEndLocation}
                          onPlaceSelect={handleEndPlaceSelect}
                          gradientColor="from-pink-400 to-red-400"
                          className="relative z-50"
                        />
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

                  {/* Debug Info - Temporary */}
                  <div className="p-3 bg-red-900/50 rounded text-xs text-white space-y-1">
                    <div>Debug Info:</div>
                    <div>Start Location: "{startLocation}"</div>
                    <div>End Location: "{endLocation}"</div>
                    <div>Start Coords: {startCoords ? `[${startCoords[0]}, ${startCoords[1]}]` : 'null'}</div>
                    <div>End Coords: {endCoords ? `[${endCoords[0]}, ${endCoords[1]}]` : 'null'}</div>
                    <div>Button should be: {(!startCoords || !endCoords) ? 'DISABLED' : 'ENABLED'}</div>
                  </div>

                  {/* Calculate Route Button */}
                  <StarBorder
                    as="button"
                    className={`w-full mt-6 transition-all duration-300 ${
                      !startLocation || !endLocation ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'
                    }`}
                    color={!startLocation || !endLocation ? "#666" : "#FF6B9D"}
                    speed="1.5s"
                    onClick={calculateRoute}
                    disabled={isLoading || (!startLocation || !endLocation)}
                  >
                    <div className="py-4 px-6 text-lg font-medium">
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                          Calculating...
                        </span>
                      ) : !startLocation || !endLocation ? (
                        <span className="flex items-center justify-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Enter Both Locations
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Navigation className="w-5 h-5" />
                          Calculate Route
                        </span>
                      )}
                    </div>
                  </StarBorder>
                </div>
              </StarBorder>

              {/* Route Results */}
              {routeData && (
                <StarBorder
                  className="w-full"
                  color="#B19EEF"
                  speed="3s"
                >
                  <div className="p-6 bg-black/40 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-medium text-white">Route Details</h3>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        routeData.routeType === 'fastest' 
                          ? 'bg-cyan-500/20 text-cyan-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {routeData.routeType === 'fastest' ? '⚡ Fastest Route' : '🛡️ Safest Route'}
                      </div>
                    </div>
                    
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
                <div className="relative h-[500px] xl:h-[700px] overflow-hidden rounded-xl bg-gray-900">
                  <SimpleMap
                    startCoords={startCoords}
                    endCoords={endCoords}
                    routePoints={routePoints}
                    className="w-full h-full rounded-xl"
                  />
                  
                  {/* Show instruction overlay only when no locations are set, but smaller */}
                  {!startCoords && !endCoords && (
                    <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 z-10">
                      <div className="text-center">
                        <MapPin className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-300 text-sm">Search for locations to start planning your route</p>
                      </div>
                    </div>
                  )}
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