package com.saferoute.routing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class RouteRequest {
    
    @NotNull
    @Valid
    private Coordinate origin;
    
    @NotNull
    @Valid
    private Coordinate destination;
    
    private RoutePreferences preferences;
    
    // Constructors
    public RouteRequest() {}
    
    public RouteRequest(Coordinate origin, Coordinate destination) {
        this.origin = origin;
        this.destination = destination;
        this.preferences = new RoutePreferences();
    }
    
    // Getters and Setters
    public Coordinate getOrigin() { return origin; }
    public void setOrigin(Coordinate origin) { this.origin = origin; }
    
    public Coordinate getDestination() { return destination; }
    public void setDestination(Coordinate destination) { this.destination = destination; }
    
    public RoutePreferences getPreferences() { 
        return preferences != null ? preferences : new RoutePreferences(); 
    }
    public void setPreferences(RoutePreferences preferences) { this.preferences = preferences; }
    
    @Override
    public String toString() {
        return String.format("RouteRequest{origin=%s, destination=%s, preferences=%s}", 
                           origin, destination, preferences);
    }
}