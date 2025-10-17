import React, { useState, useEffect } from 'react';
import { Navigation, Clock, Shield } from 'lucide-react';
import PlaceSearchInput from '../components/PlaceSearchInput';
import SimpleMap from '../components/SimpleMap';
import MapOverlayFilters from '../components/MapOverlayFilters';

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
  const [activeOverlays, setActiveOverlays] = useState(['cctvCameras', 'securityCameras', 'highRiskAreas']); // Enable all by default
  const [realContributions, setRealContributions] = useState([]);

  // Fetch contributions from MongoDB on component mount
  useEffect(() => {
    const fetchContributions = async () => {
      try {
        console.log('Fetching contributions from MongoDB...');
        const response = await fetch('http://localhost:5000/api/contributions');
        const data = await response.json();
        
        console.log('API Response:', data);
        
        if (data.success && data.data) {
          console.log('✅ Fetched contributions:', data.data.length, 'items');
          console.log('Contributions by type:', {
            cctv: data.data.filter(c => c.type === 'cctv').length,
            no_street_light: data.data.filter(c => c.type === 'no_street_light').length,
            abandoned_house: data.data.filter(c => c.type === 'abandoned_house').length,
            dark_area: data.data.filter(c => c.type === 'dark_area').length,
            accident_prone: data.data.filter(c => c.type === 'accident_prone').length,
            pothole: data.data.filter(c => c.type === 'pothole').length
          });
          setRealContributions(data.data);
        } else {
          console.log('❌ No contributions found or API returned error');
        }
      } catch (error) {
        console.error('❌ Error fetching contributions:', error);
      }
    };

    fetchContributions();
  }, []);

  useEffect(() => {
    if (startCoords && endCoords && (startLocation || endLocation)) {
      calculateRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeType]);

  const handleOverlayToggle = (overlayId) => {
    setActiveOverlays(prev => 
      prev.includes(overlayId) ? prev.filter(id => id !== overlayId) : [...prev, overlayId]
    );
  };

  const handleStartPlaceSelect = (place) => {
    setStartPlace(place);
    setStartLocation(place.name);
    setStartCoords([place.lat, place.lng]);
  };

  const handleEndPlaceSelect = (place) => {
    setEndPlace(place);
    setEndLocation(place.name);
    setEndCoords([place.lat, place.lng]);
  };

  const calculateRoute = async () => {
    if (!startCoords || !endCoords) {
      console.log('Missing coordinates:', { startCoords, endCoords });
      return;
    }

    console.log('Calculating route from', startCoords, 'to', endCoords, 'type:', routeType);
    setIsLoading(true);
    
    try {
      // Use OSRM (Open Source Routing Machine) - free and no CORS issues
      const profile = routeType === 'safest' ? 'foot' : 'car';
      const url = `https://router.project-osrm.org/route/v1/${profile}/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;
      
      console.log('Fetching route from OSRM API...');
      const response = await fetch(url);
      const data = await response.json();

      console.log('Route API response:', data);

      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        console.log('Route calculated successfully:', coordinates.length, 'points');
        
        setRoutePoints(coordinates);
        setRouteData({
          distance: (route.distance / 1000).toFixed(2),
          duration: Math.round(route.duration / 60),
          safetyScore: routeType === 'safest' ? 85 : 72
        });
      } else {
        console.error('No route found in response:', data);
        alert('Could not find a route between these locations. Please try different locations.');
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      alert('Error calculating route. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert real contributions to overlay data format
  const overlayData = {
    cctvCameras: realContributions
      .filter(c => c.type === 'cctv')
      .map(c => ({
        lat: c.coordinates.latitude,
        lng: c.coordinates.longitude,
        icon: '📹',
        name: 'CCTV Camera',
        description: c.description || 'User-contributed CCTV location',
        type: 'cctv_camera',
        category: 'Security',
        severity: c.severity,
        address: c.address,
        status: c.status
      })),
    
    securityCameras: realContributions
      .filter(c => c.type === 'no_street_light')
      .map(c => ({
        lat: c.coordinates.latitude,
        lng: c.coordinates.longitude,
        icon: '💡',
        name: 'No Street Light',
        description: c.description || 'Area lacking street lighting',
        type: 'no_street_light',
        category: 'Infrastructure',
        severity: c.severity,
        address: c.address,
        status: c.status
      })),
    
    highRiskAreas: [
      ...realContributions.filter(c => c.type === 'abandoned_house').map(c => ({
        lat: c.coordinates.latitude,
        lng: c.coordinates.longitude,
        icon: '🏚️',
        name: 'Abandoned House',
        description: c.description || 'Abandoned property',
        type: 'abandoned_house',
        category: 'High Risk',
        riskLevel: c.severity,
        severity: c.severity,
        address: c.address,
        status: c.status
      })),
      ...realContributions.filter(c => c.type === 'dark_area').map(c => ({
        lat: c.coordinates.latitude,
        lng: c.coordinates.longitude,
        icon: '🌑',
        name: 'Dark Area',
        description: c.description || 'Poorly lit area',
        type: 'dark_area',
        category: 'High Risk',
        riskLevel: c.severity,
        severity: c.severity,
        address: c.address,
        status: c.status
      })),
      ...realContributions.filter(c => c.type === 'accident_prone').map(c => ({
        lat: c.coordinates.latitude,
        lng: c.coordinates.longitude,
        icon: '⚠️',
        name: 'Accident Prone Area',
        description: c.description || 'High accident risk zone',
        type: 'accident_prone',
        category: 'High Risk',
        riskLevel: c.severity,
        severity: c.severity,
        address: c.address,
        status: c.status
      })),
      ...realContributions.filter(c => c.type === 'pothole').map(c => ({
        lat: c.coordinates.latitude,
        lng: c.coordinates.longitude,
        icon: '🕳️',
        name: 'Pothole',
        description: c.description || 'Road damage',
        type: 'pothole',
        category: 'High Risk',
        riskLevel: c.severity,
        severity: c.severity,
        address: c.address,
        status: c.status
      })),
      ...realContributions.filter(c => c.type === 'other').map(c => ({
        lat: c.coordinates.latitude,
        lng: c.coordinates.longitude,
        icon: '❓',
        name: 'Other Issue',
        description: c.description || 'User-reported issue',
        type: 'other',
        category: 'High Risk',
        riskLevel: c.severity,
        severity: c.severity,
        address: c.address,
        status: c.status
      }))
    ]
  };

  // Log overlay data for debugging
  console.log('📍 Overlay Data:', {
    cctvCount: overlayData.cctvCameras.length,
    streetLightCount: overlayData.securityCameras.length,
    highRiskCount: overlayData.highRiskAreas.length,
    activeOverlays: activeOverlays
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-light text-gray-900">SafeRoute</h1>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-600">Dashboard</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/contribute" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Contribute
              </a>
              <a href="/profile" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Profile
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Route Type</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRouteType('fastest')}
                  className={`px-4 py-2 text-sm rounded-full transition-colors ${
                    routeType === 'fastest'
                      ? 'bg-black text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Fastest
                </button>
                <button
                  onClick={() => setRouteType('safest')}
                  className={`px-4 py-2 text-sm rounded-full transition-colors ${
                    routeType === 'safest'
                      ? 'bg-black text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Safest
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Locations</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">From</label>
                  <PlaceSearchInput
                    value={startLocation}
                    onChange={setStartLocation}
                    onPlaceSelect={handleStartPlaceSelect}
                    placeholder="Start location"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">To</label>
                  <PlaceSearchInput
                    value={endLocation}
                    onChange={setEndLocation}
                    onPlaceSelect={handleEndPlaceSelect}
                    placeholder="Destination"
                  />
                </div>
              </div>

              <button
                onClick={calculateRoute}
                disabled={!startCoords || !endCoords || isLoading}
                className="w-full mt-6 px-6 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Calculating...' : (
                  <>
                    <Navigation className="w-4 h-4 inline mr-2" />
                    Calculate Route
                  </>
                )}
              </button>
            </div>

            {routeData && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-gray-900 mb-4">Route Details</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Distance</span>
                    <span className="font-medium">{routeData.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">{routeData.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Safety Score</span>
                    <span className="font-medium text-green-600">{routeData.safetyScore}/100</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Map Layers</h2>
              <MapOverlayFilters
                activeFilters={activeOverlays}
                onFilterToggle={handleOverlayToggle}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-[calc(100vh-12rem)]">
              <SimpleMap
                startCoords={startCoords}
                endCoords={endCoords}
                routePoints={routePoints}
                overlayData={overlayData}
                activeOverlays={activeOverlays}
                onStartMarkerDrag={setStartCoords}
                onEndMarkerDrag={setEndCoords}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
