"use client"

import { useEffect, useRef } from "react"

interface SimpleMapProps {
  routes?: {
    fastest?: {
      coordinates?: [number, number][]
    }
    safest?: {
      coordinates?: [number, number][]
    }
    origin?: [number, number]
    destination?: [number, number]
  }
  routeType: "fastest" | "safest"
}

export default function SimpleMap({ routes, routeType }: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  console.log("[v0] SimpleMap received routes:", routes)

  useEffect(() => {
    if (!mapRef.current) return

    const initMap = async () => {
      try {
        // Load Leaflet dynamically
        const L = await import('leaflet')
        
        // Import CSS
        await import('leaflet/dist/leaflet.css')

        console.log("[v0] Leaflet loaded, initializing map")

        // Fix default markers
        delete (L.default as any).Icon.Default.prototype._getIconUrl;
        (L.default as any).Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // Create map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        mapInstanceRef.current = L.default.map(mapRef.current).setView([9.9312, 76.2673], 10)

        // Add tiles
        L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current)

        console.log("[v0] Map initialized successfully")

        // Display actual route if available
        if (routes && routes[routeType]?.coordinates) {
          console.log("[v0] Adding actual route with", routes[routeType]?.coordinates?.length, "points")
          
          const routeColor = routeType === "fastest" ? "#0066ff" : "#00cc00"
          
          L.default.polyline(routes[routeType]!.coordinates!, {
            color: routeColor,
            weight: 6,
            opacity: 0.9
          }).addTo(mapInstanceRef.current)

          // Add origin/destination markers if available
          if (routes.origin) {
            L.default.marker(routes.origin)
              .addTo(mapInstanceRef.current)
              .bindPopup("Origin")
          }

          if (routes.destination) {
            L.default.marker(routes.destination)
              .addTo(mapInstanceRef.current)
              .bindPopup("Destination")
          }

          console.log("[v0] Actual route displayed")
        }

      } catch (error) {
        console.error("[v0] Error initializing map:", error)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [routes, routeType])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      
      {/* Debug info */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs z-[1000]">
        SimpleMap: {routes ? 'Routes loaded' : 'No routes'} | Type: {routeType}
      </div>
      
      {routes && (
        <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs z-[1000]">
          Coords: {routes[routeType]?.coordinates?.length || 0}
        </div>
      )}
    </div>
  )
}
