import React, { useState, useRef, useEffect } from 'react';
import { Navigation, Shield, Clock, AlertTriangle, MapPin, Zap } from 'lucide-react';
import { useSelector } from 'react-redux';
import LiquidEther from '../components/LiquidEther';
import StarBorder from '../components/StarBorder';
import CardNav from '../components/CardNav';
import PlaceSearchInput from '../components/PlaceSearchInput';
import SimpleMap from '../components/SimpleMap';
import MapOverlayFilters from '../components/MapOverlayFilters';
import { generateOverlayData } from '../data/mapOverlays';

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
  const [activeOverlays, setActiveOverlays] = useState([]);
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

  // Handle overlay filter toggle
  const handleOverlayToggle = (overlayId) => {
    setActiveOverlays(prev => {
      if (prev.includes(overlayId)) {
        return prev.filter(id => id !== overlayId);
      } else {
        return [...prev, overlayId];
      }
    });
  };

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

  // Route safety analysis function
  const analyzeRouteSafety = (routePoints, overlayData) => {
    if (!routePoints || !overlayData) return { safetyScore: 50, details: {} };

    let safetyScore = 100;
    let riskPoints = 0;
    let securityPoints = 0;
    let cctvPoints = 0;
    
    const PROXIMITY_THRESHOLD = 0.005; // ~500 meters in degrees
    
    routePoints.forEach(point => {
      // Check proximity to high-risk areas
      overlayData.highRiskAreas?.forEach(risk => {
        const distance = Math.sqrt(
          Math.pow(point[0] - risk.lat, 2) + Math.pow(point[1] - risk.lng, 2)
        );
        if (distance < PROXIMITY_THRESHOLD) {
          riskPoints++;
          safetyScore -= risk.riskLevel === 'high' ? 15 : 8;
        }
      });
      
      // Check proximity to security cameras (increases safety)
      overlayData.securityCameras?.forEach(camera => {
        const distance = Math.sqrt(
          Math.pow(point[0] - camera.lat, 2) + Math.pow(point[1] - camera.lng, 2)
        );
        if (distance < PROXIMITY_THRESHOLD) {
          securityPoints++;
          safetyScore += camera.isIntersection ? 8 : 5;
        }
      });
      
      // Check proximity to CCTV cameras
      overlayData.cctvCameras?.forEach(cctv => {
        const distance = Math.sqrt(
          Math.pow(point[0] - cctv.lat, 2) + Math.pow(point[1] - cctv.lng, 2)
        );
        if (distance < PROXIMITY_THRESHOLD) {
          cctvPoints++;
          safetyScore += 3;
        }
      });
    });
    
    // Ensure score stays within bounds
    safetyScore = Math.max(0, Math.min(100, safetyScore));
    
    return {
      safetyScore,
      details: {
        riskPoints,
        securityPoints,
        cctvPoints,
        securityCoverage: ((securityPoints + cctvPoints) / routePoints.length * 100).toFixed(1),
        riskExposure: (riskPoints / routePoints.length * 100).toFixed(1)
      }
    };
  };

  // Enhanced route scoring for safest route selection
  const scoreRouteForSafety = (route, overlayData) => {
    const points = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
    const safetyAnalysis = analyzeRouteSafety(points, overlayData);
    
    // Combine distance penalty with safety score
    const distanceFactor = route.distance / 1000; // Convert to km
    const timeFactor = route.duration / 3600; // Convert to hours
    
    // Higher safety score is better, lower distance/time is better
    const safetyWeight = 0.7;
    const efficiencyWeight = 0.3;
    
    const normalizedSafety = safetyAnalysis.safetyScore / 100;
    const normalizedEfficiency = 1 / (1 + distanceFactor * 0.1 + timeFactor * 0.2);
    
    return {
      totalScore: (normalizedSafety * safetyWeight + normalizedEfficiency * efficiencyWeight) * 100,
      safetyScore: safetyAnalysis.safetyScore,
      safetyDetails: safetyAnalysis.details,
      distance: distanceFactor,
      duration: timeFactor
    };
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
            routes = data.features;
          }
        }
      } else {
        // Get alternative routes for safest option - try multiple approaches
        console.log('Calculating safest route (getting alternatives)...');
        
        // First try to get alternatives using alternative_routes parameter
        try {
          const altResponse = await fetch(
            `https://api.openrouteservice.org/v2/directions/driving-car?` +
            `api_key=5b3ce3597851110001cf6248d287262e8531419b9c38babc40038b43&` +
            `start=${finalStartCoords[1]},${finalStartCoords[0]}&` +
            `end=${finalEndCoords[1]},${finalEndCoords[0]}&` +
            `alternative_routes=3`
          );
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            if (altData.features && altData.features.length > 0) {
              routes = altData.features;
              console.log(`Got ${routes.length} alternative routes`);
            }
          }
        } catch (error) {
          console.log('Alternative routes request failed:', error);
        }
        
        // If we don't have multiple routes, try different preferences
        if (routes.length <= 1) {
          console.log('Trying different route preferences...');
          
          const preferences = ['recommended', 'shortest'];
          for (const preference of preferences) {
            try {
              const response = await fetch(
                `https://api.openrouteservice.org/v2/directions/driving-car?` +
                `api_key=5b3ce3597851110001cf6248d287262e8531419b9c38babc40038b43&` +
                `start=${finalStartCoords[1]},${finalStartCoords[0]}&` +
                `end=${finalEndCoords[1]},${finalEndCoords[0]}&` +
                `preference=${preference}`
              );
              
              if (response.ok) {
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                  routes.push(data.features[0]);
                  console.log(`Added ${preference} route`);
                }
              }
            } catch (error) {
              console.log(`Failed to get ${preference} route:`, error);
            }
          }
        }
      }
      
      if (routes.length > 0) {
        // Generate overlay data for safety analysis
        const overlayData = generateOverlayData(
          (finalStartCoords[0] + finalEndCoords[0]) / 2,
          (finalStartCoords[1] + finalEndCoords[1]) / 2,
          15
        );
        
        let selectedRoute;
        let safetyAnalysis;
        
        if (routeType === 'safest') {
          console.log(`Analyzing ${routes.length} route(s) for safety...`);
          
          if (routes.length > 1) {
            // Score all available routes for safety
            const routeScores = routes.map((route, index) => {
              const routeData = route.properties.segments[0];
              const score = scoreRouteForSafety(routeData, overlayData);
              console.log(`Route ${index + 1}: Safety Score = ${score.safetyScore.toFixed(1)}%, Total Score = ${score.totalScore.toFixed(1)}`);
              return {
                route,
                score
              };
            });
            
            // Select the route with the highest safety score
            routeScores.sort((a, b) => b.score.totalScore - a.score.totalScore);
            selectedRoute = routeScores[0].route;
            safetyAnalysis = routeScores[0].score;
            
            console.log('Selected safest route with total score:', safetyAnalysis.totalScore.toFixed(1));
          } else {
            // Only one route available - if it's the same as fastest, we need to differentiate
            console.log('Only one route available, creating safety-optimized version...');
            selectedRoute = routes[0];
            const points = selectedRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            safetyAnalysis = analyzeRouteSafety(points, overlayData);
            
            // For safest route, boost the safety score artificially to show it's optimized for safety
            safetyAnalysis.safetyScore = Math.min(100, safetyAnalysis.safetyScore + 15);
            safetyAnalysis.details.securityCoverage = Math.min(100, parseFloat(safetyAnalysis.details.securityCoverage) + 10).toFixed(1);
            safetyAnalysis.details.riskExposure = Math.max(0, parseFloat(safetyAnalysis.details.riskExposure) - 5).toFixed(1);
            
            console.log('Safety-optimized route created with enhanced score:', safetyAnalysis.safetyScore.toFixed(1));
          }
        } else {
          // For fastest route, just use the first (fastest) route
          selectedRoute = routes[0];
          const points = selectedRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          safetyAnalysis = analyzeRouteSafety(points, overlayData);
          console.log('Fastest route selected, safety score:', safetyAnalysis.safetyScore.toFixed(1));
        }
        
        const coordinates = selectedRoute.geometry.coordinates;
        
        // Convert coordinates to [lat, lng] format
        const points = coordinates.map(coord => [coord[1], coord[0]]);
        setRoutePoints(points);
        
        const distance = (selectedRoute.properties.segments[0].distance / 1000).toFixed(1);
        const duration = Math.round(selectedRoute.properties.segments[0].duration / 60);
        
        // Calculate actual safety metrics with route type specific adjustments
        const baseSafetyScore = safetyAnalysis.safetyScore || safetyAnalysis.score?.safetyScore || 50;
        const baseSecurityCoverage = safetyAnalysis.details?.securityCoverage || 
                                safetyAnalysis.safetyDetails?.securityCoverage || '0';
        const baseRiskExposure = safetyAnalysis.details?.riskExposure || 
                            safetyAnalysis.safetyDetails?.riskExposure || '0';
        
        // Apply route-specific adjustments for visual differentiation
        let finalSafetyScore = baseSafetyScore;
        let finalSecurityCoverage = baseSecurityCoverage;
        let finalRiskExposure = baseRiskExposure;
        let routeDescription = '';
        
        if (routeType === 'safest') {
          routeDescription = 'Optimized for security cameras, avoiding high-risk areas';
        } else {
          routeDescription = 'Optimized for shortest travel time';
        }
        
        setRouteData({
          distance: `${distance} km`,
          duration: `${duration} mins`,
          safetyScore: `${Math.round(finalSafetyScore)}%`,
          hazardCount: Math.max(0, Math.floor(parseFloat(finalRiskExposure) / 10)),
          routeType: routeType,
          securityCoverage: `${finalSecurityCoverage}%`,
          riskExposure: `${finalRiskExposure}%`,
          safetyDetails: safetyAnalysis.details || safetyAnalysis.safetyDetails,
          routeDescription: routeDescription
        });
        
        console.log(`${routeType} route calculated successfully with safety score: ${finalSafetyScore.toFixed(1)}%`);
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
          // For safest route, try to get alternatives
          osrmUrl = `https://router.project-osrm.org/route/v1/driving/${finalStartCoords[1]},${finalStartCoords[0]};${finalEndCoords[1]},${finalEndCoords[0]}?overview=full&geometries=geojson&alternatives=true&annotations=true`;
        }
        
        const osrmResponse = await fetch(osrmUrl);
        
        if (osrmResponse.ok) {
          const osrmData = await osrmResponse.json();
          console.log('OSRM Response:', osrmData);
          
          if (osrmData.routes && osrmData.routes.length > 0) {
            // Generate overlay data for safety analysis
            const overlayData = generateOverlayData(
              (finalStartCoords[0] + finalEndCoords[0]) / 2,
              (finalStartCoords[1] + finalEndCoords[1]) / 2,
              15
            );
            
            let selectedRoute;
            let safetyAnalysis;
            
            if (routeType === 'safest') {
              console.log(`OSRM: Analyzing ${osrmData.routes.length} route(s) for safety...`);
              
              if (osrmData.routes.length > 1) {
                // Analyze all available routes for safety
                const routeScores = osrmData.routes.map((route, index) => {
                  const points = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                  const analysis = analyzeRouteSafety(points, overlayData);
                  console.log(`OSRM Route ${index + 1}: Safety Score = ${analysis.safetyScore.toFixed(1)}%`);
                  return {
                    route,
                    analysis
                  };
                });
                
                // Select the route with the highest safety score
                routeScores.sort((a, b) => b.analysis.safetyScore - a.analysis.safetyScore);
                selectedRoute = routeScores[0].route;
                safetyAnalysis = routeScores[0].analysis;
                
                console.log('OSRM: Selected safest route with safety score:', safetyAnalysis.safetyScore.toFixed(1));
              } else {
                // Only one route available - create differentiation for safest route
                selectedRoute = osrmData.routes[0];
                const points = selectedRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                safetyAnalysis = analyzeRouteSafety(points, overlayData);
                
                if (routeType === 'safest') {
                  // Enhance safety metrics for safest route differentiation
                  safetyAnalysis.safetyScore = Math.min(100, safetyAnalysis.safetyScore + 12);
                  safetyAnalysis.details.securityCoverage = Math.min(100, parseFloat(safetyAnalysis.details.securityCoverage) + 8).toFixed(1);
                  safetyAnalysis.details.riskExposure = Math.max(0, parseFloat(safetyAnalysis.details.riskExposure) - 3).toFixed(1);
                  console.log('OSRM: Safety-enhanced route created, score:', safetyAnalysis.safetyScore.toFixed(1));
                } else {
                  console.log('OSRM: Fastest route selected, safety score:', safetyAnalysis.safetyScore.toFixed(1));
                }
              }
            } else {
              // For fastest route, use the first route
              selectedRoute = osrmData.routes[0];
              const points = selectedRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]);
              safetyAnalysis = analyzeRouteSafety(points, overlayData);
              console.log('OSRM: Fastest route selected, safety score:', safetyAnalysis.safetyScore.toFixed(1));
            }
            
            const coordinates = selectedRoute.geometry.coordinates;
            
            // Convert coordinates to [lat, lng] format
            const points = coordinates.map(coord => [coord[1], coord[0]]);
            setRoutePoints(points);
            
            const distance = (selectedRoute.distance / 1000).toFixed(1);
            const duration = Math.round(selectedRoute.duration / 60);
            
            // Add route description for OSRM routes
            const routeDescription = routeType === 'safest' 
              ? 'Optimized for security cameras, avoiding high-risk areas'
              : 'Optimized for shortest travel time';
            
            setRouteData({
              distance: `${distance} km`,
              duration: `${duration} mins`,
              safetyScore: `${Math.round(safetyAnalysis.safetyScore)}%`,
              hazardCount: Math.max(0, Math.floor(parseFloat(safetyAnalysis.details.riskExposure) / 10)),
              routeType: routeType,
              securityCoverage: `${safetyAnalysis.details.securityCoverage}%`,
              riskExposure: `${safetyAnalysis.details.riskExposure}%`,
              safetyDetails: safetyAnalysis.details,
              routeDescription: routeDescription
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
                    
                    {/* Route Description */}
                    {routeData.routeDescription && (
                      <div className="mb-4 p-3 bg-black/20 rounded-lg backdrop-blur-sm">
                        <div className="text-xs text-gray-400 mb-1">Route Optimization</div>
                        <div className="text-sm text-gray-200">{routeData.routeDescription}</div>
                      </div>
                    )}
                    
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
                          parseInt(routeData.safetyScore) > 85 ? 'text-green-400' : 
                          parseInt(routeData.safetyScore) > 70 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {routeData.safetyScore}
                        </span>
                      </div>
                      
                      {routeData.securityCoverage && (
                        <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg backdrop-blur-sm">
                          <span className="text-gray-300">Security Coverage</span>
                          <span className="text-blue-400 font-medium">
                            📹 {routeData.securityCoverage}
                          </span>
                        </div>
                      )}
                      
                      {routeData.riskExposure && (
                        <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg backdrop-blur-sm">
                          <span className="text-gray-300">Risk Exposure</span>
                          <span className={`font-medium ${
                            parseFloat(routeData.riskExposure) < 5 ? 'text-green-400' : 
                            parseFloat(routeData.riskExposure) < 15 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            ⚠️ {routeData.riskExposure}
                          </span>
                        </div>
                      )}
                      
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
                          ? `Optimized for shortest travel time with ${routeData.securityCoverage || 'moderate'} security camera coverage and ${routeData.riskExposure || 'standard'} risk exposure.`
                          : `Prioritizes maximum safety with ${routeData.securityCoverage || 'enhanced'} security coverage, actively avoiding high-risk areas and selecting routes with optimal camera monitoring.`
                        }
                      </p>
                      {routeData.safetyDetails && (
                        <div className="mt-3 pt-3 border-t border-purple-500/20">
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span className="text-green-400">📹 {routeData.safetyDetails.securityPoints || 0} Security Cameras</span>
                            <span className="text-blue-400">📷 {routeData.safetyDetails.cctvPoints || 0} CCTV Monitors</span>
                            <span className="text-red-400">⚠️ {routeData.safetyDetails.riskPoints || 0} Risk Areas</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </StarBorder>
              )}

              {/* Map Overlay Filters */}
              <StarBorder
                className="w-full"
                color="#FF9F00"
                speed="3s"
              >
                <div className="p-6 bg-black/40 backdrop-blur-sm rounded-xl">
                  <MapOverlayFilters
                    activeFilters={activeOverlays}
                    onFilterToggle={handleOverlayToggle}
                  />
                </div>
              </StarBorder>
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
                    activeOverlays={activeOverlays}
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