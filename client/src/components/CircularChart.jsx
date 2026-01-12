// ============================================
// COMPOSANT GRAPHIQUE CIRCULAIRE
// ============================================
// Affiche un graphique circulaire pour les statistiques

import React from 'react';
import './CircularChart.css';

function CircularChart({ value, max, color, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? (value / max) : 0;
  const offset = circumference - (percentage * circumference);

  return (
    <div className="circular-chart-container">
      <svg width={size} height={size} className="circular-chart">
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        {/* Cercle de valeur */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="chart-circle"
        />
      </svg>
      <div className="chart-value">
        <span className="chart-number">{value}</span>
      </div>
    </div>
  );
}

export default CircularChart;

