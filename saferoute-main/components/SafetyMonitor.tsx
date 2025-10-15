"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Phone, AlertCircle, CheckCircle } from "lucide-react"
import type { Route } from "@/utils/routing"

interface SafetyMonitorProps {
  currentRoute?: Route
  factors: SimulatedSafetyFactor[]
  routeType: "fastest" | "safest"
}

interface SafetyAlert {
  id: string
  type: "warning" | "danger" | "info"
  message: string
  timestamp: Date
  acknowledged: boolean
}

export default function SafetyMonitor({ currentRoute, factors, routeType }: SafetyMonitorProps) {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([])
  const [emergencyContacts] = useState([
    { name: "Emergency Services", number: "911" },
    { name: "Roadside Assistance", number: "1-800-AAA-HELP" },
  ])

  useEffect(() => {
    if (!currentRoute) return

    const newAlerts: SafetyAlert[] = []

    // Check safety score
    if (currentRoute.safetyScore < 50) {
      newAlerts.push({
        id: `safety-${Date.now()}`,
        type: "danger",
        message: `Low safety score (${currentRoute.safetyScore}/100). Consider using the safest route.`,
        timestamp: new Date(),
        acknowledged: false,
      })
    } else if (currentRoute.safetyScore < 70) {
      newAlerts.push({
        id: `safety-${Date.now()}`,
        type: "warning",
        message: `Moderate safety concerns detected. Stay alert during your journey.`,
        timestamp: new Date(),
        acknowledged: false,
      })
    }

    // Check for safety factors
    if (factors.length > 0) {
      newAlerts.push({
        id: `factors-${Date.now()}`,
        type: "info",
        message: `${factors.length} safety factor(s) detected on your route.`,
        timestamp: new Date(),
        acknowledged: false,
      })
    }

    // Route type recommendations
    if (routeType === "fastest" && currentRoute.safetyScore < 60) {
      newAlerts.push({
        id: `recommendation-${Date.now()}`,
        type: "info",
        message: "Consider switching to the safest route for better safety.",
        timestamp: new Date(),
        acknowledged: false,
      })
    }

    setAlerts((prev) => {
      // Remove old alerts and add new ones
      const filtered = prev.filter((alert) => {
        const age = Date.now() - alert.timestamp.getTime()
        return age < 300000 // Keep alerts for 5 minutes
      })
      return [...filtered, ...newAlerts]
    })
  }, [currentRoute, factors, routeType])

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
  }

  const callEmergency = (number: string) => {
    window.open(`tel:${number}`, "_self")
  }

  const getOverallSafetyStatus = () => {
    if (!currentRoute) return { status: "unknown", color: "text-gray-500", icon: AlertCircle }

    if (currentRoute.safetyScore >= 80) {
      return { status: "safe", color: "text-green-500", icon: CheckCircle }
    } else if (currentRoute.safetyScore >= 60) {
      return { status: "moderate", color: "text-yellow-500", icon: AlertCircle }
    } else {
      return { status: "unsafe", color: "text-red-500", icon: AlertCircle }
    }
  }

  const safetyStatus = getOverallSafetyStatus()
  const StatusIcon = safetyStatus.icon
  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Safety Monitor
          <StatusIcon className={`w-4 h-4 ${safetyStatus.color}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Overall Status:</span>
          <Badge
            variant={
              safetyStatus.status === "safe"
                ? "default"
                : safetyStatus.status === "moderate"
                  ? "secondary"
                  : "destructive"
            }
            className="capitalize"
          >
            {safetyStatus.status}
          </Badge>
        </div>

        {unacknowledgedAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Active Alerts ({unacknowledgedAlerts.length})</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {unacknowledgedAlerts.map((alert) => (
                <Alert
                  key={alert.id}
                  variant={alert.type === "danger" ? "destructive" : alert.type === "warning" ? "default" : "default"}
                  className="p-2"
                >
                  <AlertDescription className="text-xs flex items-center justify-between">
                    <span>{alert.message}</span>
                    <Button variant="ghost" size="sm" onClick={() => acknowledgeAlert(alert.id)} className="h-6 px-2">
                      ✓
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium">Emergency Contacts</div>
          <div className="space-y-1">
            {emergencyContacts.map((contact) => (
              <Button
                key={contact.number}
                variant="outline"
                size="sm"
                onClick={() => callEmergency(contact.number)}
                className="w-full justify-between text-xs h-8"
              >
                <span>{contact.name}</span>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{contact.number}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {currentRoute && (
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Route Safety Tips:</div>
            <ul className="list-disc list-inside space-y-1">
              {currentRoute.safetyScore < 70 && <li>Stay alert and drive defensively</li>}
              {factors.length > 0 && <li>Be aware of local safety factors (e.g., lighting, crime rate, etc.)</li>}
              {routeType === "fastest" && <li>Consider the safest route for better safety</li>}
              <li>Keep emergency contacts handy</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
