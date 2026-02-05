const express = require('express');
const cors = require('cors');
require('dotenv').config();

const geocodeRouter = require('./routes/geocode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://mapprompt-cz.netlify.app',
  process.env.CORS_ORIGIN || 'https://n07name7.github.io'
].filter(Boolean);

// TEMPORARY: Allow all origins for testing
app.use(cors({
  origin: '*',
  credentials: false
}));

/* 
// TODO: Re-enable strict CORS after Vercel deployment is confirmed
app.use(cors({
  origin: function(origin, callback) {
    // Разрешить запросы без origin (например, curl или Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
*/

app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/geocode', geocodeRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MapPrompt Backend API running on http://localhost:${PORT}`);
  console.log(`📍 Endpoints:`);
  console.log(`   POST /api/geocode - Геокодирование адресов`);
  console.log(`   GET  /health      - Health check`);
});

module.exports = app;
