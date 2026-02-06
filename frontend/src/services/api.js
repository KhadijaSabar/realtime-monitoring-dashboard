// Service API - Gère toutes les requêtes HTTP vers le backend
// Ce fichier centralise toutes les appels API

import axios from 'axios';

// URL de base du backend (depuis variables d'environnement)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Créer une instance axios avec configuration par défaut
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 secondes timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour logger les requêtes (utile pour debug)
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour logger les réponses et gérer les erreurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// SERVEURS

// Récupérer tous les serveurs
export const getServers = async () => {
  const response = await api.get('/api/servers');
  return response.data;
};

// Récupérer un serveur spécifique
export const getServer = async (serverId) => {
  const response = await api.get(`/api/servers/${serverId}`);
  return response.data;
};

// Enregistrer un nouveau serveur
export const registerServer = async (serverData) => {
  const response = await api.post('/api/servers/register', serverData);
  return response.data;
};

// MÉTRIQUES

// Récupérer la métrique actuelle d'un serveur
export const getCurrentMetric = async (serverId) => {
  const response = await api.get(`/api/metrics/current/${serverId}`);
  return response.data;
};

// Récupérer l'historique des métriques
export const getMetricHistory = async (serverId, params = {}) => {
  const response = await api.get(`/api/metrics/history/${serverId}`, {
    params: {
      hours: params.hours || 24,
      limit: params.limit || 100,
      from: params.from,
      to: params.to,
    },
  });
  return response.data;
};

// Récupérer les statistiques moyennes
export const getMetricStats = async (serverId, hours = 24) => {
  const response = await api.get(`/api/metrics/stats/${serverId}`, {
    params: { hours },
  });
  return response.data;
};

// Envoyer une nouvelle métrique (utilisé par le collector, rarement par le frontend)
export const sendMetric = async (metricData) => {
  const response = await api.post('/api/metrics', metricData);
  return response.data;
};

// HEALTH CHECK

// Vérifier que le backend est accessible
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Exporter l'instance axios pour usage direct si nécessaire
export default api;
