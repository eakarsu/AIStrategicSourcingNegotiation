import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ACTION_COLORS = {
  create: { bg: '#e6f4ea', color: '#0d904f' },
  update: { bg: '#e8f0fe', color: '#1a73e8' },
  delete: { bg: '#fce8e6', color: '#d93025' },
  export: { bg: '#fef7e0', color: '#e37400' },
  view: { bg: '#f0f0f0', color: '#666' },
};

const ENTITY_LABELS = {
  rfp_requests: 'RFP Requests',
  bids: 'Bids',
  cost_models: 'Cost Models',
  negotiation_points: 'Negotiations',
  suppliers: 'Suppliers',
  spend_analytics: 'Spend Analytics',
  savings_tracker: 'Savings',
  risk_assessments: 'Risk Assessments',
  compliance_records: 'Compliance',
  auctions: 'Auctions',
  market_intelligence: 'Market Intel',
  performance_scorecards: 'Scorecards',
  approval_workflows: 'Approvals',
  category_strategies: 'Category Strategy',
  contracts: 'Contracts',
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityLogPage({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({ limit, offset: page * limit });
      if (entityFilter) params.append('entity_type', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      const res = await axios.get(`${API}/api/activity-log?${params}`, { headers });
      setLogs(res.data.logs || res.data);
    } catch (err) { toast.error('Failed to load activity log'); }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [entityFilter, actionFilter, page]);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading activity log...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Activity Log</h1>
        <div className="page-header-actions">
          <select className="form-select" style={{ width: 'auto', minWidth: 180 }} value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(0); }}>
            <option value="">All Entities</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', minWidth: 150 }} value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}>
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="view">View</option>
            <option value="export">Export</option>
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <h3>No activity found</h3>
          <p>Activity will appear here as you use the platform.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const actionStyle = ACTION_COLORS[log.action] || ACTION_COLORS.view;
                return (
                  <tr key={log.id} style={{ cursor: 'default' }}>
                    <td title={new Date(log.created_at).toLocaleString()} style={{ whiteSpace: 'nowrap' }}>
                      {timeAgo(log.created_at)}
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.user_name || 'System'}</td>
                    <td>
                      <span className="status-badge" style={{ background: actionStyle.bg, color: actionStyle.color }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{ENTITY_LABELS[log.entity_type] || log.entity_type}</td>
                    <td style={{ color: '#5f6368', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
        <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span style={{ padding: '6px 12px', fontSize: 14, color: '#5f6368' }}>Page {page + 1}</span>
        <button className="btn btn-secondary btn-sm" disabled={logs.length < limit} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}
