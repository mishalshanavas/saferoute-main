const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        savedLocations: user.savedLocations,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name', 'Name must be at least 2 characters').optional().isLength({ min: 2 }),
  body('email', 'Please include a valid email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  auth,
  body('safetyPriority', 'Safety priority must be between 0 and 100').optional().isInt({ min: 0, max: 100 }),
  body('maxDetour', 'Max detour must be between 0 and 100').optional().isInt({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.preferences = { ...user.preferences, ...req.body };
    await user.save();

    res.json({
      success: true,
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Error updating preferences' });
  }
});

// @route   POST /api/users/locations
// @desc    Add saved location
// @access  Private
router.post('/locations', [
  auth,
  body('name', 'Location name is required').not().isEmpty(),
  body('address', 'Address is required').not().isEmpty(),
  body('coordinates.lat', 'Latitude is required').isFloat(),
  body('coordinates.lng', 'Longitude is required').isFloat(),
  body('type').isIn(['home', 'work', 'favorite', 'other']).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newLocation = {
      name: req.body.name,
      address: req.body.address,
      coordinates: req.body.coordinates,
      type: req.body.type || 'other'
    };

    user.savedLocations.push(newLocation);
    await user.save();

    res.status(201).json({
      success: true,
      location: newLocation,
      savedLocations: user.savedLocations
    });

  } catch (error) {
    console.error('Add location error:', error);
    res.status(500).json({ message: 'Error adding location' });
  }
});

// @route   DELETE /api/users/locations/:locationId
// @desc    Remove saved location
// @access  Private
router.delete('/locations/:locationId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const locationIndex = user.savedLocations.findIndex(
      loc => loc._id.toString() === req.params.locationId
    );

    if (locationIndex === -1) {
      return res.status(404).json({ message: 'Location not found' });
    }

    user.savedLocations.splice(locationIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Location removed successfully',
      savedLocations: user.savedLocations
    });

  } catch (error) {
    console.error('Remove location error:', error);
    res.status(500).json({ message: 'Error removing location' });
  }
});

module.exports = router;