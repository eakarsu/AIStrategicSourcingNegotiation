import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const EXPORT_ENTITIES = [
  { key: 'rfp_requests', label: 'RFP Requests', icon: '\uD83D\uDCCB', color: '#1a73e8' },
  { key: 'bids', label: 'Bids', icon: '\uD83D\uDCCA', color: '#0d904f' },
  { key: 'cost_models', label: 'Cost Models', icon: '\uD83D\uDCB0', color: '#e37400' },
  { key: 'negotiation_points', label: 'Negotiation Points', icon: '\uD83E\uDD1D', color: '#7c3aed' },
  { key: 'contracts', label: 'Contracts', icon: '\uD83D\uDCDD', color: '#d93025' },
  { key: 'suppliers', label: 'Suppliers', icon: '\uD83C\uDFED', color: '#0891b2' },
  { key: 'spend_analytics', label: 'Spend Analytics', icon: '\uD83D\uDCC8', color: '#059669' },
  { key: 'savings_tracker', label: 'Savings Tracker', icon: '\uD83D\uDCB5', color: '#16a34a' },
  { key: 'risk_assessments', label: 'Risk Assessments', icon: '\u26A0\uFE0F', color: '#dc2626' },
  { key: 'compliance_records', label: 'Compliance Records', icon: '\u2705', color: '#4f46e5' },
  { key: 'auctions', label: 'Auctions', icon: '\uD83D\uDD28', color: '#b45309' },
  { key: 'market_intelligence', label: 'Market Intelligence', icon: '\uD83C\uDF0D', color: '#0d9488' },
  { key: 'performance_scorecards', label: 'Performance Scorecards', icon: '\uD83C\uDFC6', color: '#ca8a04' },
  { key: 'approval_workflows', label: 'Approval Workflows', icon: '\u270D\uFE0F', color: '#9333ea' },
  { key: 'category_strategies', label: 'Category Strategies', icon: '\uD83D\uDDC2\uFE0F', color: '#374151' },
];

export default function ExportPage({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [exporting, setExporting] = useState(null);

  const handleExport = async (entity) => {
    setExporting(entity.key);
    try {
      const res = await axios.get(`${API}/api/export/${entity.key}`, {
        headers,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${entity.key}_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${entity.label} exported successfully`);

      // Log the export activity
      try {
        await axios.post(`${API}/api/activity-log`, {
          entity_type: entity.key,
          action: 'export',
          details: `Exported ${entity.label} to CSV`,
        }, { headers });
      } catch { /* silent */ }
    } catch (err) {
      toast.error(`Failed to export ${entity.label}`);
    }
    setExporting(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Export Data</h1>
      </div>
      <p style={{ color: '#5f6368', marginBottom: 24, fontSize: 15 }}>
        Download your procurement data as CSV files. Click on any module below to export.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {EXPORT_ENTITIES.map(entity => (
          <div
            key={entity.key}
            onClick={() => !exporting && handleExport(entity)}
            style={{
              background: 'white',
              borderRadius: 12,
              padding: '20px 24px',
              border: '1px solid #e0e0e0',
              cursor: exporting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: 'all 0.2s',
              opacity: exporting && exporting !== entity.key ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!exporting) { e.currentTarget.style.borderColor = entity.color; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: entity.color + '15', color: entity.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              {entity.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{entity.label}</div>
              <div style={{ fontSize: 12, color: '#80868b' }}>Export as CSV</div>
            </div>
            {exporting === entity.key ? (
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
            ) : (
              <span style={{ fontSize: 20, color: '#80868b' }}>\u2913</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
