import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function SpendByCategoryChart({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/api/custom-views/spend-by-category`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(r => setData(r.data))
      .catch(e => setError(e.message));
  }, [token]);

  if (error) return <div style={{ color: '#d93025' }}>Error: {error}</div>;
  if (!data) return <div>Loading spend by category...</div>;

  const max = Math.max(...data.categories.map(c => Number(c.total_spend) || 0), 1);
  const colors = ['#1a73e8', '#188038', '#f9ab00', '#d93025', '#9334e6', '#129eaf', '#ff6d00', '#5f6368'];

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 style={{ marginTop: 0, color: '#202124' }}>Spend by Category</h3>
      <p style={{ color: '#5f6368', fontSize: 13, marginTop: 4 }}>
        Total: ${Number(data.total_spend).toLocaleString()} across {data.count} categories
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {data.categories.map((c, i) => {
          const pct = (Number(c.total_spend) / max) * 100;
          return (
            <div key={c.category + i} data-testid="spend-bar">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 500, color: '#202124' }}>{c.category}</span>
                <span style={{ color: '#5f6368' }}>
                  ${Number(c.total_spend).toLocaleString()} ({c.transactions} txns)
                </span>
              </div>
              <div style={{ background: '#f1f3f4', borderRadius: 6, height: 18, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: colors[i % colors.length],
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
