const express = require('express');
const { body, query, validationResult } = require('express-validator');
const axios = require('axios');
const Route = require('../models/Route');
const UnsafeZone = require('../models/UnsafeZone');
const Hazard = require('../models/Hazard');
const auth = require('../middleware/auth');
const { calculateSafeRoute, calculateRouteScore } = require('../services/routingService');

const router = express.Router();

// @route   POST /api/routes/calculate
// @desc    Calculate fastest and safest routes
// @access  Private
router.post('/calculate', [
  auth,
  body('origin.address', 'Origin address is required').not().isEmpty(),
  body('origin.coordinates.lat', 'Origin latitude is required').isFloat(),
  body('origin.coordinates.lng', 'Origin longitude is required').isFloat(),
  body('destination.address', 'Destination address is required').not().isEmpty(),
  body('destination.coordinates.lat', 'Destination latitude is required').isFloat(),
  body('destination.coordinates.lng', 'Destination longitude is required').isFloat(),
  body('routeType').isIn(['fastest', 'safest', 'balanced']).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { origin, destination, preferences = {}, routeType = 'fastest' } = req.body;
    const startTime = Date.now();

    // Get fastest route from OSRM
    const fastestRoute = await getFastestRouteFromOSRM(origin.coordinates, destination.coordinates);
    
    let safestRoute = null;
    let routes = { fastest: fastestRoute };

    if (routeType === 'safest' || routeType === 'balanced') {
      // Call Java service for safe route calculation
      safestRoute = await calculateSafeRouteViaJava(origin.coordinates, destination.coordinates, preferences);
      routes.safest = safestRoute;
    }

    // Calculate safety scores for all routes
    const unsafeZones = await UnsafeZone.findActiveZones(origin.coordinates, 50);
    const activeHazards = await Hazard.findActiveInArea(origin.coordinates, 20);

    if (routes.fastest) {
      routes.fastest.safetyScore = await calculateRouteScore(routes.fastest.coordinates, unsafeZones, activeHazards);
    }

    if (routes.safest) {
      routes.safest.safetyScore = await calculateRouteScore(routes.safest.coordinates, unsafeZones, activeHazards);
    }

    // Save route to database
    const savedRoute = new Route({
      userId: req.user.id,
      origin,
      destination,
      routeType,
      routeData: routes[routeType] || routes.fastest,
      preferences,
      calculationMetrics: {
        calculationTime: Date.now() - startTime,
        javaServiceUsed: !!safestRoute,
        algorithmUsed: routeType === 'safest' ? 'safe_pathfinding' : 'dijkstra',
        apiCalls: {
          osrm: 1,
          geocoding: 0,
          java: safestRoute ? 1 : 0
        }
      }
    });

    await savedRoute.save();

    res.json({
      success: true,
      routes,
      routeId: savedRoute._id,
      calculationTime: Date.now() - startTime,
      unsafeZonesCount: unsafeZones.length,
      activeHazardsCount: activeHazards.length
    });

  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ 
      message: 'Error calculating route', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// @route   GET /api/routes/history
// @desc    Get user's route history
// @access  Private
router.get('/history', [
  auth,
  query('page', 'Page must be a number').isInt({ min: 1 }).optional(),
  query('limit', 'Limit must be a number').isInt({ min: 1, max: 100 }).optional(),
  query('routeType').isIn(['fastest', 'safest', 'balanced']).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    if (req.query.routeType) {
      query.routeType = req.query.routeType;
    }

    const routes = await Route.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-routeData.coordinates'); // Exclude heavy coordinate data

    const total = await Route.countDocuments(query);

    res.json({
      success: true,
      routes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Route history error:', error);
    res.status(500).json({ message: 'Error fetching route history' });
  }
});

// @route   GET /api/routes/saved
// @desc    Get user's saved routes
// @access  Private
router.get('/saved', auth, async (req, res) => {
  try {
    const savedRoutes = await Route.find({ 
      userId: req.user.id, 
      isSaved: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      routes: savedRoutes
    });

  } catch (error) {
    console.error('Saved routes error:', error);
    res.status(500).json({ message: 'Error fetching saved routes' });
  }
});

// @route   PUT /api/routes/:id/save
// @desc    Save/unsave a route
// @access  Private
router.put('/:id/save', auth, async (req, res) => {
  try {
    const route = await Route.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    route.isSaved = !route.isSaved;
    
    if (req.body.name && route.isSaved) {
      route.name = req.body.name;
    }

    await route.save();

    res.json({
      success: true,
      route: {
        id: route._id,
        isSaved: route.isSaved,
        name: route.name
      }
    });

  } catch (error) {
    console.error('Save route error:', error);
    res.status(500).json({ message: 'Error saving route' });
  }
});

// @route   GET /api/routes/popular
// @desc    Get popular routes in area
// @access  Public
router.get('/popular', [
  query('lat', 'Latitude is required').isFloat(),
  query('lng', 'Longitude is required').isFloat(),
  query('radius', 'Radius must be a number').isFloat({ min: 1, max: 50 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng, radius = 10 } = req.query;
    const coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };

    const popularRoutes = await Route.getPopularRoutes(10);
    const nearbyRoutes = await Route.findByArea(coordinates, radius);

    res.json({
      success: true,
      popularRoutes,
      nearbyRoutes: nearbyRoutes.slice(0, 5) // Limit to 5 nearby routes
    });

  } catch (error) {
    console.error('Popular routes error:', error);
    res.status(500).json({ message: 'Error fetching popular routes' });
  }
});

// Helper function to get fastest route from OSRM
async function getFastestRouteFromOSRM(origin, destination) {
  try {
    const osrmUrl = `${process.env.OSRM_BASE_URL || 'http://router.project-osrm.org'}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    
    const response = await axios.get(osrmUrl);
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        coordinates: route.geometry.coordinates,
        distance: Math.round(route.distance), // meters
        duration: Math.round(route.duration), // seconds
        safetyScore: 0 // Will be calculated later
      };
    }
    
    throw new Error('No route found');
  } catch (error) {
    console.error('OSRM API error:', error);
    throw new Error('Failed to get route from OSRM');
  }
}

// Helper function to call Java service for safe route
async function calculateSafeRouteViaJava(origin, destination, preferences) {
  try {
    const javaServiceUrl = process.env.JAVA_ROUTING_SERVICE_URL || 'http://localhost:8080';
    
    const response = await axios.post(`${javaServiceUrl}/api/routes/safe`, {
      origin,
      destination,
      preferences
    }, {
      timeout: 10000 // 10 second timeout
    });

    return response.data.route;
  } catch (error) {
    console.error('Java service error:', error);
    // Fallback to Node.js implementation
    return await calculateSafeRoute(origin, destination, preferences);
  }
}

module.exports = router;