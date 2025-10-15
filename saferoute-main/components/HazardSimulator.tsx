"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Zap, Construction, Car } from "lucide-react"

export interface SimulatedSafetyFactor {
  id: string
  type: "crime_rate" | "street_lights" | "houses" | "cctv" | "police_presence"
  location: [number, number]
  level: "low" | "medium" | "high"
  description: string
  timestamp: Date
  duration: number // minutes
}

interface HazardSimulatorProps {
  active: boolean
  onFactorsChange: (factors: SimulatedSafetyFactor[]) => void
}

const SAFETY_FACTORS = {
  crime_rate: { icon: AlertTriangle, color: "text-red-500", label: "Crime Rate" },
  street_lights: { icon: Zap, color: "text-yellow-400", label: "Street Lights" },
  houses: { icon: Car, color: "text-green-600", label: "Number of Houses" },
  cctv: { icon: Construction, color: "text-blue-500", label: "CCTV Coverage" },
  police_presence: { icon: Badge, color: "text-indigo-500", label: "Police Presence" },
}


export default function HazardSimulator({ active, onFactorsChange }: HazardSimulatorProps) {
  const [factors, setFactors] = useState<SimulatedSafetyFactor[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  // Handle safety factors change callback in useEffect
  useEffect(() => {
    onFactorsChange(factors)
  }, [factors, onFactorsChange])

  useEffect(() => {
    if (!active) {
      setFactors([])
      setIsSimulating(false)
      return
    }

    setIsSimulating(true)
    const interval = setInterval(() => {
      // Randomly add new safety factors
      if (Math.random() < 0.3 && factors.length < 5) {
        const newFactor = generateRandomFactor()
        setFactors((prev) => {
          const updated = [...prev, newFactor]
          return updated
        })
      }

      // Remove expired factors
      setFactors((prev) => {
        const now = new Date()
        const filtered = prev.filter((factor) => {
          const expiry = new Date(factor.timestamp.getTime() + factor.duration * 60000)
          return expiry > now
        })
        return filtered
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [active, factors.length, onFactorsChange])

  const generateRandomFactor = (): SimulatedSafetyFactor => {
    const types: Array<SimulatedSafetyFactor["type"]> = ["crime_rate", "street_lights", "houses", "cctv", "police_presence"]
    const levels: Array<SimulatedSafetyFactor["level"]> = ["low", "medium", "high"]
    const type = types[Math.floor(Math.random() * types.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]

    // Generate random location in Kerala area
    const baseLat = 9.9312
    const baseLon = 76.2673
    const lat = baseLat + (Math.random() - 0.5) * 0.1
    const lon = baseLon + (Math.random() - 0.5) * 0.1

    const descriptions = {
      crime_rate: ["Low crime area", "Moderate crime risk", "High crime hotspot"],
      street_lights: ["Well-lit street", "Some street lights", "Poorly lit area"],
      houses: ["Densely populated", "Moderate housing", "Sparse houses"],
      cctv: ["CCTV everywhere", "Some CCTV coverage", "No CCTV"],
      police_presence: ["Police patrols frequent", "Occasional police", "Rare police presence"],
    }

    return {
      id: `factor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      location: [lat, lon],
      level,
      description: descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
      timestamp: new Date(),
      duration: Math.floor(Math.random() * 30) + 10,
    }
  }

  const addManualFactor = (type: SimulatedSafetyFactor["type"]) => {
    const factor = {
      ...generateRandomFactor(),
      type,
      level: "high" as const,
    }
    setFactors((prev) => {
      const updated = [...prev, factor]
      onFactorsChange(updated)
      return updated
    })
  }

  const clearAllFactors = () => {
    setFactors([])
    onFactorsChange([])
  }

  if (!active) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Safety Simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Enable safety mode to simulate real-time safety factors for routes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-green-600" />
          Active Safety Factors ({factors.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isSimulating && (
          <Alert>
            <Zap className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Simulating real-time safety factors. Safer routes will be suggested automatically.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {factors.map((factor) => {
            const FactorIcon = SAFETY_FACTORS[factor.type].icon
            return (
              <div key={factor.id} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                <FactorIcon className={`w-3 h-3 ${SAFETY_FACTORS[factor.type].color}`} />
                <div className="flex-1">
                  <div className="font-medium">{factor.description}</div>
                  <div className="text-muted-foreground">
                    {Math.round((factor.timestamp.getTime() + factor.duration * 60000 - Date.now()) / 60000)} min remaining
                  </div>
                </div>
                <Badge
                  variant={
                    factor.level === "high" ? "default" : factor.level === "medium" ? "secondary" : "outline"
                  }
                  className="text-xs"
                >
                  {factor.level}
                </Badge>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-1">
          {Object.entries(SAFETY_FACTORS).map(([type, config]) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => addManualFactor(type as SimulatedSafetyFactor["type"])}
              className="text-xs h-8"
            >
              <config.icon className={`w-3 h-3 mr-1 ${config.color}`} />
              {config.label}
            </Button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={clearAllFactors} className="w-full text-xs bg-transparent">
          Clear All Factors
        </Button>
      </CardContent>
    </Card>
  )
}
