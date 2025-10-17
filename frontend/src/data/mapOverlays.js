// Map overlay data for security features and risk areas
// Enhanced with realistic positioning along major roads and intersections

// Major road networks for different cities with actual coordinates
const CITY_ROAD_NETWORKS = {
  'default': {
    center: [40.7128, -74.0060], // Default to NYC
    radius: 15,
    cameras: 120,
    cctv: 180,
    highRisk: 25,
    majorRoads: [
      // Manhattan main arteries
      { start: [40.7831, -73.9712], end: [40.7589, -73.9851], name: 'Broadway' },
      { start: [40.7614, -74.0056], end: [40.7505, -73.9934], name: '42nd Street' },
      { start: [40.7829, -73.9654], end: [40.7489, -73.9680], name: 'Lexington Ave' },
      { start: [40.7829, -73.9441], end: [40.7489, -73.9467], name: '3rd Avenue' },
      { start: [40.7829, -73.9708], end: [40.7489, -73.9734], name: 'Park Avenue' },
      { start: [40.7614, -73.9776], end: [40.7505, -73.9776], name: '7th Avenue' },
      // Cross streets
      { start: [40.7505, -73.9934], end: [40.7505, -73.9857], name: 'Times Square' },
      { start: [40.7589, -73.9851], end: [40.7589, -73.9667], name: '34th Street' },
      { start: [40.7282, -73.9942], end: [40.7282, -73.9858], name: '14th Street' },
      // Bridges and tunnels approaches
      { start: [40.7061, -73.9969], end: [40.6892, -73.9442], name: 'Brooklyn Bridge' },
      { start: [40.7505, -73.9857], end: [40.7282, -73.7949], name: 'Queens Connection' },
    ]
  }
};

// Helper function to interpolate points along a road segment
const interpolateRoadPoints = (start, end, numPoints) => {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const lat = start[0] + (end[0] - start[0]) * ratio;
    const lng = start[1] + (end[1] - start[1]) * ratio;
    points.push([lat, lng]);
  }
  return points;
};

// Helper function to add random offset to simulate exact positioning
const addRoadOffset = (point, maxOffsetMeters = 50) => {
  // Convert meters to degrees (rough approximation)
  const offsetDegrees = maxOffsetMeters / 111320;
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomDistance = Math.random() * offsetDegrees;
  
  return [
    point[0] + Math.cos(randomAngle) * randomDistance,
    point[1] + Math.sin(randomAngle) * randomDistance
  ];
};

// Generate realistic road-based overlay positions
const generateRoadBasedOverlays = (cityData) => {
  const overlays = {
    securityCameras: [],
    cctvCameras: [],
    highRiskAreas: []
  };

  // Generate all road points first
  const allRoadPoints = [];
  cityData.majorRoads.forEach(road => {
    const roadPoints = interpolateRoadPoints(road.start, road.end, 8);
    roadPoints.forEach(point => {
      allRoadPoints.push({
        point,
        roadName: road.name,
        isIntersection: false
      });
    });
  });

  // Mark intersection points (points close to multiple roads)
  allRoadPoints.forEach((pointA, i) => {
    let nearbyRoads = 0;
    allRoadPoints.forEach((pointB, j) => {
      if (i !== j) {
        const distance = Math.sqrt(
          Math.pow(pointA.point[0] - pointB.point[0], 2) +
          Math.pow(pointA.point[1] - pointB.point[1], 2)
        );
        if (distance < 0.002) { // ~200 meters
          nearbyRoads++;
        }
      }
    });
    if (nearbyRoads > 2) {
      pointA.isIntersection = true;
    }
  });

  // Place security cameras at intersections and high-traffic areas
  const cameraPoints = allRoadPoints
    .filter(p => p.isIntersection || Math.random() > 0.7)
    .slice(0, cityData.cameras);

  cameraPoints.forEach((roadPoint, i) => {
    const [lat, lng] = addRoadOffset(roadPoint.point, 25);
    overlays.securityCameras.push({
      id: `security_${i}`,
      lat,
      lng,
      type: 'security_camera',
      name: `Security Camera ${roadPoint.roadName}`,
      description: `Public safety monitoring at ${roadPoint.roadName}${roadPoint.isIntersection ? ' intersection' : ''}`,
      icon: '📹',
      category: 'Security Infrastructure',
      roadName: roadPoint.roadName,
      isIntersection: roadPoint.isIntersection
    });
  });

  // Place CCTV cameras more densely along roads
  const cctvPoints = allRoadPoints
    .filter(() => Math.random() > 0.4)
    .slice(0, cityData.cctv);

  cctvPoints.forEach((roadPoint, i) => {
    const [lat, lng] = addRoadOffset(roadPoint.point, 15);
    overlays.cctvCameras.push({
      id: `cctv_${i}`,
      lat,
      lng,
      type: 'cctv_camera',
      name: `CCTV Monitor ${roadPoint.roadName}`,
      description: `Traffic monitoring on ${roadPoint.roadName}`,
      icon: '📷',
      category: 'Traffic Monitoring',
      roadName: roadPoint.roadName
    });
  });

  // Place high-risk areas away from camera coverage
  const riskyAreas = [];
  for (let i = 0; i < cityData.highRisk; i++) {
    let attempts = 0;
    let validPoint = false;
    
    while (!validPoint && attempts < 50) {
      const randomRoadPoint = allRoadPoints[Math.floor(Math.random() * allRoadPoints.length)];
      const [lat, lng] = addRoadOffset(randomRoadPoint.point, 100);
      
      // Check if this point is far enough from cameras
      const nearCameras = [...overlays.securityCameras, ...overlays.cctvCameras].filter(camera => {
        const distance = Math.sqrt(
          Math.pow(lat - camera.lat, 2) +
          Math.pow(lng - camera.lng, 2)
        );
        return distance < 0.005; // ~500 meters
      });

      if (nearCameras.length < 2) { // Allow if less than 2 cameras nearby
        riskyAreas.push({
          id: `risk_${i}`,
          lat,
          lng,
          type: 'high_risk_area',
          name: `High Risk Zone ${i + 1}`,
          description: `Elevated risk area near ${randomRoadPoint.roadName}`,
          icon: '⚠️',
          category: 'Risk Areas',
          riskLevel: Math.random() > 0.7 ? 'high' : 'medium',
          roadName: randomRoadPoint.roadName
        });
        validPoint = true;
      }
      attempts++;
    }
  }
  
  overlays.highRiskAreas = riskyAreas;
  return overlays;
};

