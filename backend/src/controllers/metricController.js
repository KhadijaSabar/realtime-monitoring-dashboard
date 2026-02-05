// Contrôleur Metric - Gère la logique métier des endpoints métriques
// Ce fichier fait le lien entre les routes et le modèle

const Metric = require('../models/Metric');
const Server = require('../models/Server');
const { validationResult } = require('express-validator');

// Créer une nouvelle métrique
// Endpoint principal appelé par le script Python toutes les 5 secondes
const createMetric = async (req, res) => {
  try {
    // Valider les données d'entrée
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    
    const metricData = req.body;
    
    // Vérifier que le serveur existe
    const server = await Server.findById(metricData.server_id);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }
    
    // Créer la métrique
    const metric = await Metric.create(metricData);
    
    // Mettre à jour last_seen du serveur
    await Server.updateLastSeen(metricData.server_id);
    
    // Émettre l'événement WebSocket pour mise à jour temps réel
    // req.io est ajouté par le middleware socket dans app.js
    if (req.io) {
      req.io.emit('metrics-update', {
        server_id: metricData.server_id,
        ...metric,
      });
    }
    
    res.status(201).json({
      success: true,
      data: metric,
    });
  } catch (error) {
    console.error('Error creating metric:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create metric',
    });
  }
};

// Récupérer la dernière métrique d'un serveur
// Utilisé pour afficher les valeurs actuelles sur le dashboard
const getCurrentMetric = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    // Vérifier que le serveur existe
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }
    
    const metric = await Metric.findLatestByServerId(serverId);
    
    if (!metric) {
      return res.status(404).json({
        success: false,
        error: 'No metrics found for this server',
      });
    }
    
    res.json({
      success: true,
      data: metric,
    });
  } catch (error) {
    console.error('Error fetching current metric:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current metric',
    });
  }
};

// Récupérer l'historique des métriques
// Utilisé pour afficher les graphiques historiques
const getMetricHistory = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { from, to, limit, hours } = req.query;
    
    // Vérifier que le serveur existe
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }
    
    let metrics;
    
    // Si 'hours' est spécifié, récupérer les X dernières heures
    if (hours) {
      metrics = await Metric.findRecentByServerId(serverId, parseInt(hours));
    } else {
      // Sinon, utiliser from/to si fournis
      metrics = await Metric.findHistoryByServerId(
        serverId,
        from,
        to,
        limit ? parseInt(limit) : 100
      );
    }
    
    res.json({
      success: true,
      count: metrics.length,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching metric history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metric history',
    });
  }
};

// Récupérer les statistiques moyennes
// Utile pour les résumés et les cartes de statistiques
const getMetricStats = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { hours } = req.query;
    
    // Vérifier que le serveur existe
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }
    
    const stats = await Metric.calculateAverages(
      serverId,
      hours ? parseInt(hours) : 24
    );
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching metric stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metric stats',
    });
  }
};

// Supprimer les anciennes métriques
// Endpoint de maintenance pour nettoyer la base de données
const cleanOldMetrics = async (req, res) => {
  try {
    const { days } = req.query;
    const deletedCount = await Metric.deleteOlderThan(
      days ? parseInt(days) : 30
    );
    
    res.json({
      success: true,
      message: `Deleted ${deletedCount} old metrics`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning old metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean old metrics',
    });
  }
};

// Récupérer le nombre de métriques pour un serveur
const getMetricCount = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    // Vérifier que le serveur existe
    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }
    
    const count = await Metric.countByServerId(serverId);
    
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error counting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to count metrics',
    });
  }
};

module.exports = {
  createMetric,
  getCurrentMetric,
  getMetricHistory,
  getMetricStats,
  cleanOldMetrics,
  getMetricCount,
};
