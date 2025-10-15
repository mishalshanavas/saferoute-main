const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Hazard = require('../models/Hazard');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/hazards/active
// @desc    Get active hazards in area
// @access  Public
router.get('/active', [
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

    const hazards = await Hazard.findActiveInArea(coordinates, radius);

    res.json({
      success: true,
      hazards,
      count: hazards.length
    });

  } catch (error) {
    console.error('Fetch active hazards error:', error);
    res.status(500).json({ message: 'Error fetching active hazards' });
  }
});

// @route   POST /api/hazards/report
// @desc    Report new hazard
// @access  Private
router.post('/report', [
  auth,
  body('type').isIn(['accident', 'construction', 'traffic_jam', 'road_closure', 'weather_incident', 'police_activity', 'event_congestion', 'vehicle_breakdown', 'debris', 'flooding', 'other']),
  body('severity').isIn(['minor', 'moderate', 'major', 'critical']).optional(),
  body('location.coordinates', 'Coordinates are required').isArray({ min: 2, max: 2 }),
  body('description', 'Description is required').isLength({ min: 10, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const hazard = new Hazard({
      ...req.body,
      reportedBy: {
        userId: req.user.id,
        source: 'user_report'
      }
    });

    await hazard.save();

    // Emit to connected clients in the area
    const io = req.app.get('io');
    if (io) {
      const areaRoom = `area-${Math.floor(hazard.location.coordinates[1])}-${Math.floor(hazard.location.coordinates[0])}`;
      io.to(areaRoom).emit('new-hazard', {
        id: hazard._id,
        type: hazard.type,
        severity: hazard.severity,
        location: hazard.location,
        description: hazard.description
      });
    }

    res.status(201).json({
      success: true,
      hazard
    });

  } catch (error) {
    console.error('Report hazard error:', error);
    res.status(500).json({ message: 'Error reporting hazard' });
  }
});

// @route   POST /api/hazards/:id/confirm
// @desc    Confirm hazard existence
// @access  Private
router.post('/:id/confirm', auth, async (req, res) => {
  try {
    const hazard = await Hazard.findById(req.params.id);
    if (!hazard) {
      return res.status(404).json({ message: 'Hazard not found' });
    }

    await hazard.addConfirmation();

    res.json({
      success: true,
      hazard: {
        id: hazard._id,
        confirmationCount: hazard.verification.confirmationCount,
        isVerified: hazard.verification.isVerified
      }
    });

  } catch (error) {
    console.error('Confirm hazard error:', error);
    res.status(500).json({ message: 'Error confirming hazard' });
  }
});

// @route   POST /api/hazards/:id/reject
// @desc    Reject hazard as false report
// @access  Private
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const hazard = await Hazard.findById(req.params.id);
    if (!hazard) {
      return res.status(404).json({ message: 'Hazard not found' });
    }

    await hazard.addRejection();

    res.json({
      success: true,
      hazard: {
        id: hazard._id,
        rejectionCount: hazard.verification.rejectionCount,
        status: hazard.status
      }
    });

  } catch (error) {
    console.error('Reject hazard error:', error);
    res.status(500).json({ message: 'Error rejecting hazard' });
  }
});

// @route   PUT /api/hazards/:id/resolve
// @desc    Resolve hazard
// @access  Private
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const hazard = await Hazard.findById(req.params.id);
    if (!hazard) {
      return res.status(404).json({ message: 'Hazard not found' });
    }

    await hazard.resolve(req.user.id);

    res.json({
      success: true,
      hazard: {
        id: hazard._id,
        status: hazard.status,
        resolvedAt: hazard.resolvedAt,
        actualDuration: hazard.actualDuration
      }
    });

  } catch (error) {
    console.error('Resolve hazard error:', error);
    res.status(500).json({ message: 'Error resolving hazard' });
  }
});

// @route   GET /api/hazards/cleanup
// @desc    Cleanup expired hazards (Admin utility)
// @access  Private
router.get('/cleanup', auth, async (req, res) => {
  try {
    const result = await Hazard.cleanupExpired();

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} expired hazards cleaned up`
    });

  } catch (error) {
    console.error('Cleanup hazards error:', error);
    res.status(500).json({ message: 'Error cleaning up hazards' });
  }
});

module.exports = router;