export const generateOverlayData = (centerLat, centerLng, radiusKm = 10) => {
  // Use default city data for now - could be enhanced to detect actual city
  const cityData = CITY_ROAD_NETWORKS['default'];
  
  // Adjust center if provided coordinates are significantly different
  if (Math.abs(centerLat - cityData.center[0]) > 0.5 || Math.abs(centerLng - cityData.center[1]) > 0.5) {
    // For demo purposes, generate a simple grid around the provided center
    return generateSimpleOverlayData(centerLat, centerLng, radiusKm);
  }
  
  return generateRoadBasedOverlays(cityData);
};

// Fallback function for areas without predefined road networks
const generateSimpleOverlayData = (centerLat, centerLng, radiusKm) => {
  const overlays = {
    securityCameras: [],
    cctvCameras: [],
    highRiskAreas: []
  };

  const generateGridPoint = (baseLat, baseLng, radius, index, total) => {
    const angle = (index / total) * 2 * Math.PI;
    const distance = (0.2 + Math.random() * 0.8) * radius;
    const radiusInDegrees = distance / 111.32;
    return [
      baseLat + radiusInDegrees * Math.cos(angle),
      baseLng + radiusInDegrees * Math.sin(angle)
    ];
  };

  // Generate cameras in a more structured pattern
  for (let i = 0; i < 45; i++) {
    const [lat, lng] = generateGridPoint(centerLat, centerLng, radiusKm, i, 45);
    overlays.securityCameras.push({
      id: `security_${i}`,
      lat,
      lng,
      type: 'security_camera',
      name: `Security Camera ${i + 1}`,
      description: 'Public safety monitoring',
      icon: '📹',
      category: 'Security Infrastructure'
    });
  }

  for (let i = 0; i < 75; i++) {
    const [lat, lng] = generateGridPoint(centerLat, centerLng, radiusKm * 0.8, i, 75);
    overlays.cctvCameras.push({
      id: `cctv_${i}`,
      lat,
      lng,
      type: 'cctv_camera',
      name: `CCTV Camera ${i + 1}`,
      description: 'Traffic and area monitoring',
      icon: '📷',
      category: 'Traffic Monitoring'
    });
  }

  for (let i = 0; i < 18; i++) {
    const [lat, lng] = generateGridPoint(centerLat, centerLng, radiusKm * 1.2, i, 18);
    overlays.highRiskAreas.push({
      id: `risk_${i}`,
      lat,
      lng,
      type: 'high_risk_area',
      name: `Risk Zone ${i + 1}`,
      description: 'Area requiring increased caution',
      icon: '⚠️',
      category: 'Risk Areas',
      riskLevel: Math.random() > 0.6 ? 'high' : 'medium'
    });
  }

  return overlays;
};

// Predefined overlay data for major cities
export const cityOverlayData = {
  'new_york': {
    center: [40.7128, -74.0060],
    securityCameras: [
      { id: 'nyc_sec_1', lat: 40.7589, lng: -73.9851, name: 'Times Square Security', icon: '📹' },
      { id: 'nyc_sec_2', lat: 40.7614, lng: -73.9776, name: 'Central Park South', icon: '📹' },
      { id: 'nyc_sec_3', lat: 40.7505, lng: -73.9934, name: 'Penn Station Area', icon: '📹' },
    ],
    cctvCameras: [
      { id: 'nyc_cctv_1', lat: 40.7488, lng: -73.9857, name: 'Herald Square Traffic', icon: '📷' },
      { id: 'nyc_cctv_2', lat: 40.7682, lng: -73.9816, name: 'Columbus Circle', icon: '📷' },
      { id: 'nyc_cctv_3', lat: 40.7282, lng: -74.0776, name: 'Battery Park Tunnel', icon: '📷' },
    ],
    highRiskAreas: [
      { id: 'nyc_risk_1', lat: 40.7300, lng: -73.9500, name: 'High Crime Zone', icon: '⚠️', severity: 'high' },
      { id: 'nyc_risk_2', lat: 40.7800, lng: -73.9200, name: 'Construction Zone', icon: '🚧', severity: 'medium' },
    ]
  },
  'default': {
    center: [40.7128, -74.0060] // Default to NYC if no specific city data
  }
};