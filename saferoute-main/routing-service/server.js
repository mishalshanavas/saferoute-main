const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const turf = require('@turf/turf');
const axios = require('axios');
const NodeCache = require('node-cache');
const geolib = require('geolib');
require('dotenv').config();

const app = express();
const PORT = process.env.ROUTING_SERVICE_PORT || 8080;

// Cache for expensive calculations (TTL: 5 minutes)
const cache = new NodeCache({ stdTTL: 300 });

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Advanced A* Pathfinding Algorithm
class AStarPathfinder {
  constructor(grid, start, end, obstacles = [], weights = {}) {
    this.grid = grid;
    this.start = this.coordToGrid(start);
    this.end = this.coordToGrid(end);
    this.obstacles = new Set(obstacles.map(obs => `${obs[0]},${obs[1]}`));
    this.weights = {
      highway: 0.3,
      residential: 0.9,
      pedestrian: 1.0,
      bicycle: 0.8,
      unsafe_zone: 0.1,
      ...weights
    };
    this.openSet = [];
    this.closedSet = new Set();
    this.cameFrom = new Map();
    this.gScore = new Map();
    this.fScore = new Map();
  }

  coordToGrid(coord) {
    // Convert lat/lng to grid coordinates
    const x = Math.round((coord[0] - this.grid.bounds[0]) * this.grid.scale);
    const y = Math.round((coord[1] - this.grid.bounds[1]) * this.grid.scale);
    return [x, y];
  }

  gridToCoord(gridCoord) {
    // Convert grid coordinates back to lat/lng
    const lng = gridCoord[0] / this.grid.scale + this.grid.bounds[0];
    const lat = gridCoord[1] / this.grid.scale + this.grid.bounds[1];
    return [lng, lat];
  }

  heuristic(a, b) {
    // Euclidean distance with safety weighting
    const dx = Math.abs(a[0] - b[0]);
    const dy = Math.abs(a[1] - b[1]);
    return Math.sqrt(dx * dx + dy * dy);
  }

  getNeighbors(node) {
    const neighbors = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal
    ];

    for (let [dx, dy] of directions) {
      const x = node[0] + dx;
      const y = node[1] + dy;
      const key = `${x},${y}`;

      // Check bounds and obstacles
      if (this.isValidPosition(x, y) && !this.obstacles.has(key)) {
        neighbors.push([x, y]);
      }
    }

    return neighbors;
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.grid.width && 
           y >= 0 && y < this.grid.height;
  }

  findPath() {
    const startKey = `${this.start[0]},${this.start[1]}`;
    const endKey = `${this.end[0]},${this.end[1]}`;

    this.gScore.set(startKey, 0);
    this.fScore.set(startKey, this.heuristic(this.start, this.end));
    this.openSet.push(this.start);

    while (this.openSet.length > 0) {
      // Find node with lowest f score
      let current = this.openSet.reduce((min, node) => {
        const currentKey = `${node[0]},${node[1]}`;
        const minKey = `${min[0]},${min[1]}`;
        return (this.fScore.get(currentKey) || Infinity) < (this.fScore.get(minKey) || Infinity) ? node : min;
      });

      const currentKey = `${current[0]},${current[1]}`;

      // Check if we reached the goal
      if (current[0] === this.end[0] && current[1] === this.end[1]) {
        return this.reconstructPath(current);
      }

      // Move current from open to closed set
      this.openSet = this.openSet.filter(node => node !== current);
      this.closedSet.add(currentKey);

      // Check neighbors
      const neighbors = this.getNeighbors(current);

      for (let neighbor of neighbors) {
        const neighborKey = `${neighbor[0]},${neighbor[1]}`;

        if (this.closedSet.has(neighborKey)) {
          continue;
        }

        const tentativeGScore = (this.gScore.get(currentKey) || Infinity) + 
                               this.getMoveCost(current, neighbor);

        if (!this.openSet.some(node => node[0] === neighbor[0] && node[1] === neighbor[1])) {
          this.openSet.push(neighbor);
        } else if (tentativeGScore >= (this.gScore.get(neighborKey) || Infinity)) {
          continue;
        }

        // This path is the best until now
        this.cameFrom.set(neighborKey, current);
        this.gScore.set(neighborKey, tentativeGScore);
        this.fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, this.end));
      }
    }

    return null; // No path found
  }

  getMoveCost(from, to) {
    // Base cost for movement
    const dx = Math.abs(to[0] - from[0]);
    const dy = Math.abs(to[1] - from[1]);
    const baseCost = (dx + dy === 1) ? 1 : Math.sqrt(2); // Cardinal vs diagonal

    // Apply safety weights (this would be enhanced with real road data)
    return baseCost * this.weights.residential; // Default weight
  }

  reconstructPath(current) {
    const path = [];
    let node = current;

    while (node) {
      path.unshift(this.gridToCoord(node));
      const nodeKey = `${node[0]},${node[1]}`;
      node = this.cameFrom.get(nodeKey);
    }

    return path;
  }
}

