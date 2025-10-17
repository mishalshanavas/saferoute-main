const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['cctv', 'no_street_light', 'abandoned_house', 'pothole', 'accident_prone', 'dark_area', 'other'],
    lowercase: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  address: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  contributorName: {
    type: String,
    trim: true
  },
  contributorEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: String
  },
  votes: {
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for geospatial queries
contributionSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
contributionSchema.index({ type: 1 });
contributionSchema.index({ status: 1 });
contributionSchema.index({ createdAt: -1 });

const Contribution = mongoose.model('Contribution', contributionSchema);

module.exports = Contribution;
