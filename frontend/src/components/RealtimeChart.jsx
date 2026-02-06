// Composant RealtimeChart - Affiche un graphique temps réel avec Recharts
// Ce composant montre l'évolution des métriques sur les dernières minutes

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import './RealtimeChart.css';

const RealtimeChart = ({ data, title, dataKeys, colors }) => {
  // Formatter pour l'axe X (affiche l'heure)
  const formatXAxis = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  // Formatter pour le tooltip
  const formatTooltip = (value, name) => {
    return [`${value.toFixed(1)}%`, name];
  };

  // Custom tooltip avec plus de détails
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">
            {format(new Date(payload[0].payload.recorded_at), 'HH:mm:ss')}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="realtime-chart card">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span className="live-text">LIVE</span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 182, 212, 0.1)" />
            <XAxis
              dataKey="recorded_at"
              tickFormatter={formatXAxis}
              stroke="#94a3b8"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94a3b8"
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.875rem' }}
              iconType="line"
            />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.length === 0 && (
        <div className="no-data">
          <p>Waiting for data...</p>
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

// Valeurs par défaut
RealtimeChart.defaultProps = {
  data: [],
  title: 'Real-time Metrics',
  dataKeys: ['cpu_percent', 'ram_percent', 'disk_percent'],
  colors: ['#06b6d4', '#10b981', '#f59e0b'],
};

export default RealtimeChart;
