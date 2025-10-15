export interface GeocodeResult {
  lat: number
  lon: number
  display_name: string
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
    )

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.length === 0) {
      return null
    }

    return {
      lat: Number.parseFloat(data[0].lat),
      lon: Number.parseFloat(data[0].lon),
      display_name: data[0].display_name,
    }
  } catch (error) {
    console.error("[v0] Geocoding error:", error)
    return null
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`)
    }

    const data = await response.json()
    return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  } catch (error) {
    console.error("[v0] Reverse geocoding error:", error)
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }
}
