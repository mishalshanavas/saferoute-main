# SafeRoute - MERN Stack with Java Microservices

A comprehensive **MERN (MongoDB, Express.js, React, Node.js) + Java** application that demonstrates advanced **fastest vs safest routing** using OpenStreetMap, Leaflet.js, and real-time hazard detection. This enterprise-ready application features microservices architecture with user authentication, route persistence, and advanced geospatial calculations.

## 🚀 Features

### Core Functionality
- **Interactive Map**: Powered by Leaflet.js and OpenStreetMap (no API key required)
- **Advanced Routing**: Java-powered algorithms for fastest, safest, and balanced routes
- **Real-time Hazard Detection**: Live hazard reporting and route recalculation
- **Safety Scoring**: AI-enhanced safety analysis using multiple data sources
- **User Authentication**: Secure JWT-based login with user preferences
- **Route History**: Persistent route storage with MongoDB
- **Real-time Updates**: WebSocket integration for live hazard notifications

### Enterprise Features
- **Microservices Architecture**: Scalable Node.js + Java services
- **Geospatial Processing**: Advanced JTS-based spatial calculations in Java  
- **Data Persistence**: MongoDB with Mongoose ODM
- **API Gateway**: Express.js with comprehensive error handling
- **Responsive Design**: Mobile-first React application with Redux state management

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern functional components with hooks
- **Redux Toolkit**: State management for complex application state
- **React Router**: Client-side routing and navigation
- **Leaflet.js**: Interactive mapping with OpenStreetMap
- **Tailwind CSS**: Utility-first styling framework
- **Socket.io Client**: Real-time communication

### Backend (Node.js)
- **Express.js**: RESTful API server and middleware
- **MongoDB**: Document database with Mongoose ODM
- **JWT**: Secure authentication and authorization
- **Socket.io**: Real-time WebSocket communication
- **Axios**: HTTP client for external API calls

### Java Microservices
- **Spring Boot**: Enterprise Java framework
- **JTS Topology Suite**: Advanced geospatial calculations
- **Maven**: Dependency management and build automation
- **REST APIs**: Inter-service communication

### External Services
- **OSRM API**: Route calculation and navigation
- **OpenStreetMap**: Map tiles and geocoding

## 📦 Installation & Setup

### Prerequisites
- **Node.js 18+** and npm
- **Java 17+** (for Java microservices)
- **Maven 3.6+** (for Java builds)
- **MongoDB 6.0+** (local or cloud instance)

### Local Development Setup

1. **Clone and Install All Dependencies**
   ```bash
   git clone <your-repo-url>
   cd saferoute-main
   npm run install-all
   ```

   > **Note**: The project has been cleaned of all unused Next.js dependencies and files. Only the MERN+Java architecture remains.

2. **Set up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string and other settings
   ```

3. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod --dbpath /path/to/your/db
   
   # Or use MongoDB Atlas (cloud) - update MONGODB_URI in .env
   ```

4. **Start All Services**
   ```bash
   # Start all services concurrently (recommended for development)
   npm run dev
   
   # Or start services individually:
   # Terminal 1 - Backend API (Express)
   npm run server
   
   # Terminal 2 - Frontend (React)  
   npm run client
   
   # Terminal 3 - Java Services
   npm run java
   ```

