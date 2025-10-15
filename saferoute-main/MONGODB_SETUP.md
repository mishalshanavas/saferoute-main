# MongoDB Setup Instructions

## Option 1: Install MongoDB Community Edition Locally

1. Download MongoDB Community Edition from: https://www.mongodb.com/try/download/community
2. Install MongoDB following the official installation guide
3. Start MongoDB service:
   ```
   mongod --dbpath "C:\data\db"
   ```

## Option 2: Use MongoDB Atlas (Cloud)

1. Create free account at: https://www.mongodb.com/atlas
2. Create a new cluster
3. Get your connection string
4. Update backend/.env file with your connection string

## Option 3: Use Docker (Recommended for Development)

1. Install Docker Desktop
2. Run MongoDB container:
   ```
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

## Backend Configuration

Update your backend/.env file with:
```
MONGODB_URI=mongodb://localhost:27017/saferoute
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/saferoute
```

## Default Database Setup

The application will create the following collections automatically:
- users (user accounts and authentication)
- routes (saved and calculated routes)
- hazards (real-time hazard reports)
- unsafezones (persistent dangerous areas)

## Sample Data

After MongoDB is running, the application can populate sample data including:
- Demo user accounts
- Sample unsafe zones from GeoJSON
- Test hazard reports
- Example routes

Start the backend server and it will automatically create the database structure.