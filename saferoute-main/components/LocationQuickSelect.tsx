"use client"

import { Button } from "@/components/ui/button"
import { MapPin, Navigation } from "lucide-react"

interface LocationQuickSelectProps {
  onLocationSelect: (location: string) => void
  onCurrentLocation: () => void
  type: "origin" | "destination"
}

const POPULAR_LOCATIONS = {
  origin: ["Kochi Airport (COK)", "Ernakulam Railway Station", "Marine Drive, Kochi", "MG Road, Kochi"],
  destination: ["Trivandrum Airport (TRV)", "Munnar Hill Station", "Alleppey Backwaters", "Kozhikode Beach"],
}

export default function LocationQuickSelect({ onLocationSelect, onCurrentLocation, type }: LocationQuickSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCurrentLocation} className="flex-1 text-xs bg-transparent">
          <Navigation className="w-3 h-3 mr-1" />
          Current
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {POPULAR_LOCATIONS[type].map((location) => (
          <Button
            key={location}
            variant="ghost"
            size="sm"
            onClick={() => onLocationSelect(location)}
            className="justify-start text-xs h-8 px-2"
          >
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
