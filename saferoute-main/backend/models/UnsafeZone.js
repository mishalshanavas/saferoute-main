const mongoose = require('mongoose');

const unsafeZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Zone name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium'
  },
  riskMultiplier: {
    type: Number,
    required: true,
    min: 1.0,
    max: 5.0,
    default: 1.5
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // GeoJSON polygon coordinates
      required: true
    }
  },
  category: {
    type: String,
    enum: [
      'traffic',
      'construction', 
      'accident_prone',
      'crime_hotspot',
      'weather_affected',
      'road_condition',
      'environmental',
      'temporary',
      'other'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical'],
    default: 'moderate'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTemporary: {
    type: Boolean,
    default: false
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validTo: {
    type: Date
  },
  timePatterns: {
    allDay: {
      type: Boolean,
      default: true
    },
    timeSlots: [{
      dayOfWeek: {
        type: Number,
        min: 0, // Sunday
        max: 6  // Saturday
      },
      startTime: String, // "HH:MM"
      endTime: String    // "HH:MM"
    }],
    excludedDates: [Date]
  },
  reportedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      enum: ['user_report', 'admin', 'api_import', 'automatic_detection'],
      default: 'admin'
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified'
    }
  },
  statistics: {
    reportCount: {
      type: Number,
      default: 0
    },
    affectedRoutes: {
      type: Number,
      default: 0
    },
    lastIncident: Date
  },
  metadata: {
    tags: [String],
    externalId: String, // For API integrations
    dataSource: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Create geospatial index
unsafeZoneSchema.index({ geometry: "2dsphere" });

// Index for queries
unsafeZoneSchema.index({ isActive: 1, riskLevel: 1 });
unsafeZoneSchema.index({ category: 1, isActive: 1 });
unsafeZoneSchema.index({ validFrom: 1, validTo: 1 });

// Methods
unsafeZoneSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  
  if (!this.isActive) return false;
  
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validTo && now > this.validTo) return false;
  
  return true;
};

unsafeZoneSchema.methods.updateStatistics = function(increment = {}) {
  if (increment.reportCount) {
    this.statistics.reportCount += increment.reportCount;
  }
  if (increment.affectedRoutes) {
    this.statistics.affectedRoutes += increment.affectedRoutes;
  }
  this.statistics.lastIncident = new Date();
  return this.save();
};

// Static methods
unsafeZoneSchema.statics.findActiveZones = function(coordinates, radiusInKm = 50) {
  return this.find({
    isActive: true,
    geometry: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat]
        },
        $maxDistance: radiusInKm * 1000
      }
    },
    $or: [
      { validTo: { $exists: false } },
      { validTo: { $gte: new Date() } }
    ]
  });
};

unsafeZoneSchema.statics.findByRiskLevel = function(riskLevel, activeOnly = true) {
  const query = { riskLevel };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query);
};

unsafeZoneSchema.statics.findIntersectingZones = function(routeCoordinates) {
  // This would typically use geospatial intersection queries
  // For now, return a simple proximity-based query
  return this.find({
    isActive: true,
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: "LineString",
          coordinates: routeCoordinates
        }
      }
    }
  });
};

// Pre-save middleware
unsafeZoneSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('UnsafeZone', unsafeZoneSchema);