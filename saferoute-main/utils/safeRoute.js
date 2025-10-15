import * as turf from "@turf/turf"

/**
 * Check if a route intersects with any unsafe zones
 * @param {Array} routeCoordinates - Array of [lng, lat] coordinates
 * @param {Array} unsafeZones - Array of GeoJSON polygon features
 * @returns {Object} - { intersects: boolean, intersectionCount: number, intersectedZones: Array }
 */
export function checkRouteIntersections(routeCoordinates, unsafeZones) {
  let intersectionCount = 0
  const intersectedZones = []

  // Convert route coordinates to turf LineString
  const routeLine = turf.lineString(routeCoordinates)

  unsafeZones.forEach((zone, index) => {
    try {
      // Check if route intersects with unsafe zone polygon
      const intersects = turf.booleanIntersects(routeLine, zone.geometry)

      if (intersects) {
        intersectionCount++
        intersectedZones.push({
          index,
          name: zone.properties.name,
          riskLevel: zone.properties.risk_level,
        })
      }
    } catch (error) {
      console.warn("Error checking intersection for zone:", zone.properties.name, error)
    }
  })

  return {
    intersects: intersectionCount > 0,
    intersectionCount,
    intersectedZones,
  }
}

/**
 * Generate a safer route by offsetting coordinates away from unsafe zones
 * @param {Array} originalRoute - Original route coordinates
 * @param {Array} unsafeZones - Array of unsafe zone polygons
 * @param {Object} intersectionData - Data about intersections
 * @returns {Array} - Modified route coordinates
 */
export function generateSafeRoute(originalRoute, unsafeZones, intersectionData) {
  if (!intersectionData.intersects) {
    return originalRoute // No intersections, return original route
  }

  const safeRoute = [...originalRoute]
  const offsetDistance = 0.002 // Offset distance in degrees (~200m)

  // For each point in the route, check if it's near an unsafe zone
  safeRoute.forEach((coord, index) => {
    const point = turf.point(coord)

    unsafeZones.forEach((zone) => {
      try {
        // Check if point is within or very close to unsafe zone
        const isInZone = turf.booleanPointInPolygon(point, zone.geometry)
        const distanceToZone = turf.pointToPolygonDistance(point, zone.geometry, { units: "degrees" })

        if (isInZone || distanceToZone < 0.001) {
          // Calculate centroid of unsafe zone
          const zoneCentroid = turf.centroid(zone.geometry)

          // Calculate direction away from zone centroid
          const bearing = turf.bearing(zoneCentroid, point)

          // Move point away from unsafe zone
          const offsetPoint = turf.destination(point, offsetDistance, bearing, { units: "degrees" })

          // Update coordinates
          safeRoute[index] = offsetPoint.geometry.coordinates
        }
      } catch (error) {
        console.warn("Error processing safe route for point:", coord, error)
      }
    })
  })

  return safeRoute
}

/**
 * Calculate safety score for a route
 * @param {Object} intersectionData - Data about route intersections
 * @param {number} routeDistance - Route distance in km
 * @returns {number} - Safety score (0-100)
 */
export function calculateSafetyScore(intersectionData, routeDistance = 10) {
  const baseScore = 100

  // Deduct points for intersections
  const intersectionPenalty = intersectionData.intersectionCount * 25

  // Additional penalty based on risk levels
  let riskPenalty = 0
  intersectionData.intersectedZones.forEach((zone) => {
    if (zone.riskLevel === "high") {
      riskPenalty += 15
    } else if (zone.riskLevel === "medium") {
      riskPenalty += 8
    }
  })

  // Add some randomness to make it more realistic
  const randomFactor = Math.random() * 10 - 5 // -5 to +5

  const finalScore = Math.max(0, Math.min(100, baseScore - intersectionPenalty - riskPenalty + randomFactor))

  return Math.round(finalScore)
}

/**
 * Create a hazard zone around a point
 * @param {Array} coordinates - [lng, lat] coordinates
 * @param {number} radius - Radius in kilometers
 * @returns {Object} - GeoJSON polygon feature
 */
export function createHazardZone(coordinates, radius = 0.5) {
  const center = turf.point(coordinates)
  const circle = turf.circle(center, radius, { units: "kilometers" })

  return {
    type: "Feature",
    properties: {
      name: "Simulated Hazard",
      risk_level: "high",
      created_at: new Date().toISOString(),
    },
    geometry: circle.geometry,
  }
}
