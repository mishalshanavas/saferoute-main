"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface RoutePreferencesProps {
  onPreferencesChange: (preferences: RoutePreferences) => void
}

export interface RoutePreferences {
  avoidTolls: boolean
  avoidHighways: boolean
  safetyPriority: number
  maxDetour: number
}

export default function RoutePreferences({ onPreferencesChange }: RoutePreferencesProps) {
  const [preferences, setPreferences] = useState<RoutePreferences>({
    avoidTolls: false,
    avoidHighways: false,
    safetyPriority: 50,
    maxDetour: 20,
  })

  const updatePreference = <K extends keyof RoutePreferences>(key: K, value: RoutePreferences[K]) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    onPreferencesChange(newPreferences)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Route Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="avoid-tolls" className="text-sm">
            Avoid Tolls
          </Label>
          <Switch
            id="avoid-tolls"
            checked={preferences.avoidTolls}
            onCheckedChange={(checked) => updatePreference("avoidTolls", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="avoid-highways" className="text-sm">
            Avoid Highways
          </Label>
          <Switch
            id="avoid-highways"
            checked={preferences.avoidHighways}
            onCheckedChange={(checked) => updatePreference("avoidHighways", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Safety Priority: {preferences.safetyPriority}%</Label>
          <Slider
            value={[preferences.safetyPriority]}
            onValueChange={([value]) => updatePreference("safetyPriority", value)}
            max={100}
            step={10}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Max Detour: {preferences.maxDetour}%</Label>
          <Slider
            value={[preferences.maxDetour]}
            onValueChange={([value]) => updatePreference("maxDetour", value)}
            max={50}
            step={5}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  )
}
