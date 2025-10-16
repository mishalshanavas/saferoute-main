const express = require('express');
const { body, query, validationResult } = require('express-validator');
const UnsafeZone = require('../models/UnsafeZone');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/unsafe-zones
// @desc    Get unsafe zones in area
// @access  Public
router.get('/', [
  query('lat', 'Latitude is required').isFloat(),
  query('lng', 'Longitude is required').isFloat(),
  query('radius', 'Radius must be a number').isFloat({ min: 1, max: 100 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng, radius = 50 } = req.query;
    const coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };

    const unsafeZones = await UnsafeZone.findActiveZones(coordinates, radius);

    res.json({
      success: true,
      zones: unsafeZones,
      count: unsafeZones.length
    });

  } catch (error) {
    console.error('Fetch unsafe zones error:', error);
    res.status(500).json({ message: 'Error fetching unsafe zones' });
  }
});

// @route   POST /api/unsafe-zones
// @desc    Create new unsafe zone (Admin only)
// @access  Private
router.post('/', [
  auth,
  body('name', 'Zone name is required').not().isEmpty(),
  body('riskLevel').isIn(['low', 'medium', 'high', 'critical']),
  body('category').isIn(['traffic', 'construction', 'accident_prone', 'crime_hotspot', 'weather_affected', 'road_condition', 'environmental', 'temporary', 'other']),
  body('geometry.type').isIn(['Polygon', 'MultiPolygon']),
  body('geometry.coordinates', 'Coordinates are required').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const unsafeZone = new UnsafeZone({
      ...req.body,
      reportedBy: {
        userId: req.user.id,
        source: 'admin'
      }
    });

    await unsafeZone.save();

    res.status(201).json({
      success: true,
      zone: unsafeZone
    });

  } catch (error) {
    console.error('Create unsafe zone error:', error);
    res.status(500).json({ message: 'Error creating unsafe zone' });
  }
});

// @route   PUT /api/unsafe-zones/:id
// @desc    Update unsafe zone status
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { isActive, riskLevel, validTo } = req.body;

    const unsafeZone = await UnsafeZone.findById(req.params.id);
    if (!unsafeZone) {
      return res.status(404).json({ message: 'Unsafe zone not found' });
    }

    if (typeof isActive === 'boolean') {
      unsafeZone.isActive = isActive;
    }
    if (riskLevel) {
      unsafeZone.riskLevel = riskLevel;
    }
    if (validTo) {
      unsafeZone.validTo = validTo;
    }

    await unsafeZone.save();

    res.json({
      success: true,
      zone: unsafeZone
    });

  } catch (error) {
    console.error('Update unsafe zone error:', error);
    res.status(500).json({ message: 'Error updating unsafe zone' });
  }
});

// @route   GET /api/unsafe-zones/categories
// @desc    Get unsafe zone categories and counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await UnsafeZone.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRiskMultiplier: { $avg: '$riskMultiplier' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

module.exports = router;