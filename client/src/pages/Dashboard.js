import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ features }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">AI Music Studio</h1>
        <p className="dashboard-subtitle">Create, remix, analyze, and master music with the power of AI</p>
      </div>

      <div className="features-grid">
        {features.map(f => (
          <div
            key={f.key}
            className="feature-card"
            style={{ '--card-color': f.color }}
            onClick={() => navigate(`/${f.key}`)}
          >
            <div className="feature-card-icon">{f.icon}</div>
            <div className="feature-card-title">{f.label}</div>
            <div className="feature-card-desc">{f.description}</div>
            <div className="feature-card-arrow">→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
