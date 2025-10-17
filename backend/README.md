# SafeRoute Backend API

Express.js backend with MongoDB Atlas integration for managing safety contributions.

## Features

- MongoDB Atlas connection
- RESTful API for safety contributions
- Support for multiple hazard types (CCTV, no street lights, abandoned houses, etc.)
- Geospatial queries for nearby contributions
- Voting system
- Statistics endpoint

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
MONGODB_URI=your_mongodb_atlas_connection_string
DATABASE_NAME=saferoute
PORT=5000
NODE_ENV=development
```

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Contributions

- `POST /api/contributions` - Create new contribution
- `GET /api/contributions` - Get all contributions (with filters)
- `GET /api/contributions/:id` - Get contribution by ID
- `GET /api/contributions/type/:type` - Get contributions by type
- `GET /api/contributions/nearby` - Get nearby contributions
- `PATCH /api/contributions/:id/status` - Update contribution status
- `POST /api/contributions/:id/vote` - Vote on contribution
- `DELETE /api/contributions/:id` - Delete contribution
- `GET /api/contributions/statistics` - Get statistics

### Contribution Types

- `cctv` - CCTV camera locations
- `no_street_light` - Areas without street lighting
- `abandoned_house` - Abandoned buildings
- `pothole` - Road potholes
- `accident_prone` - Accident-prone areas
- `dark_area` - Dark/poorly lit areas
- `other` - Other safety concerns

## Example Request

```bash
curl -X POST http://localhost:5000/api/contributions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "no_street_light",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "address": "123 Main St, New York, NY",
    "description": "Dark street with no lighting",
    "severity": "high",
    "contributorName": "John Doe",
    "contributorEmail": "john@example.com"
  }'
```

## Database Schema

### Contribution Model

```javascript
{
  type: String (enum),
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  address: String,
  description: String,
  severity: String (enum: low, medium, high),
  status: String (enum: pending, verified, rejected),
  contributorName: String,
  contributorEmail: String,
  verified: Boolean,
  verifiedAt: Date,
  verifiedBy: String,
  votes: {
    upvotes: Number,
    downvotes: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```
