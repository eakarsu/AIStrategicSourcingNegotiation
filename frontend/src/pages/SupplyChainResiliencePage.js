import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function SupplyChainResiliencePage({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [commodity, setCommodity] = useState('');
  const [region, setRegion] = useState('');
  const [horizon, setHorizon] = useState(12);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const payload = {
        commodity: commodity || undefined,
        region: region || undefined,
        scenario_horizon_months: Number(horizon) || 12,
      };
      const res = await axios.post(`${API}/api/ai/supply-chain-resilience`, payload, { headers });
      setResult(res.data.parsed || res.data);
      toast.success('Resilience map generated');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || 'Analysis failed';
      toast.error(status === 503 ? `AI not configured: ${msg}` : msg);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Supply Chain Resilience Map</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Map single-source dependencies, geographic concentration, and shock scenarios; recommend redundancy actions.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Commodity (optional)</label>
          <input type="text" value={commodity} onChange={(e) => setCommodity(e.target.value)}
            placeholder="e.g. semiconductors"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Region focus</label>
          <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. APAC"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Scenario horizon (months)</label>
          <input type="number" min={1} max={60} value={horizon} onChange={(e) => setHorizon(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
      </div>

      <button
        onClick={runAnalysis}
        disabled={loading}
        style={{
          background: loading ? '#9ca3af' : '#2563eb',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '12px 24px', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem', fontWeight: 600, marginBottom: '2rem'
        }}
      >
        {loading ? 'Mapping...' : 'Run Resilience Map'}
      </button>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Resilience Map</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#374151', background: '#f9fafb', padding: 14, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
