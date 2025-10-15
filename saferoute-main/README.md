# Safe Routing Demo - Hackathon Project

A Next.js application that demonstrates **fastest vs safest routing** using OpenStreetMap, Leaflet.js, and simulated unsafe zones. This is a frontend-only application perfect for hackathons and demos.

## 🚀 Features

- **Interactive Map**: Powered by Leaflet.js and OpenStreetMap (no API key required)
- **Dual Routing**: Compare fastest vs safest routes side-by-side
- **Unsafe Zone Detection**: Hardcoded GeoJSON polygons representing dangerous areas
- **Safety Scoring**: Dynamic safety scores based on route intersections with unsafe zones
- **Hazard Simulation**: Add real-time hazards that force route recalculation
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Mapping**: Leaflet.js, OpenStreetMap tiles
- **Routing**: OSRM public API (router.project-osrm.org)
- **Geospatial**: Turf.js for polygon intersections and calculations
- **Deployment**: Vercel-ready

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo-url>
   cd safe-routing-demo
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Run development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

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

1. **Enter Addresses**: Input origin and destination in the text fields
2. **Calculate Routes**: Click "Calculate Routes" to fetch fastest route and compute safest alternative
3. **Toggle Views**: Switch between "Fastest Route" and "Safest Route" views
4. **Simulate Hazards**: Click "🚨 Simulate Hazard" to add a random hazard and see route recalculation
5. **View Statistics**: Check safety scores, distances, and intersection counts in the sidebar

## 🧠 Safe Route Algorithm

### How It Works

The safe routing algorithm uses a multi-step process:

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
