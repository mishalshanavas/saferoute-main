const mongoose = require('mongoose');

const hazardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'accident',
      'construction',
      'traffic_jam',
      'road_closure',
      'weather_incident',
      'police_activity',
      'event_congestion',
      'vehicle_breakdown',
      'debris',
      'flooding',
      'other'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical'],
    default: 'moderate'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  reportedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      enum: ['user_report', 'traffic_api', 'admin', 'automatic_detection'],
      default: 'user_report'
    },
    anonymous: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'verified', 'false_report', 'expired'],
    default: 'active'
  },
  affectedRadius: {
    type: Number, // in meters
    default: 500,
    min: 50,
    max: 10000
  },
  estimatedDuration: {
    type: Number, // in minutes
    min: 0,
    max: 1440 // 24 hours max
  },
  actualDuration: {
    type: Number // calculated when resolved
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationMethod: {
      type: String,
      enum: ['admin_review', 'user_confirmation', 'automatic', 'external_api']
    },
    confirmationCount: {
      type: Number,
      default: 0
    },
    rejectionCount: {
      type: Number,
      default: 0
    }
  },
  impactMetrics: {
    estimatedDelay: {
      type: Number, // in minutes
      default: 0
    },
    alternativeRoutesCount: {
      type: Number,
      default: 0
    },
    affectedRoutes: [{
      routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
      },
      impactLevel: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    trafficIncrease: {
      type: Number, // percentage
      default: 0
    }
  },
  mediaAttachments: [{
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  externalData: {
    trafficApiId: String,
    weatherApiData: mongoose.Schema.Types.Mixed,
    newsReports: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resolvedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 24 hours from creation
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes
hazardSchema.index({ location: "2dsphere" });
hazardSchema.index({ type: 1, status: 1 });
hazardSchema.index({ isActive: 1, expiresAt: 1 });
hazardSchema.index({ "reportedBy.userId": 1, createdAt: -1 });
hazardSchema.index({ createdAt: -1 });

// Methods
hazardSchema.methods.resolve = function(resolvedByUserId) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.isActive = false;
  
  if (this.createdAt) {
    this.actualDuration = Math.floor((this.resolvedAt - this.createdAt) / (1000 * 60)); // in minutes
  }
  
  return this.save();
};

hazardSchema.methods.verify = function(verifiedByUserId, method = 'admin_review') {
  this.verification.isVerified = true;
  this.verification.verifiedBy = verifiedByUserId;
  this.verification.verifiedAt = new Date();
  this.verification.verificationMethod = method;
  
  return this.save();
};

hazardSchema.methods.addConfirmation = function() {
  this.verification.confirmationCount += 1;
  
  // Auto-verify if enough confirmations
  if (this.verification.confirmationCount >= 3 && !this.verification.isVerified) {
    this.verification.isVerified = true;
    this.verification.verificationMethod = 'user_confirmation';
    this.verification.verifiedAt = new Date();
  }
  
  return this.save();
};

hazardSchema.methods.addRejection = function() {
  this.verification.rejectionCount += 1;
  
  // Mark as false report if too many rejections
  if (this.verification.rejectionCount >= 5) {
    this.status = 'false_report';
    this.isActive = false;
  }
  
  return this.save();
};

// Static methods
hazardSchema.statics.findActiveInArea = function(coordinates, radiusInKm = 10) {
  return this.find({
    isActive: true,
    status: 'active',
    expiresAt: { $gte: new Date() },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat]
        },
        $maxDistance: radiusInKm * 1000
      }
    }
  });
};

hazardSchema.statics.findByRoute = function(routeCoordinates, bufferInMeters = 1000) {
  // Find hazards within buffer distance of route
  return this.find({
    isActive: true,
    status: 'active',
    expiresAt: { $gte: new Date() },
    location: {
      $near: {
        $geometry: {
          type: "LineString",
          coordinates: routeCoordinates
        },
        $maxDistance: bufferInMeters
      }
    }
  });
};

hazardSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      expiresAt: { $lt: new Date() },
      isActive: true
    },
    { 
      $set: { 
        isActive: false,
        status: 'expired'
      }
    }
  );
};

// Pre-save middleware
hazardSchema.pre('save', function(next) {
  // Calculate priority based on severity and type
  const severityWeights = { minor: 2, moderate: 4, major: 7, critical: 10 };
  const typeWeights = {
    accident: 3,
    road_closure: 3,
    construction: 2,
    traffic_jam: 1,
    weather_incident: 2,
    police_activity: 2,
    vehicle_breakdown: 1,
    flooding: 3,
    other: 1
  };
  
  const basePriority = (severityWeights[this.severity] || 5) + (typeWeights[this.type] || 1);
  this.priority = Math.min(10, Math.max(1, basePriority));
  
  next();
});

module.exports = mongoose.model('Hazard', hazardSchema);