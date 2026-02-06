// Service WebSocket - Gère la connexion Socket.io pour les updates temps réel
// Ce fichier gère toute la communication WebSocket avec le backend

import { io } from 'socket.io-client';

// URL du serveur WebSocket
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map(); // Stocke les listeners pour cleanup
  }

  // Connexion au serveur WebSocket
  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket:', WS_URL);
    
    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'], // Essayer WebSocket d'abord, fallback sur polling
      reconnection: true, // Reconnexion automatique
      reconnectionDelay: 1000, // Délai avant reconnexion
      reconnectionAttempts: 5, // Nombre de tentatives
    });

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
    });

    return this.socket;
  }

  // Déconnexion du serveur WebSocket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // S'abonner aux updates d'un serveur
  subscribeToServer(serverId) {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.');
      return;
    }

    console.log(`Subscribing to server ${serverId}`);
    this.socket.emit('join-server', { serverId });
  }

  // Se désabonner des updates d'un serveur
  unsubscribeFromServer(serverId) {
    if (!this.socket) {
      return;
    }

    console.log(`Unsubscribing from server ${serverId}`);
    this.socket.emit('leave-server', { serverId });
  }

  // Écouter les mises à jour de métriques
  onMetricsUpdate(callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    const listener = (data) => {
      console.log('Metrics update received:', data);
      callback(data);
    };

    this.socket.on('metrics-update', listener);
    this.listeners.set('metrics-update', listener);
  }

  // Écouter les changements de statut serveur
  onServerStatus(callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    const listener = (data) => {
      console.log('Server status update:', data);
      callback(data);
    };

    this.socket.on('server-status', listener);
    this.listeners.set('server-status', listener);
  }

  // Écouter les alertes
  onAlert(callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    const listener = (data) => {
      console.log('Alert received:', data);
      callback(data);
    };

    this.socket.on('alert', listener);
    this.listeners.set('alert', listener);
  }

  // Arrêter d'écouter un événement spécifique
  off(eventName) {
    if (!this.socket) {
      return;
    }

    const listener = this.listeners.get(eventName);
    if (listener) {
      this.socket.off(eventName, listener);
      this.listeners.delete(eventName);
    }
  }

  // Arrêter d'écouter tous les événements
  removeAllListeners() {
    if (!this.socket) {
      return;
    }

    this.listeners.forEach((listener, eventName) => {
      this.socket.off(eventName, listener);
    });
    this.listeners.clear();
  }

  // Obtenir le statut de connexion
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Créer une instance unique (singleton)
const socketService = new SocketService();

export default socketService;
