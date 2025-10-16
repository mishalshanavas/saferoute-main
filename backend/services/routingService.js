const axios = require('axios');
const turf = require('@turf/turf');

/**
 * Calculate safe route using Node.js fallback implementation
 */
async function calculateSafeRoute(origin, destination, preferences = {}) {
  try {
    // Get fastest route first
    const fastestRoute = await getFastestRoute(origin, destination);
    
    if (!fastestRoute || !fastestRoute.coordinates) {
      throw new Error('Unable to get base route');
    }

    // Get unsafe zones along the route
    const UnsafeZone = require('../models/UnsafeZone');
    const unsafeZones = await UnsafeZone.findActiveZones(origin, 50);
    
    // Modify route to avoid unsafe zones
    const safeCoordinates = await avoidUnsafeZones(
      fastestRoute.coordinates, 
      unsafeZones, 
      preferences
    );

    // Recalculate distance and duration for modified route
    const safeRoute = await recalculateRouteMetrics(safeCoordinates);
    
    return {
      coordinates: safeCoordinates,
      distance: safeRoute.distance,
      duration: safeRoute.duration,
      safetyScore: 0, // Will be calculated by caller
      avoidedZones: safeRoute.avoidedZones || 0
    };

  } catch (error) {
    console.error('Safe route calculation error:', error);
    throw error;
  }
}

/**
 * Calculate route safety score based on intersections with unsafe zones and hazards
 */
async function calculateRouteScore(coordinates, unsafeZones = [], hazards = []) {
  try {
    let score = 100; // Start with perfect score
    
    if (!coordinates || coordinates.length === 0) {
      return 50; // Default score for invalid routes
    }

    const routeLine = turf.lineString(coordinates);
    const routeLength = turf.length(routeLine, { units: 'kilometers' });

    // Check intersections with unsafe zones
    let totalIntersectionLength = 0;
    let zoneIntersections = 0;

    for (const zone of unsafeZones) {
      try {
        const zonePolygon = turf.polygon(zone.geometry.coordinates);
        
        if (turf.booleanIntersects(routeLine, zonePolygon)) {
          zoneIntersections++;
          
          // Calculate intersection length (approximate)
          const intersection = turf.lineIntersect(routeLine, zonePolygon);
          if (intersection.features.length > 0) {
            const intersectionLength = routeLength * 0.1; // Rough estimate
            totalIntersectionLength += intersectionLength;
            
            // Apply risk penalty based on zone risk level
            const riskPenalty = getRiskPenalty(zone.riskLevel, zone.riskMultiplier);
            score -= riskPenalty;
          }
        }
      } catch (zoneError) {
        console.error('Zone intersection error:', zoneError);
      }
    }

    // Check proximity to active hazards
    for (const hazard of hazards) {
      try {
        const hazardPoint = turf.point(hazard.location.coordinates);
        const distance = turf.pointToLineDistance(hazardPoint, routeLine, { units: 'meters' });
        
        if (distance <= hazard.affectedRadius) {
          const hazardPenalty = getHazardPenalty(hazard.severity, hazard.type, distance, hazard.affectedRadius);
          score -= hazardPenalty;
        }
      } catch (hazardError) {
        console.error('Hazard proximity error:', hazardError);
      }
    }

    // Apply route length penalty (longer routes are generally less safe)
    if (routeLength > 50) {
      score -= Math.min(10, (routeLength - 50) * 0.1);
    }

    // Ensure score is within valid range
    return Math.max(0, Math.min(100, Math.round(score)));

  } catch (error) {
    console.error('Safety score calculation error:', error);
    return 50; // Default score on error
  }
}

/**
 * Get risk penalty based on unsafe zone properties
 */
function getRiskPenalty(riskLevel, riskMultiplier = 1.0) {
  const basePenalties = {
    low: 5,
    medium: 15,
    high: 25,
    critical: 40
  };
  
  return (basePenalties[riskLevel] || 10) * riskMultiplier;
}

/**
 * Get hazard penalty based on hazard properties
 */
function getHazardPenalty(severity, type, distance, affectedRadius) {
  const severityMultipliers = {
    minor: 1.0,
    moderate: 1.5,
    major: 2.0,
    critical: 3.0
  };

  const typeMultipliers = {
    accident: 2.0,
    road_closure: 3.0,
    construction: 1.5,
    traffic_jam: 1.2,
    weather_incident: 1.8,
    police_activity: 1.3,
    flooding: 2.5,
    other: 1.0
  };

  // Distance factor: closer hazards have more impact
  const distanceFactor = 1 - (distance / affectedRadius);
  
  const basePenalty = 20;
  const severityFactor = severityMultipliers[severity] || 1.0;
  const typeFactor = typeMultipliers[type] || 1.0;
  
  return basePenalty * severityFactor * typeFactor * distanceFactor;
}

/**
 * Avoid unsafe zones by modifying route coordinates
 */
