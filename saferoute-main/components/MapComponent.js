"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const MapComponent = ({ fastestRoute, safestRoute, unsafeZones, hazardMarkers }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef({
    fastestRoute: null,
    safestRoute: null,
    unsafeZones: [],
    hazardMarkers: [],
  })

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map instance - centered on Kochi, Kerala, India
    mapInstanceRef.current = L.map(mapRef.current).setView([9.9312, 76.2673], 12)

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstanceRef.current)

    // Fix map rendering issues by invalidating size after a short delay
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 100)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update fastest route
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Remove existing fastest route
    if (layersRef.current.fastestRoute) {
      mapInstanceRef.current.removeLayer(layersRef.current.fastestRoute)
      layersRef.current.fastestRoute = null
    }

    // Add new fastest route
    if (fastestRoute && fastestRoute.coordinates) {
      const latLngs = fastestRoute.coordinates.map((coord) => [coord[1], coord[0]])

      layersRef.current.fastestRoute = L.polyline(latLngs, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.8,
      }).addTo(mapInstanceRef.current)

      // Fit map to route bounds
      mapInstanceRef.current.fitBounds(layersRef.current.fastestRoute.getBounds(), {
        padding: [20, 20],
      })

      // Add popup with route info
      layersRef.current.fastestRoute.bindPopup(`
        <div>
          <strong>Fastest Route</strong><br/>
          Intersections: ${fastestRoute.intersectionData.intersectionCount}<br/>
          ${fastestRoute.intersectionData.intersectedZones.map((zone) => `⚠️ ${zone.name}`).join("<br/>")}
        </div>
      `)
    }
  }, [fastestRoute])

  // Update safest route
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Remove existing safest route
    if (layersRef.current.safestRoute) {
      mapInstanceRef.current.removeLayer(layersRef.current.safestRoute)
      layersRef.current.safestRoute = null
    }

    // Add new safest route
    if (safestRoute && safestRoute.coordinates) {
      const latLngs = safestRoute.coordinates.map((coord) => [coord[1], coord[0]])

      layersRef.current.safestRoute = L.polyline(latLngs, {
        color: "#16a34a",
        weight: 4,
        opacity: 0.8,
      }).addTo(mapInstanceRef.current)

      // Fit map to route bounds
      mapInstanceRef.current.fitBounds(layersRef.current.safestRoute.getBounds(), {
        padding: [20, 20],
      })

      // Add popup with route info
      layersRef.current.safestRoute.bindPopup(`
        <div>
          <strong>Safest Route</strong><br/>
          Intersections: ${safestRoute.intersectionData.intersectionCount}<br/>
          ${safestRoute.intersectionData.intersectedZones.map((zone) => `⚠️ ${zone.name}`).join("<br/>")}
        </div>
      `)
    }
  }, [safestRoute])

  // Update unsafe zones
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Remove existing unsafe zones
    layersRef.current.unsafeZones.forEach((layer) => {
      mapInstanceRef.current.removeLayer(layer)
    })
    layersRef.current.unsafeZones = []

    // Add new unsafe zones
    if (unsafeZones && Array.isArray(unsafeZones)) {
      unsafeZones.forEach((zone) => {
        const coordinates = zone.geometry.coordinates[0].map((coord) => [coord[1], coord[0]])

        const color = zone.properties.risk_level === "high" ? "#dc2626" : "#f59e0b"

        const polygon = L.polygon(coordinates, {
          color: color,
          fillColor: color,
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(mapInstanceRef.current)

        polygon.bindPopup(`
          <div>
            <strong>${zone.properties.name}</strong><br/>
            Risk Level: ${zone.properties.risk_level}<br/>
            ${zone.properties.created_at ? `Created: ${new Date(zone.properties.created_at).toLocaleString()}` : ""}
          </div>
        `)

        layersRef.current.unsafeZones.push(polygon)
      })
    }
  }, [unsafeZones])  // Update hazard markers
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Remove existing hazard markers
    layersRef.current.hazardMarkers.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })
    layersRef.current.hazardMarkers = []

    // Add new hazard markers
    if (hazardMarkers && Array.isArray(hazardMarkers)) {
      hazardMarkers.forEach((coords) => {
        const marker = L.marker([coords[1], coords[0]], {
          icon: L.divIcon({
            html: "🚨",
            className: "hazard-marker",
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(mapInstanceRef.current)

        marker.bindPopup(`
          <div>
            <strong>Simulated Hazard</strong><br/>
            Emergency situation detected<br/>
            Avoid this area for safety
          </div>
        `)

        layersRef.current.hazardMarkers.push(marker)
      })
    }
  }, [hazardMarkers])

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full" 
        style={{ 
          minHeight: '400px',
          zIndex: 1 
        }} 
      />

      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
        <h4 className="font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-blue-600 mr-2"></div>
            <span>Fastest Route</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-green-600 mr-2"></div>
            <span>Safest Route</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-600 opacity-30 border border-red-600 mr-2"></div>
            <span>High Risk Zone</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 opacity-30 border border-yellow-500 mr-2"></div>
            <span>Medium Risk Zone</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🚨</span>
            <span>Simulated Hazard</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapComponent
