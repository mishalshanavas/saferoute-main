const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./config/database');
const contributionRoutes = require('./routes/contributionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/contributions', contributionRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SafeRoute Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to SafeRoute API',
    version: '1.0.0',
    endpoints: {
      contributions: {
        create: 'POST /api/contributions',
        getAll: 'GET /api/contributions',
        getById: 'GET /api/contributions/:id',
        getByType: 'GET /api/contributions/type/:type',
        getNearby: 'GET /api/contributions/nearby?latitude=&longitude=&radius=',
        updateStatus: 'PATCH /api/contributions/:id/status',
        vote: 'POST /api/contributions/:id/vote',
        delete: 'DELETE /api/contributions/:id',
        statistics: 'GET /api/contributions/statistics'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
});

module.exports = app;
