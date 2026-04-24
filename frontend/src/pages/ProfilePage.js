import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ROLE_LABELS = {
  procurement_specialist: 'Procurement Specialist',
  procurement_manager: 'Procurement Manager',
  senior_buyer: 'Senior Buyer',
  admin: 'Administrator',
};

export default function ProfilePage({ token, user, onUserUpdate }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/api/auth/me`, { headers });
        setProfile(res.data);
        setEditName(res.data.name);
      } catch (err) { toast.error('Failed to load profile'); }
      setLoading(false);
    };
    const fetchActivity = async () => {
      try {
        const res = await axios.get(`${API}/api/activity-log?limit=10`, { headers });
        setRecentActivity(res.data.logs || res.data);
      } catch { /* silent */ }
    };
    fetchProfile();
    fetchActivity();
  }, []);

  const handleUpdateName = async () => {
    if (!editName.trim()) return;
    try {
      const res = await axios.put(`${API}/api/auth/profile`, { name: editName }, { headers });
      setProfile(res.data);
      setEditingName(false);
      if (onUserUpdate) onUserUpdate(res.data);
      toast.success('Name updated successfully');
    } catch (err) { toast.error('Failed to update name'); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setChangingPassword(true);
    try {
      await axios.post(`${API}/api/auth/change-password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }, { headers });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    }
    setChangingPassword(false);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading profile...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Profile Card */}
        <div className="detail-container">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
              color: 'white', fontSize: 32, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              {profile?.name?.charAt(0)?.toUpperCase()}
            </div>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} style={{ maxWidth: 200, textAlign: 'center' }} />
                <button className="btn btn-primary btn-sm" onClick={handleUpdateName}>Save</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditingName(false); setEditName(profile.name); }}>Cancel</button>
              </div>
            ) : (
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                {profile?.name}
                <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#1a73e8', marginLeft: 8 }}>Edit</button>
              </h2>
            )}
            <span className="status-badge" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
              {ROLE_LABELS[profile?.role] || profile?.role}
            </span>
          </div>

          <div className="detail-grid">
            <div className="detail-field">
              <label>Email</label>
              <div className="value">{profile?.email}</div>
            </div>
            <div className="detail-field">
              <label>Role</label>
              <div className="value">{ROLE_LABELS[profile?.role] || profile?.role}</div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="detail-container">
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="form-input"
                value={passwords.currentPassword}
                onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                className="form-input"
                value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={passwords.confirmPassword}
                onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <div className="empty-state">
            <p>No recent activity recorded.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map(log => (
                  <tr key={log.id} style={{ cursor: 'default' }}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td>
                      <span className="status-badge" style={{
                        background: log.action === 'create' ? '#e6f4ea' : log.action === 'update' ? '#e8f0fe' : log.action === 'delete' ? '#fce8e6' : '#f0f0f0',
                        color: log.action === 'create' ? '#0d904f' : log.action === 'update' ? '#1a73e8' : log.action === 'delete' ? '#d93025' : '#666',
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entity_type}</td>
                    <td style={{ color: '#5f6368' }}>{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
