import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const TYPE_CONFIG = {
  info: { icon: 'i', bg: '#e8f0fe', color: '#1a73e8', border: '#1a73e8' },
  warning: { icon: '!', bg: '#fef7e0', color: '#e37400', border: '#e37400' },
  success: { icon: '\u2713', bg: '#e6f4ea', color: '#0d904f', border: '#0d904f' },
  error: { icon: '\u2717', bg: '#fce8e6', color: '#d93025', border: '#d93025' },
};

function groupByDate(notifications) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = { Today: [], Yesterday: [], Earlier: [] };
  notifications.forEach(n => {
    const d = new Date(n.created_at);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups.Today.push(n);
    else if (d.getTime() === yesterday.getTime()) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });
  return groups;
}

export default function NotificationsPage({ token }) {
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/api/notifications`, { headers });
      setNotifications(res.data);
    } catch (err) { toast.error('Failed to load notifications'); }
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (notification) => {
    if (!notification.is_read) {
      try {
        await axios.put(`${API}/api/notifications/${notification.id}/read`, {}, { headers });
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      } catch (err) { /* silent */ }
    }
    if (notification.link) navigate(notification.link);
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/api/notifications/read-all`, {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) { toast.error('Failed to mark all as read'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading notifications...</span></div>;

  const groups = groupByDate(notifications);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          {unreadCount > 0 && <span style={{ fontSize: 14, color: '#5f6368', marginLeft: 8 }}>{unreadCount} unread</span>}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>Mark All as Read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        Object.entries(groups).map(([label, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={label} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#5f6368', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>{label}</h3>
              {items.map(n => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                return (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n)}
                    style={{
                      background: 'white',
                      borderRadius: 12,
                      padding: '16px 20px',
                      marginBottom: 8,
                      border: '1px solid #e0e0e0',
                      borderLeft: !n.is_read ? `4px solid ${config.border}` : '4px solid transparent',
                      cursor: n.link ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      opacity: n.is_read ? 0.7 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: config.bg, color: config.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 16, flexShrink: 0,
                    }}>
                      {config.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{n.title}</div>
                      <div style={{ fontSize: 13, color: '#5f6368', lineHeight: 1.5 }}>{n.message}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#80868b', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
