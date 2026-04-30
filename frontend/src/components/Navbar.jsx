import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar glass-panel">
      <div className="logo">
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
          Project<span style={{ color: 'var(--primary-color)' }}>Hub</span>
        </Link>
      </div>
      <div className="nav-links">
        <Link to="/projects">Projects</Link>
        <span style={{ color: 'var(--text-secondary)' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', 
            background: 'var(--primary-color)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '600'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '0.9rem' }}>{user?.name} ({user?.role})</span>
        </span>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
