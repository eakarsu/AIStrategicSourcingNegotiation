import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function DeliveryRiskPage({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [supplierId, setSupplierId] = useState('');
  const [horizonDays, setHorizonDays] = useState(90);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const payload = {
        ...(supplierId ? { supplier_id: Number(supplierId) } : {}),
        horizon_days: Number(horizonDays) || 90,
      };
      const res = await axios.post(`${API}/api/ai/delivery-risk`, payload, { headers });
      setResult(res.data.parsed || res.data);
      toast.success('Risk prediction complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Delivery & Quality Risk Predictor</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        AI predicts delivery and quality risk for a supplier (or your full base) over a forward horizon.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Supplier ID (optional)</label>
          <input type="number" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
            placeholder="leave blank for portfolio view"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Horizon (days)</label>
          <input type="number" min={7} max={365} value={horizonDays} onChange={(e) => setHorizonDays(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
      </div>

      <button
        onClick={runAnalysis}
        disabled={loading}
        style={{
          background: loading ? '#9ca3af' : '#dc2626',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '12px 24px', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem', fontWeight: 600, marginBottom: '2rem'
        }}
      >
        {loading ? 'Predicting...' : 'Run Risk Prediction'}
      </button>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Risk Forecast</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#374151', background: '#f9fafb', padding: 14, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
