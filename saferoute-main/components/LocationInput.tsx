"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Clock, X } from "lucide-react"
import { geocodeAddress, type GeocodeResult } from "@/utils/geocoding"

interface LocationInputProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: string) => void
  placeholder: string
  type: "origin" | "destination"
  onCurrentLocation: () => void
}

interface LocationSuggestion {
  display_name: string
  lat: number
  lon: number
}

export default function LocationInput({ 
  value, 
  onChange, 
  onLocationSelect, 
  placeholder, 
  type, 
  onCurrentLocation 
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentLocations, setRecentLocations] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [justSelected, setJustSelected] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load recent locations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`recentLocations_${type}`)
    if (stored) {
      setRecentLocations(JSON.parse(stored))
    }
  }, [type])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  // Save to recent locations
  const saveToRecent = (location: string) => {
    if (!location.trim()) return
    
    const updated = [location, ...recentLocations.filter(l => l !== location)].slice(0, 5)
    setRecentLocations(updated)
    localStorage.setItem(`recentLocations_${type}`, JSON.stringify(updated))
  }

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setSelectedIndex(-1) // Reset selection when searching
      try {
        // Search for locations in Kerala, India first
        const keralaBias = value.includes('Kerala') || value.includes('Kochi') || value.includes('Trivandrum') 
          ? value 
          : `${value}, Kerala, India`
          
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keralaBias)}&limit=5&countrycodes=IN&addressdetails=1`
        )
        
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.map((item: any) => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          })))
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      }
      setIsLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value])

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    const locationName = suggestion.display_name.split(',')[0] // Get the first part
    onChange(locationName)
    saveToRecent(locationName)
    setShowSuggestions(false)
    setJustSelected(true)
    onLocationSelect?.(locationName)
    inputRef.current?.blur() // Remove focus from input
    
    // Reset the flag after a short delay
    setTimeout(() => setJustSelected(false), 300)
  }

  const handleRecentSelect = (recent: string) => {
    onChange(recent)
    setShowSuggestions(false)
    setJustSelected(true)
    onLocationSelect?.(recent)
    inputRef.current?.blur() // Remove focus from input
    
    // Reset the flag after a short delay
    setTimeout(() => setJustSelected(false), 300)
  }

  const clearInput = () => {
    onChange("")
    setShowSuggestions(false)
    setSelectedIndex(-1)
    setJustSelected(false)
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    const allOptions = [
      ...recentLocations.map(r => ({ type: 'recent', value: r })),
      ...(value.length < 3 ? popularLocations.map(p => ({ type: 'popular', value: p })) : []),
      ...suggestions.map(s => ({ type: 'suggestion', value: s }))
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allOptions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < allOptions.length) {
          const selected = allOptions[selectedIndex]
          if (selected.type === 'suggestion') {
            handleSuggestionSelect(selected.value as LocationSuggestion)
          } else {
            handleRecentSelect(selected.value as string)
          }
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Kerala popular locations for quick access
  const popularLocations = type === "origin" 
    ? ["Kochi Airport", "Ernakulam", "Marine Drive Kochi", "MG Road Kochi"]
    : ["Trivandrum Airport", "Munnar", "Alleppey", "Kozhikode", "Wayanad", "Thekkady"]

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            if (justSelected) {
              setJustSelected(false)
            }
          }}
          onFocus={() => {
            if (!justSelected) {
              setShowSuggestions(value.length >= 3 || recentLocations.length > 0)
            }
          }}
          onKeyDown={handleKeyDown}
          className="pr-20"
        />
        <div className="absolute right-1 top-1 flex gap-1">
          {value && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearInput}
              className="h-8 w-8 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCurrentLocation}
            className="h-8 w-8 p-0"
            title="Use current location"
          >
            <Navigation className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Recent locations */}
          {recentLocations.length > 0 && (
            <div className="p-2 border-b border-border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Recent
              </div>
              {recentLocations.map((recent, index) => {
                const isSelected = selectedIndex === index
                return (
                  <button
                    key={index}
                    onClick={() => handleRecentSelect(recent)}
                    className={`w-full text-left px-2 py-1 text-sm rounded flex items-center transition-colors ${
                      isSelected 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <MapPin className="w-3 h-3 mr-2 text-muted-foreground" />
                    {recent}
                  </button>
                )
              })}
            </div>
          )}

          {/* Popular locations */}
          {value.length < 3 && (
            <div className="p-2 border-b border-border">
              <div className="text-xs text-muted-foreground mb-1">Popular in Kerala</div>
              {popularLocations.map((location, index) => {
                const adjustedIndex = recentLocations.length + index
                const isSelected = selectedIndex === adjustedIndex
                return (
                  <button
                    key={index}
                    onClick={() => handleRecentSelect(location)}
                    className={`w-full text-left px-2 py-1 text-sm rounded flex items-center transition-colors ${
                      isSelected 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <MapPin className="w-3 h-3 mr-2 text-blue-500" />
                    {location}
                  </button>
                )
              })}
            </div>
          )}

          {/* Search suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-muted-foreground mb-1">Search Results</div>
              {suggestions.map((suggestion, index) => {
                const adjustedIndex = recentLocations.length + 
                  (value.length < 3 ? popularLocations.length : 0) + index
                const isSelected = selectedIndex === adjustedIndex
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                      isSelected 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <div className="flex items-start">
                      <MapPin className="w-3 h-3 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-medium">{suggestion.display_name.split(',')[0]}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.display_name.split(',').slice(1, 3).join(',')}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {value.length >= 3 && suggestions.length === 0 && !isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
