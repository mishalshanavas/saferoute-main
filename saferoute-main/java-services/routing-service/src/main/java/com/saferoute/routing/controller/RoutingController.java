package com.saferoute.routing.controller;

import com.saferoute.routing.dto.RouteRequest;
import com.saferoute.routing.dto.RouteResponse;
import com.saferoute.routing.dto.SafetyAnalysisRequest;
import com.saferoute.routing.dto.SafetyAnalysisResponse;
import com.saferoute.routing.service.AdvancedRoutingService;
import com.saferoute.routing.service.SafetyAnalysisService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RoutingController {
    
    private static final Logger logger = LoggerFactory.getLogger(RoutingController.class);
    
    @Autowired
    private AdvancedRoutingService routingService;
    
    @Autowired
    private SafetyAnalysisService safetyAnalysisService;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Routing Service is running");
    }

    @PostMapping("/safe")
    public ResponseEntity<RouteResponse> calculateSafeRoute(@Valid @RequestBody RouteRequest request) {
        try {
            logger.info("Calculating safe route from {} to {}", request.getOrigin(), request.getDestination());
            
            RouteResponse response = routingService.calculateSafeRoute(request);
            
            logger.info("Safe route calculated successfully. Distance: {}m, Duration: {}s, Safety Score: {}", 
                       response.getRoute().getDistance(), 
                       response.getRoute().getDuration(),
                       response.getRoute().getSafetyScore());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error calculating safe route", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/fastest")
    public ResponseEntity<RouteResponse> calculateFastestRoute(@Valid @RequestBody RouteRequest request) {
        try {
            logger.info("Calculating fastest route from {} to {}", request.getOrigin(), request.getDestination());
            
            RouteResponse response = routingService.calculateFastestRoute(request);
            
            logger.info("Fastest route calculated successfully. Distance: {}m, Duration: {}s", 
                       response.getRoute().getDistance(), 
                       response.getRoute().getDuration());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error calculating fastest route", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/analyze-safety")
    public ResponseEntity<SafetyAnalysisResponse> analyzeSafety(@Valid @RequestBody SafetyAnalysisRequest request) {
        try {
            logger.info("Analyzing safety for route with {} coordinates", request.getCoordinates().size());
            
            SafetyAnalysisResponse response = safetyAnalysisService.analyzeSafety(request);
            
            logger.info("Safety analysis completed. Overall score: {}, Risk zones: {}", 
                       response.getOverallScore(), 
                       response.getRiskZones().size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error analyzing route safety", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/optimize")
    public ResponseEntity<RouteResponse> optimizeRoute(@Valid @RequestBody RouteRequest request) {
        try {
            logger.info("Optimizing route from {} to {}", request.getOrigin(), request.getDestination());
            
            RouteResponse response = routingService.optimizeRoute(request);
            
            logger.info("Route optimized successfully. Safety Score: {}", 
                       response.getRoute().getSafetyScore());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error optimizing route", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}