async function avoidUnsafeZones(coordinates, unsafeZones, preferences) {
  try {
    const safetyPriority = preferences.safetyPriority || 50;
    const maxDetour = preferences.maxDetour || 20; // percentage
    
    if (safetyPriority < 30) {
      // Low safety priority, minimal changes
      return coordinates;
    }

    let modifiedCoordinates = [...coordinates];
    let avoidedZones = 0;

    for (const zone of unsafeZones) {
      if (zone.riskLevel === 'low' && safetyPriority < 70) {
        continue; // Skip low-risk zones unless high safety priority
      }

      const zonePolygon = turf.polygon(zone.geometry.coordinates);
      const routeLine = turf.lineString(modifiedCoordinates);

      if (turf.booleanIntersects(routeLine, zonePolygon)) {
        // Try to modify route to avoid this zone
        const zoneBounds = turf.bbox(zonePolygon);
        const zoneCentroid = turf.centroid(zonePolygon);
        
        // Find intersection points
        const intersectionPoints = turf.lineIntersect(routeLine, zonePolygon);
        
        if (intersectionPoints.features.length > 0) {
          const modifiedRoute = await createDetourAroundZone(
            modifiedCoordinates,
            zone,
            intersectionPoints.features,
            maxDetour
          );
          
          if (modifiedRoute) {
            modifiedCoordinates = modifiedRoute;
            avoidedZones++;
          }
        }
      }
    }

    return modifiedCoordinates;

  } catch (error) {
    console.error('Zone avoidance error:', error);
    return coordinates; // Return original on error
  }
}

/**
 * Create detour around unsafe zone
 */
async function createDetourAroundZone(coordinates, zone, intersectionPoints, maxDetour) {
  try {
    const zonePolygon = turf.polygon(zone.geometry.coordinates);
    const zoneBounds = turf.bbox(zonePolygon);
    const zoneCentroid = turf.centroid(zonePolygon).geometry.coordinates;

    // Simple approach: offset coordinates that are inside the zone
    const modifiedCoordinates = [];

    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];
      const point = turf.point(coord);

      if (turf.booleanPointInPolygon(point, zonePolygon)) {
        // Point is inside unsafe zone, create offset
        const bearing = turf.bearing(zoneCentroid, coord);
        const offsetDistance = 0.5; // 500 meters offset
        const offsetPoint = turf.destination(point, offsetDistance, bearing);
        modifiedCoordinates.push(offsetPoint.geometry.coordinates);
      } else {
        modifiedCoordinates.push(coord);
      }
    }

    return modifiedCoordinates;

  } catch (error) {
    console.error('Detour creation error:', error);
    return null;
  }
}

/**
 * Get fastest route from OSRM
 */
async function getFastestRoute(origin, destination) {
  try {
    const osrmUrl = `${process.env.OSRM_BASE_URL || 'http://router.project-osrm.org'}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    
    const response = await axios.get(osrmUrl, { timeout: 5000 });
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        coordinates: route.geometry.coordinates,
        distance: Math.round(route.distance),
        duration: Math.round(route.duration)
      };
    }
    
    return null;
  } catch (error) {
    console.error('OSRM route error:', error);
    throw error;
  }
}

/**
 * Recalculate route metrics after modification
 */
async function recalculateRouteMetrics(coordinates) {
  try {
    // Create waypoints for OSRM (max 25 waypoints for free API)
    const maxWaypoints = 25;
    const step = Math.max(1, Math.floor(coordinates.length / maxWaypoints));
    const waypoints = [];
    
    for (let i = 0; i < coordinates.length; i += step) {
      waypoints.push(coordinates[i]);
    }
    
    // Ensure last coordinate is included
    if (waypoints[waypoints.length - 1] !== coordinates[coordinates.length - 1]) {
      waypoints.push(coordinates[coordinates.length - 1]);
    }

    // Build OSRM URL with waypoints
    const waypointStr = waypoints.map(coord => `${coord[0]},${coord[1]}`).join(';');
    const osrmUrl = `${process.env.OSRM_BASE_URL || 'http://router.project-osrm.org'}/route/v1/driving/${waypointStr}?overview=full&geometries=geojson`;
    
    const response = await axios.get(osrmUrl, { timeout: 5000 });
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: Math.round(route.distance),
        duration: Math.round(route.duration),
        coordinates: route.geometry.coordinates
      };
    }

    // Fallback: calculate approximate metrics using Turf
    const routeLine = turf.lineString(coordinates);
    const distance = turf.length(routeLine, { units: 'meters' }) * 1000; // Convert to meters
    const duration = distance / 13.89; // Approximate: 50 km/h average speed

    return {
      distance: Math.round(distance),
      duration: Math.round(duration)
    };

  } catch (error) {
    console.error('Route metrics calculation error:', error);
    
    // Fallback calculation
    const routeLine = turf.lineString(coordinates);
    const distance = turf.length(routeLine, { units: 'meters' }) * 1000;
    const duration = distance / 13.89;

    return {
      distance: Math.round(distance),
      duration: Math.round(duration)
    };
  }
}

module.exports = {
  calculateSafeRoute,
  calculateRouteScore,
  getFastestRoute,
  avoidUnsafeZones,
  getRiskPenalty,
  getHazardPenalty
};