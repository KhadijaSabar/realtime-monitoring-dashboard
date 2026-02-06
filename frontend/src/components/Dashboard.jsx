// Composant Dashboard - Page principale du monitoring
// Ce composant assemble toutes les cartes métriques et graphiques

import React, { useState, useEffect } from 'react';
import MetricCard from './MetricCard';
import RealtimeChart from './RealtimeChart';
import { getServers, getCurrentMetric, getMetricHistory } from '../services/api';
import socketService from '../services/socket';
import './Dashboard.css';

const Dashboard = () => {
  // États
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Charger les serveurs au montage du composant
  useEffect(() => {
    loadServers();
    // Connexion WebSocket
    socketService.connect();
    setWsConnected(socketService.getConnectionStatus());
    
    // Cleanup à la destruction du composant
    return () => {
      if (selectedServer) {
        socketService.unsubscribeFromServer(selectedServer.id);
      }
      socketService.removeAllListeners();
    };
  }, []);

  // Charger les serveurs
  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await getServers();
      if (response.success && response.data.length > 0) {
        setServers(response.data);
        // Sélectionner le premier serveur actif par défaut
        const activeServer = response.data.find(s => s.is_active) || response.data[0];
        setSelectedServer(activeServer);
      } else {
        setError('No servers found. Please register a server first.');
      }
    } catch (err) {
      console.error('Error loading servers:', err);
      setError('Failed to load servers. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Charger les métriques quand un serveur est sélectionné
  useEffect(() => {
    if (!selectedServer) return;

    // Charger les métriques actuelles
    loadCurrentMetrics();
    
    // Charger l'historique
    loadHistory();

    // S'abonner aux updates WebSocket
    socketService.subscribeToServer(selectedServer.id);
    socketService.onMetricsUpdate(handleMetricsUpdate);

    // Cleanup
    return () => {
      socketService.unsubscribeFromServer(selectedServer.id);
      socketService.off('metrics-update');
    };
  }, [selectedServer]);

  // Charger les métriques actuelles
  const loadCurrentMetrics = async () => {
    try {
      const response = await getCurrentMetric(selectedServer.id);
      if (response.success) {
        setCurrentMetrics(response.data);
      }
    } catch (err) {
      console.error('Error loading current metrics:', err);
    }
  };

  // Charger l'historique
  const loadHistory = async () => {
    try {
      const response = await getMetricHistory(selectedServer.id, { hours: 1 });
      if (response.success) {
        setHistoryData(response.data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  // Gérer les nouvelles métriques du WebSocket
  const handleMetricsUpdate = (newMetrics) => {
    if (newMetrics.server_id !== selectedServer?.id) return;

    // Mettre à jour les métriques actuelles
    setCurrentMetrics(newMetrics);

    // Ajouter au graphique historique (garder les 50 dernières entrées)
    setHistoryData(prev => {
      const updated = [...prev, newMetrics];
      return updated.slice(-50);
    });
  };

  // Changer de serveur
  const handleServerChange = (server) => {
    if (selectedServer) {
      socketService.unsubscribeFromServer(selectedServer.id);
    }
    setSelectedServer(server);
  };

  // Interface de chargement
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Interface d'erreur
  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadServers}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">System Monitoring Dashboard</h1>
          <div className="connection-status">
            <span className={`status-dot ${wsConnected ? 'status-active' : 'status-inactive'}`}></span>
            <span className="status-text">
              {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Sélecteur de serveur */}
        {servers.length > 1 && (
          <div className="server-selector">
            {servers.map(server => (
              <button
                key={server.id}
                className={`server-btn ${selectedServer?.id === server.id ? 'active' : ''}`}
                onClick={() => handleServerChange(server)}
              >
                <span className={`status-dot ${server.is_active ? 'status-active' : 'status-inactive'}`}></span>
                {server.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Contenu principal */}
      <main className="dashboard-content">
        {currentMetrics && (
          <>
            {/* Cartes métriques */}
            <div className="metrics-grid">
              <MetricCard
                title="CPU Usage"
                value={currentMetrics.cpu_percent}
                unit="%"
                icon="🖥️"
                threshold={80}
              />
              <MetricCard
                title="RAM Usage"
                value={currentMetrics.ram_percent}
                unit="%"
                max={100}
                icon="💾"
                threshold={80}
              />
              <MetricCard
                title="Disk Usage"
                value={currentMetrics.disk_percent}
                unit="%"
                icon="💿"
                threshold={85}
              />
            </div>

            {/* Graphique temps réel */}
            <RealtimeChart
              data={historyData}
              title="Real-time System Metrics"
              dataKeys={['cpu_percent', 'ram_percent', 'disk_percent']}
              colors={['#06b6d4', '#10b981', '#f59e0b']}
            />

            {/* Informations serveur */}
            <div className="server-info card">
              <h3>Server Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Hostname:</span>
                  <span className="info-value">{selectedServer.hostname}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">IP Address:</span>
                  <span className="info-value">{selectedServer.ip_address}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">OS Type:</span>
                  <span className="info-value">{selectedServer.os_type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Seen:</span>
                  <span className="info-value">
                    {new Date(selectedServer.last_seen).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