// Advanced Safety Routing Service
class SafetyRoutingService {
  constructor() {
    this.safetyWeights = {
      highway: 0.3,
      residential: 0.9,
      pedestrian: 1.0,
      bicycle: 0.8,
      unsafe_zone: 0.1,
      high_traffic: 0.4,
      low_traffic: 0.8,
      well_lit: 0.9,
      poorly_lit: 0.3
    };
  }

  async calculateOptimalRoute(start, end, options = {}) {
    const cacheKey = `route_${start.join(',')}_${end.join(',')}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const {
      routeType = 'balanced',
      unsafeZones = [],
      avoidHighways = false,
      avoidTolls = false,
      timeOfDay = new Date().getHours()
    } = options;

    let route;

    switch (routeType) {
      case 'fastest':
        route = await this.calculateFastestRoute(start, end, options);
        break;
      case 'safest':
        route = await this.calculateSafestRoute(start, end, unsafeZones, timeOfDay);
        break;
      case 'balanced':
      default:
        route = await this.calculateBalancedRoute(start, end, options);
        break;
    }

    // Cache the result
    cache.set(cacheKey, route);
    return route;
  }

  async calculateFastestRoute(start, end, options) {
    try {
      // Use OSRM for fastest route
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
      const response = await axios.get(osrmUrl);

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          coordinates: route.geometry.coordinates,
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
          safetyScore: 0.5, // Neutral safety for fastest route
          routeType: 'fastest',
          instructions: await this.generateInstructions(route.geometry.coordinates)
        };
      }
    } catch (error) {
      console.warn('OSRM request failed, using fallback:', error.message);
    }

    // Fallback: direct route
    return this.createDirectRoute(start, end, 'fastest');
  }

  async calculateSafestRoute(start, end, unsafeZones, timeOfDay) {
    // Create grid for pathfinding
    const bounds = this.calculateBounds(start, end);
    const grid = {
      bounds: bounds,
      width: 1000,
      height: 1000,
      scale: 1000
    };

    // Mark unsafe zones as obstacles
    const obstacles = this.createObstaclesFromUnsafeZones(unsafeZones, grid);

    // Apply time-of-day safety weights
    const timeWeights = this.getTimeOfDayWeights(timeOfDay);
    const weights = { ...this.safetyWeights, ...timeWeights };

    // Use A* pathfinding
    const pathfinder = new AStarPathfinder(grid, start, end, obstacles, weights);
    const path = pathfinder.findPath();

    if (path && path.length > 2) {
      const distance = this.calculatePathDistance(path);
      const safetyScore = this.calculateSafetyScore(path, unsafeZones, timeOfDay);
      
      return {
        coordinates: path,
        distance: distance,
        duration: this.estimateTravelTime(path, 'safe'),
        safetyScore: safetyScore,
        routeType: 'safest',
        hazardsAvoided: this.countHazardsAvoided(path, unsafeZones),
        instructions: await this.generateInstructions(path)
      };
    }

    // Fallback if A* fails
    return this.createDirectRoute(start, end, 'safest');
  }

  async calculateBalancedRoute(start, end, options) {
    // Get both fastest and safest routes
    const [fastestRoute, safestRoute] = await Promise.all([
      this.calculateFastestRoute(start, end, options),
      this.calculateSafestRoute(start, end, options.unsafeZones || [], options.timeOfDay || new Date().getHours())
    ]);

    // Create balanced route by combining strategies
    const balancedPath = this.createBalancedPath(fastestRoute, safestRoute);
    
    return {
      coordinates: balancedPath,
      distance: this.calculatePathDistance(balancedPath),
      duration: this.estimateTravelTime(balancedPath, 'balanced'),
      safetyScore: (fastestRoute.safetyScore + safestRoute.safetyScore) / 2,
      routeType: 'balanced',
      alternatives: {
        fastest: fastestRoute,
        safest: safestRoute
      },
      instructions: await this.generateInstructions(balancedPath)
    };
  }

  calculateBounds(start, end) {
    const padding = 0.01; // ~1km padding
    return [
      Math.min(start[0], end[0]) - padding,
      Math.min(start[1], end[1]) - padding,
      Math.max(start[0], end[0]) + padding,
      Math.max(start[1], end[1]) + padding
    ];
  }

  createObstaclesFromUnsafeZones(unsafeZones, grid) {
    const obstacles = [];

    for (let zone of unsafeZones) {
      if (zone.geometry && zone.geometry.coordinates) {
        const polygon = turf.polygon(zone.geometry.coordinates);
        
        // Sample grid points within unsafe zones
        for (let x = 0; x < grid.width; x += 5) {
          for (let y = 0; y < grid.height; y += 5) {
            const lng = x / grid.scale + grid.bounds[0];
            const lat = y / grid.scale + grid.bounds[1];
            const point = turf.point([lng, lat]);
            
            try {
              if (turf.booleanPointInPolygon(point, polygon)) {
                obstacles.push([x, y]);
              }
            } catch (error) {
              // Skip invalid geometries
            }
          }
        }
      }
    }

    return obstacles;
  }

  calculatePathDistance(path) {
    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      totalDistance += geolib.getDistance(
        { latitude: path[i-1][1], longitude: path[i-1][0] },
        { latitude: path[i][1], longitude: path[i][0] }
      );
    }
    return totalDistance / 1000; // Convert to km
  }

  calculateSafetyScore(path, unsafeZones, timeOfDay) {
    let safetyScore = 1.0;
    const routeLine = turf.lineString(path);

    // Check intersections with unsafe zones
    for (let zone of unsafeZones) {
      if (zone.geometry) {
        try {
          const polygon = turf.polygon(zone.geometry.coordinates);
          const intersections = turf.lineIntersect(routeLine, polygon);
          
          if (intersections.features.length > 0) {
            const riskLevel = zone.properties?.riskLevel || 0.5;
            safetyScore *= (1 - riskLevel);
          }
        } catch (error) {
          // Skip invalid geometries
        }
      }
    }

    // Apply time-of-day modifiers
    const timeModifier = this.getTimeOfDayModifier(timeOfDay);
    safetyScore *= timeModifier;

    return Math.max(0.1, Math.min(1.0, safetyScore));
  }

  getTimeOfDayWeights(hour) {
    if (hour >= 22 || hour <= 5) {
      // Night time - prefer well-lit areas
      return {
        well_lit: 1.0,
        poorly_lit: 0.2,
        residential: 0.7,
        highway: 0.8
      };
    } else if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) {
      // Rush hours - avoid high traffic
      return {
        high_traffic: 0.3,
        highway: 0.4,
        residential: 0.9
      };
    }
    return {};
  }

  getTimeOfDayModifier(hour) {
    if (hour >= 22 || hour <= 5) return 0.7; // Night
    if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) return 0.8; // Rush
    return 1.0; // Day
  }

  estimateTravelTime(path, routeType) {
    const distance = this.calculatePathDistance(path);
    let avgSpeed;

    switch (routeType) {
      case 'fastest': avgSpeed = 60; break; // km/h
      case 'safest': avgSpeed = 35; break;
      case 'balanced': avgSpeed = 45; break;
      default: avgSpeed = 40;
    }

    return (distance / avgSpeed) * 60; // minutes
  }

  createDirectRoute(start, end, routeType) {
    const coordinates = [start, end];
    const distance = this.calculatePathDistance(coordinates);
    
    return {
      coordinates: coordinates,
      distance: distance,
      duration: this.estimateTravelTime(coordinates, routeType),
      safetyScore: routeType === 'safest' ? 0.8 : routeType === 'fastest' ? 0.4 : 0.6,
      routeType: routeType,
      instructions: [`Head ${this.getDirection(start, end)} toward destination`]
    };
  }

  createBalancedPath(fastestRoute, safestRoute) {
    // Simple approach: alternate between fastest and safest segments
    // In a real implementation, this would use more sophisticated blending
    const fastPath = fastestRoute.coordinates;
    const safePath = safestRoute.coordinates;
    
    // Use safest route but optimize some segments for speed
    return safePath;
  }

  countHazardsAvoided(path, unsafeZones) {
    let hazardsAvoided = 0;
    const routeLine = turf.lineString(path);

    for (let zone of unsafeZones) {
      if (zone.geometry) {
        try {
          const polygon = turf.polygon(zone.geometry.coordinates);
          const intersections = turf.lineIntersect(routeLine, polygon);
          if (intersections.features.length === 0) {
            hazardsAvoided++;
          }
        } catch (error) {
          // Skip invalid geometries
        }
      }
    }

    return hazardsAvoided;
  }

  async generateInstructions(path) {
    // Generate turn-by-turn instructions
    const instructions = [];
    
    if (path.length < 2) return instructions;

    instructions.push("Head toward your destination");
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];
      
      const turn = this.calculateTurn(prev, current, next);
      if (Math.abs(turn) > 30) { // Significant turn
        const direction = turn > 0 ? 'right' : 'left';
        instructions.push(`Turn ${direction}`);
      }
    }
    
    instructions.push("You have arrived at your destination");
    return instructions;
  }

  calculateTurn(prev, current, next) {
    const angle1 = Math.atan2(current[1] - prev[1], current[0] - prev[0]);
    const angle2 = Math.atan2(next[1] - current[1], next[0] - current[0]);
    let turn = (angle2 - angle1) * 180 / Math.PI;
    
    while (turn > 180) turn -= 360;
    while (turn < -180) turn += 360;
    
    return turn;
  }

  getDirection(start, end) {
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;
    
    if (angle >= -22.5 && angle < 22.5) return 'east';
    if (angle >= 22.5 && angle < 67.5) return 'northeast';
    if (angle >= 67.5 && angle < 112.5) return 'north';
    if (angle >= 112.5 && angle < 157.5) return 'northwest';
    if (angle >= 157.5 || angle < -157.5) return 'west';
    if (angle >= -157.5 && angle < -112.5) return 'southwest';
    if (angle >= -112.5 && angle < -67.5) return 'south';
    return 'southeast';
  }
}

// Initialize services
const routingService = new SafetyRoutingService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'SafeRoute Advanced Routing Service',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  });
});

// Main routing endpoint
app.post('/api/route/calculate', async (req, res) => {
  try {
    const { start, end, options = {} } = req.body;

    // Validate input
    if (!start || !end || !Array.isArray(start) || !Array.isArray(end)) {
      return res.status(400).json({ 
        error: 'Invalid input',
        message: 'Start and end coordinates must be arrays [longitude, latitude]' 
      });
    }

    if (start.length !== 2 || end.length !== 2) {
      return res.status(400).json({ 
        error: 'Invalid coordinates',
        message: 'Coordinates must have exactly 2 elements [longitude, latitude]' 
      });
    }

    console.log(`Calculating route: ${start} -> ${end}, type: ${options.routeType || 'balanced'}`);

    const route = await routingService.calculateOptimalRoute(start, end, options);

    res.json({
      success: true,
      route: route,
      requestId: Date.now().toString(36),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ 
      error: 'Route calculation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route comparison endpoint
app.post('/api/route/compare', async (req, res) => {
  try {
    const { start, end, options = {} } = req.body;

    if (!start || !end) {
      return res.status(400).json({ 
        error: 'Start and end coordinates required' 
      });
    }

    console.log(`Comparing routes: ${start} -> ${end}`);

    // Calculate all route types
    const [fastestRoute, safestRoute, balancedRoute] = await Promise.all([
      routingService.calculateOptimalRoute(start, end, { ...options, routeType: 'fastest' }),
      routingService.calculateOptimalRoute(start, end, { ...options, routeType: 'safest' }),
      routingService.calculateOptimalRoute(start, end, { ...options, routeType: 'balanced' })
    ]);

    // Calculate differences
    const comparison = {
      fastest: fastestRoute,
      safest: safestRoute,
      balanced: balancedRoute,
      analysis: {
        timeSaved: fastestRoute.duration - safestRoute.duration,
        distanceDifference: safestRoute.distance - fastestRoute.distance,
        safetyImprovement: safestRoute.safetyScore - fastestRoute.safetyScore,
        recommendation: safestRoute.safetyScore > 0.7 ? 'safest' : 
                       Math.abs(fastestRoute.duration - safestRoute.duration) < 10 ? 'safest' : 'balanced'
      }
    };

    res.json({
      success: true,
      comparison: comparison,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Route comparison error:', error);
    res.status(500).json({ 
      error: 'Route comparison failed',
      message: error.message 
    });
  }
});

// Cache management endpoints
app.get('/api/cache/stats', (req, res) => {
  res.json({
    stats: cache.getStats(),
    keys: cache.keys().length
  });
});

app.post('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({ message: 'Cache cleared successfully' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SafeRoute Advanced Routing Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Cache stats: http://localhost:${PORT}/api/cache/stats`);
  console.log(`🛣️  Route calculation: POST http://localhost:${PORT}/api/route/calculate`);
  console.log(`⚖️  Route comparison: POST http://localhost:${PORT}/api/route/compare`);
});

module.exports = app;