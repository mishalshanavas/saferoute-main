const Contribution = require('../models/Contribution');

// Create a new contribution
const createContribution = async (req, res) => {
  try {
    const {
      type,
      coordinates,
      address,
      description,
      severity,
      contributorName,
      contributorEmail
    } = req.body;

    // Validate required fields
    if (!type || !coordinates || !coordinates.latitude || !coordinates.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Type and coordinates (latitude, longitude) are required'
      });
    }

    // Create new contribution
    const contribution = await Contribution.create({
      type,
      coordinates: {
        latitude: parseFloat(coordinates.latitude),
        longitude: parseFloat(coordinates.longitude)
      },
      address,
      description,
      severity: severity || 'medium',
      contributorName,
      contributorEmail
    });

    res.status(201).json({
      success: true,
      message: 'Contribution submitted successfully',
      data: contribution
    });
  } catch (error) {
    console.error('Error creating contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting contribution',
      error: error.message
    });
  }
};

// Get all contributions
const getAllContributions = async (req, res) => {
  try {
    const { type, status, verified } = req.query;
    
    // Build query
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (verified !== undefined) query.verified = verified === 'true';

    const contributions = await Contribution.find(query)
      .sort({ createdAt: -1 })
      .limit(1000);

    res.status(200).json({
      success: true,
      count: contributions.length,
      data: contributions
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contributions',
      error: error.message
    });
  }
};

// Get contribution by ID
const getContributionById = async (req, res) => {
  try {
    const contribution = await Contribution.findById(req.params.id);

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }

    res.status(200).json({
      success: true,
      data: contribution
    });
  } catch (error) {
    console.error('Error fetching contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contribution',
      error: error.message
    });
  }
};

// Get contributions by type
const getContributionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const contributions = await Contribution.find({ type })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contributions.length,
      data: contributions
    });
  } catch (error) {
    console.error('Error fetching contributions by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contributions',
      error: error.message
    });
  }
};

// Get contributions within a radius (nearby)
const getNearbyContributions = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusInKm = parseFloat(radius);

    // Simple distance calculation (not using MongoDB geospatial features)
    const contributions = await Contribution.find();
    
    const nearby = contributions.filter(contrib => {
      const distance = getDistanceFromLatLonInKm(
        lat,
        lng,
        contrib.coordinates.latitude,
        contrib.coordinates.longitude
      );
      return distance <= radiusInKm;
    });

    res.status(200).json({
      success: true,
      count: nearby.length,
      data: nearby
    });
  } catch (error) {
    console.error('Error fetching nearby contributions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby contributions',
      error: error.message
    });
  }
};

// Update contribution status
const updateContributionStatus = async (req, res) => {
  try {
    const { status, verifiedBy } = req.body;

    if (!status || !['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (pending, verified, rejected)'
      });
    }

    const updateData = { status };
    if (status === 'verified') {
      updateData.verified = true;
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = verifiedBy || 'admin';
    }

    const contribution = await Contribution.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contribution status updated',
      data: contribution
    });
  } catch (error) {
    console.error('Error updating contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contribution',
      error: error.message
    });
  }
};

// Delete contribution
const deleteContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findByIdAndDelete(req.params.id);

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contribution deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contribution',
      error: error.message
    });
  }
};

// Vote on contribution
const voteContribution = async (req, res) => {
  try {
    const { voteType } = req.body;

    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid voteType is required (upvote, downvote)'
      });
    }

    const updateField = voteType === 'upvote' ? 'votes.upvotes' : 'votes.downvotes';
    
    const contribution = await Contribution.findByIdAndUpdate(
      req.params.id,
      { $inc: { [updateField]: 1 } },
      { new: true }
    );

    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: 'Contribution not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vote recorded',
      data: contribution
    });
  } catch (error) {
    console.error('Error voting on contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error voting on contribution',
      error: error.message
    });
  }
};

// Get statistics
const getStatistics = async (req, res) => {
  try {
    const stats = await Contribution.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          verified: {
            $sum: { $cond: ['$verified', 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    const total = await Contribution.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        total,
        byType: stats
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Helper function to calculate distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = {
  createContribution,
  getAllContributions,
  getContributionById,
  getContributionsByType,
  getNearbyContributions,
  updateContributionStatus,
  deleteContribution,
  voteContribution,
  getStatistics
};
