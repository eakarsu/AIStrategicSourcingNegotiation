import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Navbar({ user, onLogout, token }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const fetchUnread = async () => {
      try {
        const res = await axios.get(`${API}/api/notifications/unread-count`, { headers });
        setUnreadCount(res.data.count);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <svg viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.2)"/>
          <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" fill="white" opacity="0.9"/>
          <path d="M16 8V24M8 12L24 20M24 12L8 20" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
        </svg>
        AI Strategic Sourcing
      </Link>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ flex: '0 1 400px', margin: '0 24px' }}>
        <input
          type="text"
          placeholder="Search suppliers, RFPs, contracts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </form>

      <div className="navbar-right">
        {/* Quick Links */}
        <Link to="/export" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13, fontWeight: 500, padding: '6px 10px' }}>
          Export
        </Link>
        <Link to="/activity-log" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13, fontWeight: 500, padding: '6px 10px' }}>
          Activity
        </Link>

        {/* Notifications Bell */}
        <div
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative', cursor: 'pointer', padding: '6px 10px' }}
        >
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>&#128276;</span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 4,
              background: '#d93025', color: 'white',
              borderRadius: '50%', width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <span
            className="navbar-user"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {user?.name} &#9662;
          </span>
          {showUserMenu && (
            <div
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                background: 'white', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                border: '1px solid #e0e0e0', overflow: 'hidden', minWidth: 180, zIndex: 200,
              }}
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#202124' }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: '#5f6368' }}>{user?.role}</div>
              </div>
              <div
                onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: '#202124' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                My Profile
              </div>
              <div
                onClick={() => { navigate('/export'); setShowUserMenu(false); }}
                style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: '#202124' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Export Data
              </div>
              <div
                onClick={() => { onLogout(); setShowUserMenu(false); }}
                style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, color: '#d93025', borderTop: '1px solid #f0f0f0' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fce8e6'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
