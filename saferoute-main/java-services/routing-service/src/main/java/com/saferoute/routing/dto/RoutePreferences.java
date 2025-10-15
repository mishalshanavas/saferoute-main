package com.saferoute.routing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class RoutePreferences {
    
    @Min(0)
    @Max(100)
    @JsonProperty("safetyPriority")
    private Integer safetyPriority = 50;
    
    @JsonProperty("avoidTolls")
    private Boolean avoidTolls = false;
    
    @JsonProperty("avoidHighways")
    private Boolean avoidHighways = false;
    
    @Min(0)
    @Max(100)
    @JsonProperty("maxDetour")
    private Integer maxDetour = 20; // percentage
    
    @JsonProperty("avoidTraffic")
    private Boolean avoidTraffic = true;
    
    @JsonProperty("preferSaferStreets")
    private Boolean preferSaferStreets = true;
    
    @JsonProperty("timeOfDay")
    private String timeOfDay; // "morning", "afternoon", "evening", "night"
    
    // Constructors
    public RoutePreferences() {}
    
    public RoutePreferences(Integer safetyPriority, Boolean avoidTolls, Boolean avoidHighways, Integer maxDetour) {
        this.safetyPriority = safetyPriority;
        this.avoidTolls = avoidTolls;
        this.avoidHighways = avoidHighways;
        this.maxDetour = maxDetour;
    }
    
    // Getters and Setters
    public Integer getSafetyPriority() { return safetyPriority; }
    public void setSafetyPriority(Integer safetyPriority) { this.safetyPriority = safetyPriority; }
    
    public Boolean getAvoidTolls() { return avoidTolls; }
    public void setAvoidTolls(Boolean avoidTolls) { this.avoidTolls = avoidTolls; }
    
    public Boolean getAvoidHighways() { return avoidHighways; }
    public void setAvoidHighways(Boolean avoidHighways) { this.avoidHighways = avoidHighways; }
    
    public Integer getMaxDetour() { return maxDetour; }
    public void setMaxDetour(Integer maxDetour) { this.maxDetour = maxDetour; }
    
    public Boolean getAvoidTraffic() { return avoidTraffic; }
    public void setAvoidTraffic(Boolean avoidTraffic) { this.avoidTraffic = avoidTraffic; }
    
    public Boolean getPreferSaferStreets() { return preferSaferStreets; }
    public void setPreferSaferStreets(Boolean preferSaferStreets) { this.preferSaferStreets = preferSaferStreets; }
    
    public String getTimeOfDay() { return timeOfDay; }
    public void setTimeOfDay(String timeOfDay) { this.timeOfDay = timeOfDay; }
    
    // Utility methods
    public boolean isHighSafety() {
        return safetyPriority != null && safetyPriority >= 70;
    }
    
    public boolean isMediumSafety() {
        return safetyPriority != null && safetyPriority >= 40 && safetyPriority < 70;
    }
    
    public boolean isLowSafety() {
        return safetyPriority != null && safetyPriority < 40;
    }
    
    @Override
    public String toString() {
        return String.format("RoutePreferences{safetyPriority=%d, avoidTolls=%s, avoidHighways=%s, maxDetour=%d}", 
                           safetyPriority, avoidTolls, avoidHighways, maxDetour);
    }
}