"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"

interface LeafletInstance {
  map: (element: HTMLElement, options?: any) => any
  tileLayer: (url: string, options?: any) => any
  layerGroup: () => any
  marker: (latlng: [number, number], options?: any) => any
  polygon: (latlngs: [number, number][], options?: any) => any
  polyline: (latlngs: [number, number][], options?: any) => any
  divIcon: (options: any) => any
  FeatureGroup: new (layers?: any[]) => any
  Icon: {
    Default: {
      prototype: any
      mergeOptions: (options: any) => void
    }
  }
}

interface LeafletMapProps {
  routes?: {
    fastest?: {
      coordinates?: [number, number][]
      distance?: number
      duration?: number
    }
    safest?: {
      coordinates?: [number, number][]
      distance?: number
      duration?: number
    }
    origin?: [number, number]
    destination?: [number, number]
  }
  routeType: "fastest" | "safest"
  hazardMode: boolean
}

interface UnsafeZone {
  coords: [number, number][]
  risk: "high" | "medium" | "low"
  name: string
}

export default function LeafletMap({ routes, routeType, hazardMode }: LeafletMapProps) {
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const routeLayersRef = useRef<any>(null)
  const markersRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [L, setL] = useState<LeafletInstance | null>(null)

  console.log("[v0] LeafletMap component rendered with props:", { routes, routeType, hazardMode })

  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        console.log("[v0] Loading Leaflet from CDN...")

        const loadScript = (src: string): Promise<void> => {
          return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve()
              return
            }

            const script = document.createElement("script")
            script.src = src
            script.onload = () => resolve()
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
            document.head.appendChild(script)
          })
        }

        const loadCSS = (href: string): void => {
          if (document.querySelector(`link[href="${href}"]`)) return

          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = href
          document.head.appendChild(link)
        }

        if (typeof window !== "undefined") {
          // Remove CSS loading since we're importing it
          // loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css")

          await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")

          const leafletGlobal = (window as any).L as LeafletInstance
          if (leafletGlobal) {
            delete leafletGlobal.Icon.Default.prototype._getIconUrl
            leafletGlobal.Icon.Default.mergeOptions({
              iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
              iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            })
            setL(leafletGlobal)
            console.log("[v0] Leaflet loaded successfully from CDN")
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load Leaflet:", error)
      }
    }

    if (typeof window !== "undefined") {
      loadLeaflet()
    }
  }, [])

  const createCustomIcon = (color: string) => {
    if (!L) return null
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
  }

  const unsafeZones: UnsafeZone[] = [
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
    },
  ]

  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([9.9312, 76.2673], 12) // Kochi, Kerala

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      routeLayersRef.current = L.layerGroup().addTo(map)
      markersRef.current = L.layerGroup().addTo(map)

      unsafeZones.forEach((zone) => {
        const color = zone.risk === "high" ? "#ef4444" : "#f59e0b"
        const polygon = L.polygon(zone.coords, {
          color: color,
          fillColor: color,
          fillOpacity: hazardMode ? 0.3 : 0.1,
          weight: 2,
          opacity: 0.8,
        })
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">${zone.name}</h3>
              <p class="text-xs text-gray-600">${zone.risk.toUpperCase()} Risk Zone</p>
            </div>
          `)
      })

      mapRef.current = map
      setMapReady(true)

      // Fix map rendering issues by invalidating size after initialization
      setTimeout(() => {
        if (map) {
          map.invalidateSize()
        }
      }, 100)

      console.log("[v0] Map initialized successfully")
    } catch (error) {
      console.error("[v0] Error initializing map:", error)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [L, hazardMode])

  useEffect(() => {
    console.log("[v0] Route update effect checking:", { 
      hasL: !!L, 
      hasMap: !!mapRef.current, 
      hasRouteLayers: !!routeLayersRef.current, 
      hasMarkers: !!markersRef.current, 
      hasRoutes: !!routes 
    })
    
    if (!L || !mapRef.current || !routeLayersRef.current || !markersRef.current) {
      console.log("[v0] Map dependencies not ready yet")
      return
    }
    
    if (!routes) {
      console.log("[v0] No routes provided")
      return
    }

    console.log("[v0] Route update effect triggered:", { routes, routeType })

    try {
      const originIcon = createCustomIcon("#22c55e")
      const destinationIcon = createCustomIcon("#ef4444")

      routeLayersRef.current.clearLayers()
      markersRef.current.clearLayers()

      if (routes.origin && originIcon) {
        console.log("[v0] Adding origin marker:", routes.origin)
        const originMarker = L.marker(routes.origin, { icon: originIcon })
          .addTo(markersRef.current)
          .bindPopup("Origin: " + routes.origin.join(", "))
        console.log("[v0] Origin marker added")
      }

      if (routes.destination && destinationIcon) {
        console.log("[v0] Adding destination marker:", routes.destination)
        const destMarker = L.marker(routes.destination, { icon: destinationIcon })
          .addTo(markersRef.current)
          .bindPopup("Destination: " + routes.destination.join(", "))
        console.log("[v0] Destination marker added")
      }

      const currentRoute = routes[routeType]
      console.log("[v0] Current route data:", currentRoute)
      
      if (currentRoute?.coordinates && currentRoute.coordinates.length > 0) {
        console.log("[v0] Drawing route with coordinates:", currentRoute.coordinates.length, "points")
        console.log("[v0] First few coordinates:", currentRoute.coordinates.slice(0, 3))
        console.log("[v0] Origin/Destination:", routes.origin, routes.destination)
        
        const routeColor = routeType === "fastest" ? "#3b82f6" : "#22c55e"
        
        // Ensure coordinates are in [lat, lng] format for Leaflet
        const leafletCoords: [number, number][] = currentRoute.coordinates.map(coord => {
          // Coordinates should already be [lat, lng] from routing.ts
          return [coord[0], coord[1]] as [number, number]
        })
        
        console.log("[v0] Converted coordinates sample:", leafletCoords.slice(0, 3))
        
        const routeLine = L.polyline(leafletCoords, {
          color: routeColor,
          weight: 6,
          opacity: 0.8,
        }).addTo(routeLayersRef.current)

        // Add a simple test line to verify the map can display polylines
        console.log("[v0] Adding test route line for verification")
        const testLine = L.polyline([
          [9.9312, 76.2673], // Kochi
          [9.5, 76.5],       // Midpoint
          [8.5241, 76.9366]  // Trivandrum
        ], {
          color: '#ff0000',
          weight: 4,
          opacity: 1.0,
          dashArray: '10, 10'
        }).addTo(routeLayersRef.current)
        
        console.log("[v0] Test line added")

        const group = new L.FeatureGroup([routeLine, testLine])
        if (routes.origin) {
          const originMarker = L.marker(routes.origin)
          group.addLayer(originMarker)
        }
        if (routes.destination) {
          const destMarker = L.marker(routes.destination)
          group.addLayer(destMarker)
        }

        // Fit bounds to show the entire route
        console.log("[v0] Fitting map bounds to route")
        mapRef.current.fitBounds(group.getBounds(), { 
          padding: [50, 50],
          maxZoom: 10 // Don't zoom in too much
        })
        console.log("[v0] Route displayed successfully")
      } else {
        console.log("[v0] No route coordinates available")
      }

      console.log("[v0] Routes updated:", { routeType, hasRoute: !!currentRoute })
    } catch (error) {
      console.error("[v0] Error updating routes:", error)
    }
  }, [L, routes, routeType])

  useEffect(() => {
    if (!L || !mapRef.current) return

    const handleMapClick = (e: any) => {
      console.log("[v0] Map clicked at:", e.latlng)
    }

    mapRef.current.on("click", handleMapClick)

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleMapClick)
      }
    }
  }, [L, mapReady])

  if (!L) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading Leaflet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {!L && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading Leaflet library...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full" 
        style={{ 
          minHeight: '400px',
          position: 'relative',
          zIndex: 1
        }} 
      />
      {!mapReady && L && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      {hazardMode && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          Hazard Mode Active
        </div>
      )}
      {routes && mapReady && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
          Route loaded: {routes[routeType]?.coordinates?.length || 0} points
        </div>
      )}
    </div>
  )
}
