// app.js - Point d'entrée principal du backend
// Configure Express, Socket.io, et démarre le serveur

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import des routes
const serverRoutes = require('./routes/servers');
const metricRoutes = require('./routes/metrics');

// Import du gestionnaire WebSocket
const setupSocketHandlers = require('./socket/socketHandler');

// Import de la configuration database pour tester la connexion
const db = require('./config/database');

// Créer l'application Express
const app = express();

// Créer le serveur HTTP (nécessaire pour Socket.io)
const server = http.createServer(app);

// Configurer Socket.io avec CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Configuration du port
const PORT = process.env.PORT || 5000;

// Middlewares globaux

// CORS - Permet au frontend d'accéder à l'API
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Parser JSON
app.use(express.json());

// Parser URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Logger simple pour les requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Middleware pour rendre io accessible dans les contrôleurs
// Permet d'émettre des événements WebSocket depuis les routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes de base

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'Monitoring Dashboard API',
    version: '1.0.0',
    endpoints: {
      servers: '/api/servers',
      metrics: '/api/metrics',
      health: '/health',
    },
  });
});

// Routes API
app.use('/api/servers', serverRoutes);
app.use('/api/metrics', metricRoutes);

// Gestion des routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Configurer les gestionnaires WebSocket
setupSocketHandlers(io);

// Fonction pour démarrer le serveur
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    await db.query('SELECT NOW()');
    console.log('Database connection successful');
    
    // Démarrer le serveur
    server.listen(PORT, () => {
      console.log('=================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API URL: http://localhost:${PORT}`);
      console.log(`WebSocket ready for connections`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    db.pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    db.pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

// Exporter pour les tests (optionnel)
module.exports = { app, server, io };
