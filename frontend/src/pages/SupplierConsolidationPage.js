import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function SupplierConsolidationPage({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/ai/supplier-consolidation`, {}, { headers });
      setResult(res.data.parsed || res.data);
      toast.success('Consolidation analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Supplier Consolidation Advisor</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        AI analyzes your spend data and recommends supplier consolidations for maximum savings.
      </p>

      <button
        onClick={runAnalysis}
        disabled={loading}
        style={{
          background: loading ? '#9ca3af' : '#7c3aed',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '12px 24px', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem', fontWeight: 600, marginBottom: '2rem'
        }}
      >
        {loading ? 'Analyzing spend data...' : 'Run AI Consolidation Analysis'}
      </button>

      {result && (
        <div>
          {result.total_projected_savings !== undefined && (
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem'
            }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.25rem' }}>Total Projected Savings</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                ${Number(result.total_projected_savings).toLocaleString()}
              </div>
              {result.implementation_timeline_months && (
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                  Timeline: {result.implementation_timeline_months} months
                </div>
              )}
            </div>
          )}

          {result.consolidations && result.consolidations.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
                Consolidation Recommendations ({result.consolidations.length})
              </h2>
              {result.consolidations.map((c, i) => (
                <div key={i} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  background: '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        Consolidate to: <span style={{ color: '#7c3aed' }}>{c.to_vendor}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        From: {Array.isArray(c.from_vendors) ? c.from_vendors.join(', ') : c.from_vendors}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>
                        ${Number(c.projected_savings).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>projected savings</div>
                    </div>
                  </div>
                  {c.rationale && (
                    <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>{c.rationale}</p>
                  )}
                  {c.risk_level && (
                    <span style={{
                      background: c.risk_level === 'low' ? '#d1fae5' : c.risk_level === 'medium' ? '#fef3c7' : '#fee2e2',
                      color: c.risk_level === 'low' ? '#065f46' : c.risk_level === 'medium' ? '#92400e' : '#991b1b',
                      padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                    }}>
                      {c.risk_level.toUpperCase()} RISK
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.raw && !result.consolidations && (
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '1.5rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
              {result.raw}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
