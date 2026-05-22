import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function colorFor(score) {
  // 0 -> green, 50 -> yellow, 100 -> red
  if (score >= 75) return '#c5221f';
  if (score >= 50) return '#f9ab00';
  if (score >= 25) return '#fbbc04';
  return '#34a853';
}

export default function SupplierRiskHeatmap({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/api/custom-views/supplier-risk-heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(r => setData(r.data))
      .catch(e => setError(e.message));
  }, [token]);

  if (error) return <div style={{ color: '#d93025' }}>Error: {error}</div>;
  if (!data) return <div>Loading risk heatmap...</div>;

  const lookup = {};
  data.cells.forEach(c => {
    lookup[`${c.supplier}|${c.risk_type}`] = c;
  });

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 style={{ marginTop: 0, color: '#202124' }}>Supplier Risk Heatmap</h3>
      <p style={{ color: '#5f6368', fontSize: 13, marginTop: 4 }}>
        Suppliers x risk types ({data.suppliers.length} x {data.risk_types.length})
      </p>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 6, fontSize: 12, color: '#5f6368' }}>Supplier</th>
              {data.risk_types.map(rt => (
                <th key={rt} style={{ padding: 6, fontSize: 12, color: '#5f6368' }}>{rt}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.suppliers.map(s => (
              <tr key={s}>
                <td style={{ padding: 6, fontSize: 13, color: '#202124', whiteSpace: 'nowrap' }}>{s}</td>
                {data.risk_types.map(rt => {
                  const cell = lookup[`${s}|${rt}`];
                  if (!cell) return <td key={rt} />;
                  return (
                    <td
                      key={rt}
                      data-testid="risk-cell"
                      title={`${s} / ${rt}: ${cell.score} (${cell.severity})`}
                      style={{
                        background: colorFor(cell.score),
                        color: cell.score >= 50 ? '#fff' : '#202124',
                        padding: '10px 14px',
                        textAlign: 'center',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        minWidth: 48,
                      }}
                    >
                      {cell.score}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12, color: '#5f6368' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#34a853', marginRight: 4 }} />low</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fbbc04', marginRight: 4 }} />medium</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f9ab00', marginRight: 4 }} />high</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#c5221f', marginRight: 4 }} />critical</span>
      </div>
    </div>
  );
}
