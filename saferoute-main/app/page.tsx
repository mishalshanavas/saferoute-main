"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Share2, Download, RotateCcw } from "lucide-react"
import { geocodeAddress } from "@/utils/geocoding"
import { getFastestRoute, getSafestRoute, formatDistance, formatDuration, type Route } from "@/utils/routing"
import LocationQuickSelect from "@/components/LocationQuickSelect"
import LocationInput from "@/components/LocationInput"
import RoutePreferences from "@/components/RoutePreferences"
import HazardSimulator, { type SimulatedSafetyFactor } from "@/components/HazardSimulator"
import SafetyMonitor from "@/components/SafetyMonitor"

const MapComponent = dynamic(() => import("@/components/SimpleMap"), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg" />,
})

interface RouteData {
  fastest?: Route
  safest?: Route
  origin?: [number, number]
  destination?: [number, number]
}

export default function SafeRoutingDemo() {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [routeType, setRouteType] = useState<"fastest" | "safest">("fastest")
  const [routes, setRoutes] = useState<RouteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [hazardMode, setHazardMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState({
    avoidTolls: false,
    avoidHighways: false,
    safetyPriority: 50,
    maxDetour: 20,
  })
  const [showPreferences, setShowPreferences] = useState(false)
  const [simulatedFactors, setSimulatedFactors] = useState<SimulatedSafetyFactor[]>([])

  // Debug: Track routes state changes
  useEffect(() => {
    console.log("[v0] Routes state changed:", routes)
  }, [routes])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "Enter":
            e.preventDefault()
            if (origin && destination && !loading) {
              handleRouteCalculation()
            }
            break
          case "r":
            e.preventDefault()
            handleReset()
            break
          case "1":
            e.preventDefault()
            if (routes) setRouteType("fastest")
            break
          case "2":
            e.preventDefault()
            if (routes) setRouteType("safest")
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [origin, destination, loading, routes])

  useEffect(() => {
    if (routes && simulatedFactors.length > 0) {
      // Trigger route recalculation when new safety factors are detected
      console.log("[v0] Safety factors detected, considering route recalculation")
      // In a real app, you might want to automatically recalculate routes here
    }
  }, [simulatedFactors, routes])

  const handleCurrentLocation = (type: "origin" | "destination") => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            )
            const data = await response.json()
            const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`

            if (type === "origin") {
              setOrigin(address)
            } else {
              setDestination(address)
            }
          } catch (error) {
            console.error("[v0] Reverse geocoding error:", error)
            const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            if (type === "origin") {
              setOrigin(coords)
            } else {
              setDestination(coords)
            }
          }
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
          setError("Could not get current location")
        },
      )
    } else {
      setError("Geolocation is not supported by this browser")
    }
  }

  const handleReset = () => {
    setOrigin("")
    setDestination("")
    setRoutes(null)
    setError(null)
    setRouteType("fastest")
    setHazardMode(false)
  setSimulatedFactors([])
  }

  const handleShare = async () => {
    if (!routes) return

    const shareData = {
      title: "Safe Routing Demo",
      text: `Route from ${origin} to ${destination}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("[v0] Share cancelled")
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`
      await navigator.clipboard.writeText(shareText)
      // You could show a toast notification here
    }
  }

  const handleExport = () => {
    if (!routes) return

    const exportData = {
      origin,
      destination,
      routes: {
        fastest: routes.fastest,
        safest: routes.safest,
      },
      preferences,
  factors: simulatedFactors,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `route-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRouteCalculation = async () => {
    if (!origin || !destination) return

    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting route calculation:", {
        origin,
        destination,
        preferences,
  factors: simulatedFactors.length,
      })

      // Geocode addresses
      const originCoords = await geocodeAddress(origin)
      const destCoords = await geocodeAddress(destination)

      if (!originCoords) {
        throw new Error("Could not find origin location")
      }

      if (!destCoords) {
        throw new Error("Could not find destination location")
      }

      console.log("[v0] Geocoded coordinates:", { originCoords, destCoords })

      // Calculate both routes
      const [fastestRoute, safestRoute] = await Promise.all([
        getFastestRoute(originCoords, destCoords),
        getSafestRoute(originCoords, destCoords),
      ])

      if (!fastestRoute) {
        throw new Error("Could not calculate fastest route")
      }

      console.log("[v0] Routes calculated successfully")
      console.log("[v0] Fastest route:", fastestRoute)
      console.log("[v0] Safest route:", safestRoute)

      const routeData = {
        fastest: fastestRoute,
        safest: safestRoute || fastestRoute,
        origin: [originCoords.lat, originCoords.lon] as [number, number],
        destination: [destCoords.lat, destCoords.lon] as [number, number],
      }
      
      console.log("[v0] Setting route data:", routeData)
      setRoutes(routeData)
    } catch (error) {
      console.error("[v0] Route calculation error:", error)
      setError(error instanceof Error ? error.message : "Failed to calculate routes")
    } finally {
      setLoading(false)
    }
  }

  console.log("[v0] Page render - current routes state:", routes)

  const currentRoute = routes?.[routeType]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Safe Routing Demo</h1>
              <p className="text-muted-foreground mt-2">
                Compare fastest vs safest routes with real-time hazard simulation
              </p>
            </div>
            <div className="flex gap-2">
              {routes && (
                <>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Route Planning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origin</label>
                  <LocationInput
                    placeholder="Enter starting location"
                    value={origin}
                    onChange={setOrigin}
                    onLocationSelect={setOrigin}
                    type="origin"
                    onCurrentLocation={() => handleCurrentLocation("origin")}
                  />
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                        Quick Select
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <LocationQuickSelect
                        type="origin"
                        onLocationSelect={setOrigin}
                        onCurrentLocation={() => handleCurrentLocation("origin")}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination</label>
                  <LocationInput
                    placeholder="Enter destination"
                    value={destination}
                    onChange={setDestination}
                    onLocationSelect={setDestination}
                    type="destination"
                    onCurrentLocation={() => handleCurrentLocation("destination")}
                  />
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                        Quick Select
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <LocationQuickSelect
                        type="destination"
                        onLocationSelect={setDestination}
                        onCurrentLocation={() => handleCurrentLocation("destination")}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                <Button
                  onClick={handleRouteCalculation}
                  disabled={loading || !origin || !destination}
                  className="w-full"
                >
                  {loading ? "Calculating..." : "Calculate Routes"}
                  <kbd className="ml-2 text-xs opacity-60">Ctrl+Enter</kbd>
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Collapsible open={showPreferences} onOpenChange={setShowPreferences}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-transparent">
                  Route Preferences
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <RoutePreferences onPreferencesChange={setPreferences} />
              </CollapsibleContent>
            </Collapsible>

            <Card>
              <CardHeader>
                <CardTitle>Route Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={routeType === "fastest" ? "default" : "outline"}
                    onClick={() => setRouteType("fastest")}
                    className="flex-1"
                    disabled={!routes}
                  >
                    Fastest
                    <kbd className="ml-1 text-xs opacity-60">1</kbd>
                  </Button>
                  <Button
                    variant={routeType === "safest" ? "default" : "outline"}
                    onClick={() => setRouteType("safest")}
                    className="flex-1"
                    disabled={!routes}
                  >
                    Safest
                    <kbd className="ml-1 text-xs opacity-60">2</kbd>
                  </Button>
                </div>
                <Button
                  variant={hazardMode ? "destructive" : "outline"}
                  onClick={() => setHazardMode(!hazardMode)}
                  className="w-full"
                >
                  {hazardMode ? "Disable" : "Simulate"} Hazards
                </Button>
              </CardContent>
            </Card>

            <HazardSimulator active={hazardMode} onFactorsChange={setSimulatedFactors} />

            <SafetyMonitor currentRoute={currentRoute} factors={simulatedFactors} routeType={routeType} />

            {currentRoute && (
              <Card>
                <CardHeader>
                  <CardTitle>Route Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <Badge variant="secondary">{formatDistance(currentRoute.distance)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <Badge variant="secondary">{formatDuration(currentRoute.duration)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety Score:</span>
                    <Badge
                      variant={
                        currentRoute.safetyScore > 80
                          ? "default"
                          : currentRoute.safetyScore > 60
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {currentRoute.safetyScore}/100
                    </Badge>
                  </div>
                  {currentRoute.avoidedZones > 0 && (
                    <div className="flex justify-between">
                      <span>Avoided Zones:</span>
                      <Badge variant="outline">{currentRoute.avoidedZones}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {routes && (
              <Card>
                <CardHeader>
                  <CardTitle>Route Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-blue-600">Fastest</div>
                      <div>{formatDistance(routes.fastest?.distance || 0)}</div>
                      <div>{formatDuration(routes.fastest?.duration || 0)}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">Safest</div>
                      <div>{formatDistance(routes.safest?.distance || 0)}</div>
                      <div>{formatDuration(routes.safest?.duration || 0)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <div className="h-96 lg:h-[600px] rounded-lg overflow-hidden">
                  <MapComponent 
                    key={routes ? `${routeType}-${routes.fastest?.coordinates?.length || 0}` : 'no-routes'}
                    routes={routes || undefined} 
                    routeType={routeType} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
