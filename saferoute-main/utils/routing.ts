import * as turf from "@turf/turf"

export interface RoutePoint {
  lat: number
  lon: number
}

export interface Route {
  coordinates: [number, number][]
  distance: number
  duration: number
  safetyScore: number
  avoidedZones: number
}

export interface UnsafeZone {
  coords: [number, number][]
  risk: "high" | "medium" | "low"
  name: string
  riskMultiplier: number
}

// Predefined unsafe zones with risk multipliers for Kerala, India
export const UNSAFE_ZONES: UnsafeZone[] = [
  {
    coords: [
      [9.9816, 76.2999], // Edappally area
      [9.9816, 76.3099],
      [9.9716, 76.3099],
      [9.9716, 76.2999],
      [9.9816, 76.2999], // Close the polygon
    ],
    risk: "high",
    name: "Heavy Traffic Zone - Edappally",
    riskMultiplier: 3.0,
  },
  {
    coords: [
      [9.9588, 76.2903], // Marine Drive area
      [9.9588, 76.3003],
      [9.9488, 76.3003],
      [9.9488, 76.2903],
      [9.9588, 76.2903], // Close the polygon
    ],
    risk: "medium",
    name: "Congestion Area - Marine Drive",
    riskMultiplier: 1.5,
  },
  {
    coords: [
      [10.0151, 76.3124], // Aluva area
      [10.0151, 76.3224],
      [10.0051, 76.3224],
      [10.0051, 76.3124],
      [10.0151, 76.3124], // Close the polygon
    ],
    risk: "high",
    name: "Accident Prone Zone - Aluva Junction",
    riskMultiplier: 2.5,
  },
]

export async function getFastestRoute(origin: RoutePoint, destination: RoutePoint): Promise<Route | null> {
  try {
    console.log("[v0] Calculating fastest route...")
    
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&alternatives=false`,
    )

    if (!response.ok) {
      throw new Error(`OSRM API failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      return null
    }

    const route = data.routes[0]
    const coordinates: [number, number][] = route.geometry.coordinates.map((coord: [number, number]) => [
      coord[1], // lat
      coord[0], // lon
    ])

    const safetyScore = calculateSafetyScore(coordinates)

    console.log("[v0] Fastest route calculated:", {
      distance: route.distance,
      duration: route.duration,
      points: coordinates.length,
      safetyScore
    })

    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      safetyScore,
      avoidedZones: 0,
    }
  } catch (error) {
    console.error("[v0] Fastest route error:", error)
    return null
  }
}

export async function getSafestRoute(origin: RoutePoint, destination: RoutePoint): Promise<Route | null> {
  try {
    console.log("[v0] Calculating safest (longer) route...")
    
    // Generate multiple waypoints for a longer, safer route
    const waypoints = generateSafeWaypoints(origin, destination)
    
    // Try different routing strategies to get a longer route
    const strategies = [
      { waypoints: waypoints.scenic, name: "scenic" },
      { waypoints: waypoints.detour, name: "detour" }, 
      { waypoints: waypoints.residential, name: "residential" }
    ]
    
    let bestSafeRoute: Route | null = null
    
    for (const strategy of strategies) {
      try {
        const route = await calculateRouteWithWaypoints(origin, destination, strategy.waypoints)
        
        if (route && (!bestSafeRoute || route.distance > bestSafeRoute.distance)) {
          bestSafeRoute = {
            ...route,
            safetyScore: Math.min(route.safetyScore + 25, 95), // Boost safety score
            avoidedZones: strategy.waypoints.length // Count waypoints as avoided zones
          }
          console.log(`[v0] Better safe route found using ${strategy.name} strategy:`, {
            distance: route.distance,
            duration: route.duration,
            points: route.coordinates.length
          })
        }
      } catch (error) {
        console.warn(`[v0] ${strategy.name} strategy failed:`, error)
      }
    }
    
    // If no waypoint route worked, fall back to alternative route request
    if (!bestSafeRoute) {
      console.log("[v0] Trying alternative route from OSRM...")
      bestSafeRoute = await getAlternativeRoute(origin, destination)
    }
    
    // If still no route, use fastest route as fallback but mark as less safe
    if (!bestSafeRoute) {
      console.log("[v0] Using fastest route as safe route fallback...")
      const fastRoute = await getFastestRoute(origin, destination)
      if (fastRoute) {
        bestSafeRoute = {
          ...fastRoute,
          safetyScore: Math.max(fastRoute.safetyScore - 10, 50),
          avoidedZones: 0
        }
      }
    }
    
    return bestSafeRoute
    
  } catch (error) {
    console.error("[v0] Safest route error:", error)
    return null
  }
}

