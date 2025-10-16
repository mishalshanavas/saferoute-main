const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  },
  destination: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  },
  routeType: {
    type: String,
    enum: ['fastest', 'safest', 'balanced'],
    required: true
  },
  routeData: {
    coordinates: [[Number]], // Array of [lng, lat] pairs
    distance: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    safetyScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    avoidedZones: {
      type: Number,
      default: 0
    },
    intersectedZones: [{
      zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UnsafeZone'
      },
      zoneName: String,
      riskLevel: String,
      intersectionLength: Number
    }]
  },
  preferences: {
    safetyPriority: Number,
    avoidTolls: Boolean,
    avoidHighways: Boolean,
    maxDetour: Number
  },
  calculationMetrics: {
    calculationTime: Number, // in milliseconds
    javaServiceUsed: Boolean,
    algorithmUsed: String,
    apiCalls: {
      osrm: Number,
      geocoding: Number,
      java: Number
    }
  },
  isSaved: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    trim: true
  },
  tags: [String],
  usageCount: {
    type: Number,
    default: 1
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
routeSchema.index({ 
  "origin.coordinates": "2dsphere",
  "destination.coordinates": "2dsphere"
});

// Index for user queries
routeSchema.index({ userId: 1, createdAt: -1 });
routeSchema.index({ userId: 1, isSaved: 1 });
routeSchema.index({ userId: 1, isFavorite: 1 });

// Methods
routeSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

routeSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
  return this.save();
};

// Static methods
routeSchema.statics.findByArea = function(coordinates, radiusInKm = 10) {
  return this.find({
    $or: [
      {
        "origin.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [coordinates.lng, coordinates.lat]
            },
            $maxDistance: radiusInKm * 1000 // Convert to meters
          }
        }
      },
      {
        "destination.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [coordinates.lng, coordinates.lat]
            },
            $maxDistance: radiusInKm * 1000
          }
        }
      }
    ]
  });
};

routeSchema.statics.getPopularRoutes = function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: {
          origin: "$origin.address",
          destination: "$destination.address"
        },
        count: { $sum: 1 },
        avgSafetyScore: { $avg: "$routeData.safetyScore" },
        totalUsage: { $sum: "$usageCount" }
      }
    },
    {
      $sort: { totalUsage: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('Route', routeSchema);