5. **Access the Application**
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000) 
   - **Java Service**: [http://localhost:8080](http://localhost:8080)

### Service Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   Express.js     │    │  Spring Boot    │
│   (Port 3000)   │◄──►│   (Port 5000)    │◄──►│  (Port 8080)    │
│                 │    │                  │    │                 │
│ • User Interface│    │ • REST API       │    │ • Route Algorithms│
│ • Redux Store   │    │ • Authentication │    │ • Geospatial Calc│
│ • Socket Client │    │ • WebSockets     │    │ • JTS Processing │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │    MongoDB       │
                       │   (Port 27017)   │
                       │                  │
                       │ • User Data      │
                       │ • Route History  │
                       │ • Unsafe Zones   │
                       │ • Hazard Reports │
                       └──────────────────┘
```

## 🚀 Vercel Deployment

### Option 1: Deploy from GitHub

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy" (no configuration needed)

### Option 2: Vercel CLI

1. **Install Vercel CLI**
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. **Deploy**
   \`\`\`bash
   vercel
   \`\`\`

3. **Follow prompts**
   - Project name: `safe-routing-demo`
   - Framework: Next.js (auto-detected)
   - Build settings: Use defaults

## 🎯 How to Use

### Getting Started
1. **Register/Login**: Create an account or login to access personalized features
2. **Set Your Location**: Allow location access or manually enter your current location
3. **Configure Preferences**: Set safety priorities, route preferences, and notification settings

### Route Planning
1. **Enter Addresses**: Input origin and destination addresses
2. **Choose Route Type**: Select fastest, safest, or balanced routing
3. **Calculate Routes**: Click "Calculate Routes" to get optimal paths
4. **Compare Options**: View side-by-side route comparisons with safety scores
5. **Save Routes**: Save frequently used routes for quick access

### Real-time Features  
1. **Report Hazards**: Report accidents, construction, or other road hazards
2. **Receive Alerts**: Get real-time notifications about hazards on your route
3. **Route Recalculation**: Automatic route updates when hazards are detected
4. **Community Updates**: Benefit from community-reported hazard information

### Advanced Features
1. **Route History**: Access your previously calculated routes
2. **Safety Analytics**: View detailed safety breakdowns and risk assessments
3. **Preference Learning**: System learns from your route choices to improve suggestions

## 🔧 Development Commands

### Package Management
```bash
npm run install-all    # Install all dependencies (root, backend, frontend)
```

### Development
```bash
npm run dev            # Start all services concurrently
npm run dev-no-java    # Start MERN stack only (no Java service)
npm run server         # Start only Express.js backend
npm run client         # Start only React frontend  
npm run java           # Start only Java microservice
```

## 🔓 Authentication Bypass (Demo Mode)

For development and demonstration purposes, authentication can be bypassed to allow immediate access to all features without requiring user registration or login.

### Features
- **Automatic Login**: Users are automatically logged in as "Demo User"
- **Full Feature Access**: All protected routes and features are accessible
- **Original Code Preserved**: Login/signup functionality remains intact for future use
- **Easy Toggle**: Can be enabled/disabled during development

### Usage
1. **Automatic**: Auth bypass is enabled by default in development mode
2. **Manual Toggle**: Use the developer controls on the homepage (development builds only)
3. **Code Toggle**: Modify `bypassAuth: true` in `frontend/src/store/slices/authSlice.js`

### Demo User Details
- **Name**: Demo User
- **Email**: demo@saferoute.com
- **ID**: demo-user
- **Access**: All features and protected routes

### Re-enabling Authentication
To restore normal authentication flow:
1. Set `bypassAuth: false` in the auth slice
2. Or use the toggle button on homepage (development mode)
3. Clear localStorage and refresh the application

> **Note**: This feature is intended for development and demo purposes only. Disable in production environments.

### Building
```bash
npm run build          # Build React production bundle
npm run build-java     # Build Java service JAR
```

### Testing
```bash
npm run test           # Run backend tests
npm run test-java      # Run Java service tests
npm run lint          # Run frontend linting
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register    # Register new user
POST /api/auth/login       # User login
GET  /api/auth/me          # Get current user
POST /api/auth/logout      # User logout
```

### Route Endpoints
```
POST /api/routes/calculate    # Calculate new route
GET  /api/routes/history     # Get user route history
GET  /api/routes/saved       # Get saved routes
PUT  /api/routes/:id/save    # Save/unsave route
GET  /api/routes/popular     # Get popular routes in area
```

### Hazard Endpoints
```
GET  /api/hazards/active     # Get active hazards in area
POST /api/hazards/report     # Report new hazard
POST /api/hazards/:id/confirm # Confirm hazard existence
```

### Java Service Endpoints
```
POST /api/routes/safe        # Advanced safe route calculation
POST /api/routes/fastest     # Optimized fastest route
POST /api/routes/analyze-safety # Safety analysis for route
POST /api/routes/optimize    # Multi-objective route optimization
```

## 🧠 Advanced Route Algorithm

### Multi-Service Architecture

The routing system uses a **hybrid approach** combining multiple services:

1. **OSRM Service**: Fast initial route calculation
2. **Java Microservice**: Advanced safety analysis and optimization
3. **Node.js Service**: Real-time hazard integration and user preferences

### Safety Calculation Engine

The Java-powered safety algorithm considers:

1. **Route Fetching**: Get the fastest route from OSRM public API
2. **Intersection Detection**: Use Turf.js to check if route intersects unsafe zone polygons
3. **Safety Scoring**: Calculate score based on intersections and risk levels
4. **Route Modification**: Generate safer alternative by offsetting coordinates away from unsafe zones

### Algorithm Details

\`\`\`javascript
// 1. Check intersections
const intersects = turf.booleanIntersects(routeLine, unsafeZonePolygon);

// 2. Calculate safety score
safetyScore = 100 - (intersectionCount * 25) - (riskLevelPenalty);

// 3. Generate safe route
if (pointInUnsafeZone) {
  const bearing = turf.bearing(zoneCentroid, point);
  const safePoint = turf.destination(point, offsetDistance, bearing);
}
\`\`\`

### Limitations & Assumptions

- **Simulated Data**: Unsafe zones are hardcoded GeoJSON polygons
- **Simple Offsetting**: Safe route generation uses basic coordinate offsetting
- **No Real-Time Data**: No integration with live traffic or crime data
- **Frontend Only**: All calculations happen in the browser

## 🗂️ Project Structure

\`\`\`
safe-routing-demo/
├── components/
│   └── MapComponent.js          # Leaflet map component
├── data/
│   └── unsafeZones.geojson     # Hardcoded unsafe zone polygons
├── pages/
│   └── index.js                # Main application page
├── styles/
│   └── globals.css             # Tailwind CSS styles
├── utils/
│   └── safeRoute.js            # Safe routing algorithms
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── next.config.mjs             # Next.js configuration
└── README.md                   # This file
\`\`\`

## 🔧 Configuration

### Adding New Unsafe Zones

Edit `data/unsafeZones.geojson`:

\`\`\`json
{
  "type": "Feature",
  "properties": {
    "name": "Your Zone Name",
    "risk_level": "high" // or "medium"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [longitude, latitude],
      // ... more coordinates
    ]]
  }
}
\`\`\`

### Customizing Safety Algorithm

Modify `utils/safeRoute.js`:

- Adjust `offsetDistance` for route deviation amount
- Change penalty values in `calculateSafetyScore()`
- Add new risk factors or data sources

## 🐛 Troubleshooting

### Common Issues

1. **Map not loading**: Check browser console for CORS errors
2. **Routes not calculating**: Verify addresses are valid and geocodable
3. **Build errors**: Ensure all dependencies are installed correctly

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Responsive design included

## 📄 License

MIT License - feel free to use for hackathons, demos, and learning!

## 🤝 Contributing

This is a hackathon demo project. Feel free to fork and extend with:

- Real crime/traffic data integration
- More sophisticated routing algorithms
- User accounts and route saving
- Mobile app version
- Machine learning for risk prediction

---

**Built for hackathons with ❤️**