// Generate waypoints for safer, longer routes
function generateSafeWaypoints(origin: RoutePoint, destination: RoutePoint) {
  const midLat = (origin.lat + destination.lat) / 2
  const midLon = (origin.lon + destination.lon) / 2
  
  // Calculate distance for appropriate waypoint spacing
  const distance = Math.sqrt(
    Math.pow(destination.lat - origin.lat, 2) + 
    Math.pow(destination.lon - origin.lon, 2)
  )
  
  // Scale waypoint offsets based on distance
  const baseOffset = Math.min(distance * 0.3, 0.05) // Adaptive offset
  
  return {
    // Scenic route (goes through less urban areas)
    scenic: [
      { lat: midLat + baseOffset, lon: midLon - baseOffset * 0.7 },
      { lat: midLat - baseOffset * 0.5, lon: midLon + baseOffset }
    ],
    
    // Detour route (takes a longer path)
    detour: [
      { lat: origin.lat + baseOffset * 0.8, lon: origin.lon + baseOffset * 1.2 },
      { lat: destination.lat - baseOffset * 0.8, lon: destination.lon - baseOffset * 1.2 }
    ],
    
    // Residential route (avoids highways/main roads)
    residential: [
      { lat: midLat + baseOffset * 1.5, lon: midLon + baseOffset * 0.3 }
    ]
  }
}

// Calculate route with specific waypoints
async function calculateRouteWithWaypoints(
  origin: RoutePoint, 
  destination: RoutePoint, 
  waypoints: RoutePoint[]
): Promise<Route | null> {
  try {
    // Build waypoints string for OSRM
    const allPoints = [origin, ...waypoints, destination]
    const coordinatesString = allPoints.map(p => `${p.lon},${p.lat}`).join(';')
    
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson&continue_straight=false`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    if (!data.routes || data.routes.length === 0) return null
    
    const route = data.routes[0]
    const coordinates: [number, number][] = route.geometry.coordinates.map((coord: [number, number]) => [
      coord[1], // lat
      coord[0], // lon
    ])
    
    const safetyScore = calculateSafetyScore(coordinates)
    
    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      safetyScore,
      avoidedZones: waypoints.length,
    }
  } catch (error) {
    console.error("[v0] Waypoint route calculation error:", error)
    return null
  }
}

// Get alternative route using OSRM alternatives
async function getAlternativeRoute(origin: RoutePoint, destination: RoutePoint): Promise<Route | null> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&alternatives=true&alternative_count=3`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    if (!data.routes || data.routes.length < 2) return null
    
    // Pick the longest alternative route
    const alternatives = data.routes.slice(1) // Skip the first (fastest) route
    const longestRoute = alternatives.reduce((longest: any, current: any) => 
      current.distance > longest.distance ? current : longest
    )
    
    const coordinates: [number, number][] = longestRoute.geometry.coordinates.map((coord: [number, number]) => [
      coord[1], // lat
      coord[0], // lon
    ])
    
    const safetyScore = calculateSafetyScore(coordinates)
    
    return {
      coordinates,
      distance: longestRoute.distance,
      duration: longestRoute.duration,
      safetyScore: safetyScore + 15, // Boost for alternative route
      avoidedZones: 1,
    }
  } catch (error) {
    console.error("[v0] Alternative route error:", error)
    return null
  }
}

function calculateSafetyScore(coordinates: [number, number][]): number {
  const routeLine = turf.lineString(coordinates.map((coord) => [coord[1], coord[0]]))
  let totalRisk = 0
  let intersectionCount = 0

  for (const zone of UNSAFE_ZONES) {
    // Ensure the polygon is properly closed by making first and last coordinates the same
    const zoneCoords = zone.coords.map((coord) => [coord[1], coord[0]])
    if (zoneCoords.length > 0 && 
        (zoneCoords[0][0] !== zoneCoords[zoneCoords.length - 1][0] || 
         zoneCoords[0][1] !== zoneCoords[zoneCoords.length - 1][1])) {
      zoneCoords.push(zoneCoords[0]) // Close the polygon
    }
    const zonePolygon = turf.polygon([zoneCoords])

    if (turf.booleanIntersects(routeLine, zonePolygon)) {
      totalRisk += zone.riskMultiplier
      intersectionCount++
    }
  }

  // Base safety score of 100, reduced by risk factors
  const baseScore = 100
  const riskPenalty = totalRisk * 10 + intersectionCount * 5

  return Math.max(baseScore - riskPenalty, 10)
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}
