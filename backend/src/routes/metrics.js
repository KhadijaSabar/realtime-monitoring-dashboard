// Routes pour les métriques
// Définit tous les endpoints liés aux métriques système

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const metricController = require('../controllers/metricController');

// Validation pour la création d'une métrique
const metricValidation = [
  body('server_id')
    .isInt({ min: 1 })
    .withMessage('Valid server ID is required'),
  body('cpu_percent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('CPU percent must be between 0 and 100'),
  body('ram_percent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('RAM percent must be between 0 and 100'),
  body('ram_used_mb')
    .isFloat({ min: 0 })
    .withMessage('RAM used must be a positive number'),
  body('ram_total_mb')
    .isFloat({ min: 0 })
    .withMessage('RAM total must be a positive number'),
  body('disk_percent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Disk percent must be between 0 and 100'),
  body('disk_used_gb')
    .isFloat({ min: 0 })
    .withMessage('Disk used must be a positive number'),
  body('disk_total_gb')
    .isFloat({ min: 0 })
    .withMessage('Disk total must be a positive number'),
  body('network_sent_mb')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Network sent must be a positive number'),
  body('network_recv_mb')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Network received must be a positive number'),
];

// Routes

// POST /api/metrics - Créer une nouvelle métrique
// Endpoint principal appelé par le collector Python
router.post('/', metricValidation, metricController.createMetric);

// GET /api/metrics/current/:serverId - Récupérer la métrique actuelle d'un serveur
router.get('/current/:serverId', metricController.getCurrentMetric);

// GET /api/metrics/history/:serverId - Récupérer l'historique des métriques
// Query params: from, to, limit, hours
router.get('/history/:serverId', metricController.getMetricHistory);

// GET /api/metrics/stats/:serverId - Récupérer les statistiques moyennes
// Query params: hours (default 24)
router.get('/stats/:serverId', metricController.getMetricStats);

// GET /api/metrics/count/:serverId - Compter les métriques d'un serveur
router.get('/count/:serverId', metricController.getMetricCount);

// DELETE /api/metrics/cleanup - Supprimer les anciennes métriques
// Query params: days (default 30)
router.delete('/cleanup', metricController.cleanOldMetrics);

module.exports = router;
