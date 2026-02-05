// Contrôleur Server - Gère la logique métier des endpoints serveurs
// Ce fichier fait le lien entre les routes et le modèle

const Server = require('../models/Server');
const { validationResult } = require('express-validator');

// Récupérer tous les serveurs
const getAllServers = async (req, res) => {
  try {
    const servers = await Server.findAll();
    res.json({
      success: true,
      count: servers.length,
      data: servers,
    });
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch servers',
    });
  }
};

// Récupérer un serveur spécifique par ID
const getServerById = async (req, res) => {
  try {
    const { id } = req.params;
    const server = await Server.findById(id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }
    
    res.json({
      success: true,
      data: server,
    });
  } catch (error) {
    console.error('Error fetching server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch server',
    });
  }
};

// Enregistrer un nouveau serveur
// Appelé par le script Python collector au démarrage
const registerServer = async (req, res) => {
  try {
    // Valider les données d'entrée
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    
    const { name, hostname, ip_address, os_type } = req.body;
    
    // Vérifier si le serveur existe déjà
    const existingServer = await Server.findByHostname(hostname);
    if (existingServer) {
      // Mettre à jour last_seen et retourner le serveur existant
      const updatedServer = await Server.updateLastSeen(existingServer.id);
      return res.json({
        success: true,
        message: 'Server already registered',
        data: updatedServer,
      });
    }
    
    // Créer le nouveau serveur
    const server = await Server.create({
      name,
      hostname,
      ip_address,
      os_type,
    });
    
    res.status(201).json({
      success: true,
      message: 'Server registered successfully',
      data: server,
    });
  } catch (error) {
    console.error('Error registering server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register server',
    });
  }
};

// Mettre à jour le statut d'un serveur
const updateServerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const server = await Server.findById(id);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }
    
    let updatedServer;
    if (is_active === false) {
      updatedServer = await Server.markInactive(id);
    } else {
      updatedServer = await Server.updateLastSeen(id);
    }
    
    res.json({
      success: true,
      message: 'Server status updated',
      data: updatedServer,
    });
  } catch (error) {
    console.error('Error updating server status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update server status',
    });
  }
};

// Supprimer un serveur
const deleteServer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const server = await Server.findById(id);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }
    
    const deletedServer = await Server.delete(id);
    
    res.json({
      success: true,
      message: 'Server deleted successfully',
      data: deletedServer,
    });
  } catch (error) {
    console.error('Error deleting server:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete server',
    });
  }
};

// Vérifier les serveurs inactifs
// Peut être appelé périodiquement pour marquer les serveurs qui n'envoient plus de métriques
const checkInactiveServers = async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 10;
    const inactiveServers = await Server.findInactive(minutes);
    
    // Marquer les serveurs comme inactifs
    for (const server of inactiveServers) {
      await Server.markInactive(server.id);
    }
    
    res.json({
      success: true,
      message: `Found ${inactiveServers.length} inactive servers`,
      data: inactiveServers,
    });
  } catch (error) {
    console.error('Error checking inactive servers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check inactive servers',
    });
  }
};

module.exports = {
  getAllServers,
  getServerById,
  registerServer,
  updateServerStatus,
  deleteServer,
  checkInactiveServers,
};
