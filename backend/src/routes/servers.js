// Routes pour les serveurs
// Définit tous les endpoints liés aux serveurs

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const serverController = require('../controllers/serverController');

// Validation pour l'enregistrement d'un serveur
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Server name is required')
    .isLength({ max: 100 })
    .withMessage('Server name must be less than 100 characters'),
  body('hostname')
    .trim()
    .notEmpty()
    .withMessage('Hostname is required')
    .isLength({ max: 255 })
    .withMessage('Hostname must be less than 255 characters'),
  body('ip_address')
    .optional()
    .trim()
    .isIP()
    .withMessage('Invalid IP address format'),
  body('os_type')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('OS type must be less than 50 characters'),
];

// Routes

// GET /api/servers - Récupérer tous les serveurs
router.get('/', serverController.getAllServers);

// GET /api/servers/inactive - Vérifier les serveurs inactifs
router.get('/inactive', serverController.checkInactiveServers);

// GET /api/servers/:id - Récupérer un serveur spécifique
router.get('/:id', serverController.getServerById);

// POST /api/servers/register - Enregistrer un nouveau serveur
router.post('/register', registerValidation, serverController.registerServer);

// PATCH /api/servers/:id/status - Mettre à jour le statut d'un serveur
router.patch('/:id/status', serverController.updateServerStatus);

// DELETE /api/servers/:id - Supprimer un serveur
router.delete('/:id', serverController.deleteServer);

module.exports = router;
