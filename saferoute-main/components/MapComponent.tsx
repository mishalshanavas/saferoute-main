"use client"
import dynamic from "next/dynamic"

const DynamicMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

interface MapComponentProps {
  routes?: {
    fastest?: any
    safest?: any
    origin?: [number, number]
    destination?: [number, number]
  }
  routeType: "fastest" | "safest"
  hazardMode: boolean
}

export default function MapComponent({ routes, routeType, hazardMode }: MapComponentProps) {
  console.log("[v0] MapComponent wrapper received routes:", routes)
  
  return (
    <div className="relative w-full h-full">
      <DynamicMap routes={routes} routeType={routeType} hazardMode={hazardMode} />
      {routes && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-[1001]">
          Routes: {routes.fastest ? '✓' : '✗'} | {routes.safest ? '✓' : '✗'}
        </div>
      )}
    </div>
  )
}
