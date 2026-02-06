// Composant MetricCard - Affiche une carte pour une métrique (CPU, RAM, ou Disk)
// Ce composant montre la valeur actuelle avec une barre de progression et un indicateur de statut

import React from 'react';
import './MetricCard.css';

const MetricCard = ({ title, value, unit, max, icon, threshold = 80 }) => {
  // Calculer le pourcentage pour la barre de progression
  const percentage = max ? (value / max) * 100 : value;
  
  // Déterminer le statut (normal, warning, danger) basé sur le seuil
  const getStatus = () => {
    if (percentage >= threshold) return 'danger';
    if (percentage >= threshold * 0.75) return 'warning';
    return 'normal';
  };

  const status = getStatus();

  return (
    <div className={`metric-card fade-in`}>
      {/* Header avec icône et titre */}
      <div className="metric-header">
        {icon && <span className="metric-icon">{icon}</span>}
        <h3 className="metric-title">{title}</h3>
      </div>

      {/* Valeur principale */}
      <div className="metric-value">
        <span className="value-number">{value.toFixed(1)}</span>
        <span className="value-unit">{unit}</span>
      </div>

      {/* Barre de progression */}
      <div className="progress-bar">
        <div
          className={`progress-fill progress-${status}`}
          style={{ width: `${percentage}%` }}
        >
          <span className="progress-percentage">{percentage.toFixed(0)}%</span>
        </div>
      </div>

      {/* Indicateur de statut */}
      <div className="metric-status">
        <span className={`status-dot status-${status}`}></span>
        <span className="status-text">
          {status === 'danger' && 'Critical'}
          {status === 'warning' && 'Warning'}
          {status === 'normal' && 'Normal'}
        </span>
      </div>
    </div>
  );
};

export default MetricCard;
