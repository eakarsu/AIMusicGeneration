import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout, features }) {
  const location = useLocation();

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="sidebar-logo">AI Music Gen</div>
          <div className="sidebar-subtitle">Powered by AI</div>
        </Link>
      </div>

      <div className="sidebar-nav">
        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Dashboard</span>
        </Link>

        {features.map(f => (
          <Link
            key={f.key}
            to={`/${f.key}`}
            className={`nav-item ${location.pathname === `/${f.key}` ? 'active' : ''}`}
          >
            <span className="nav-icon">{f.icon}</span>
            <span className="nav-label">{f.label}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-email">{user?.email || ''}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>Sign Out</button>
      </div>
    </nav>
  );
}

export default Navbar;
