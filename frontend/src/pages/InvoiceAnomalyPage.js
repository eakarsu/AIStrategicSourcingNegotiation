import FormattedAIReport from "../components/FormattedAIReport";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function InvoiceAnomalyPage({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [vendorName, setVendorName] = useState('');
  const [lookbackDays, setLookbackDays] = useState(180);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorStatus, setVendorStatus] = useState('Loading vendors from spend records…');

  useEffect(() => {
    let active = true;
    axios.get(`${API}/api/spend-analytics`, { headers }).then(({ data }) => {
      if (!active) return;
      const names = [...new Set((Array.isArray(data) ? data : []).map((item) => item.vendor_name?.trim()).filter(Boolean))];
      setVendors(names);
      setVendorStatus(names.length ? '' : 'No vendor names are available in spend records. Add or select a genuine vendor before using an example.');
    }).catch(() => { if (active) setVendorStatus('Spend records could not be loaded. Select a verified vendor before using an example.'); });
    return () => { active = false; };
  }, [token]);

  const fillScenario = (days, index) => {
    const vendor = vendors[index % vendors.length];
    if (!vendor) return;
    setVendorName((current) => current || vendor);
    setLookbackDays(days);
  };

  const runScan = async () => {
    setLoading(true);
    try {
      const payload = {
        vendor_name: vendorName || undefined,
        lookback_days: Number(lookbackDays) || 180,
      };
      const res = await axios.post(`${API}/api/ai/invoice-anomaly`, payload, { headers });
      setResult(res.data.parsed ?? res.data);
      toast.success('Anomaly scan complete');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || 'Scan failed';
      toast.error(status === 503 ? `AI not configured: ${msg}` : msg);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Invoice Anomaly Detection</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Detect duplicates, price spikes, off-cycle billing, split invoices, and other AP forensic anomalies.
      </p>

      <div className="ai-preset-bar"><div><strong>Example scenarios</strong><p>Each example fills the lookback period and selects a vendor from spend records. Your selected vendor stays selected. Review before running.</p>{vendorStatus && <p role="status">{vendorStatus}</p>}</div><div className="ai-actions">{[90, 365, 730].map((days, index) => <button key={days} type="button" className="btn btn-secondary" disabled={loading || !vendors.length} onClick={() => fillScenario(days, index)}>Vendor: {days} days</button>)}</div></div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Vendor name (optional)</label>
          <input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)}
            placeholder="leave blank to scan all vendors"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Lookback (days)</label>
          <input type="number" min={7} max={730} value={lookbackDays} onChange={(e) => setLookbackDays(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </div>
      </div>

      <button
        onClick={runScan}
        disabled={loading}
        style={{
          background: loading ? '#9ca3af' : '#7c3aed',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '12px 24px', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem', fontWeight: 600, marginBottom: '2rem'
        }}
      >
        {loading ? 'Scanning...' : 'Run Anomaly Scan'}
      </button>

      {result !== null && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Anomalies</h2>
          <FormattedAIReport response={result} />
        </div>
      )}
    </div>
  );
}
