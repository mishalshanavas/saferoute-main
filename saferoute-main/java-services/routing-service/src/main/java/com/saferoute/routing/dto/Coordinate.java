package com.saferoute.routing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class Coordinate {
    
    @NotNull
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    @JsonProperty("lat")
    private Double latitude;
    
    @NotNull
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    @JsonProperty("lng")
    private Double longitude;
    
    // Constructors
    public Coordinate() {}
    
    public Coordinate(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    
    // Getters and Setters
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    // Convenience methods
    @JsonProperty("lat")
    public Double getLat() { return latitude; }
    @JsonProperty("lat")
    public void setLat(Double lat) { this.latitude = lat; }
    
    @JsonProperty("lng")
    public Double getLng() { return longitude; }
    @JsonProperty("lng")  
    public void setLng(Double lng) { this.longitude = lng; }
    
    @Override
    public String toString() {
        return String.format("Coordinate{lat=%.6f, lng=%.6f}", latitude, longitude);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        Coordinate that = (Coordinate) obj;
        return Double.compare(that.latitude, latitude) == 0 &&
               Double.compare(that.longitude, longitude) == 0;
    }
    
    @Override
    public int hashCode() {
        return java.util.Objects.hash(latitude, longitude);
    }
}