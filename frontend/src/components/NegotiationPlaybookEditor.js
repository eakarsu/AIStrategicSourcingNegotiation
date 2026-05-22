import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyTactic = { name: '', category: 'General', target_price: 0, leverage: 'volume', description: '' };

export default function NegotiationPlaybookEditor({ token }) {
  const [tactics, setTactics] = useState([]);
  const [form, setForm] = useState(emptyTactic);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const load = () => {
    axios
      .get(`${API}/api/custom-views/playbook-tactics`, { headers })
      .then(r => setTactics(r.data.tactics || []))
      .catch(e => setStatus('load error: ' + e.message));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  const submit = async () => {
    try {
      if (!form.name) { setStatus('name required'); return; }
      if (editingId) {
        await axios.put(`${API}/api/custom-views/playbook-tactics/${editingId}`, form, { headers });
        setStatus('updated tactic ' + editingId);
      } else {
        const r = await axios.post(`${API}/api/custom-views/playbook-tactics`, form, { headers });
        setStatus('created tactic ' + r.data.id);
      }
      setForm(emptyTactic);
      setEditingId(null);
      load();
    } catch (e) {
      setStatus('save error: ' + e.message);
    }
  };

  const edit = (t) => {
    setEditingId(t.id);
    setForm({ name: t.name, category: t.category, target_price: t.target_price, leverage: t.leverage, description: t.description });
  };

  const del = async (id) => {
    try {
      await axios.delete(`${API}/api/custom-views/playbook-tactics/${id}`, { headers });
      setStatus('deleted tactic ' + id);
      load();
    } catch (e) {
      setStatus('delete error: ' + e.message);
    }
  };

  const input = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #dadce0',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
  };
  const label = { display: 'block', fontSize: 12, color: '#5f6368', marginBottom: 4, marginTop: 8 };

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 style={{ marginTop: 0, color: '#202124' }}>Negotiation Playbook Editor</h3>
      <p style={{ color: '#5f6368', fontSize: 13, marginTop: 4 }}>
        CRUD tactics with target prices &amp; leverage levers.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={label}>Tactic name</label>
          <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Anchor High" />
        </div>
        <div>
          <label style={label}>Category</label>
          <input style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        </div>
        <div>
          <label style={label}>Target price (USD)</label>
          <input style={input} type="number" value={form.target_price} onChange={e => setForm({ ...form, target_price: e.target.value })} />
        </div>
        <div>
          <label style={label}>Leverage</label>
          <select style={input} value={form.leverage} onChange={e => setForm({ ...form, leverage: e.target.value })}>
            <option value="volume">volume</option>
            <option value="multi-year">multi-year</option>
            <option value="alternate supplier">alternate supplier</option>
            <option value="cash flow">cash flow</option>
            <option value="bundling">bundling</option>
          </select>
        </div>
      </div>
      <label style={label}>Description</label>
      <textarea rows={3} style={input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={submit}
          data-testid="tactic-save-btn"
          style={{ background: '#1a73e8', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
        >
          {editingId ? 'Update tactic' : 'Add tactic'}
        </button>
        {editingId && (
          <button
            onClick={() => { setEditingId(null); setForm(emptyTactic); }}
            style={{ background: '#fff', color: '#202124', border: '1px solid #dadce0', padding: '10px 16px', borderRadius: 6, cursor: 'pointer' }}
          >
            Cancel
          </button>
        )}
        <span style={{ color: '#5f6368', fontSize: 12 }}>{status}</span>
      </div>

      <div style={{ marginTop: 20, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: 8, fontSize: 12, color: '#5f6368' }}>ID</th>
              <th style={{ textAlign: 'left', padding: 8, fontSize: 12, color: '#5f6368' }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8, fontSize: 12, color: '#5f6368' }}>Category</th>
              <th style={{ textAlign: 'right', padding: 8, fontSize: 12, color: '#5f6368' }}>Target $</th>
              <th style={{ textAlign: 'left', padding: 8, fontSize: 12, color: '#5f6368' }}>Leverage</th>
              <th style={{ textAlign: 'left', padding: 8, fontSize: 12, color: '#5f6368' }}>Description</th>
              <th style={{ padding: 8 }} />
            </tr>
          </thead>
          <tbody>
            {tactics.map(t => (
              <tr key={t.id} data-testid="tactic-row" style={{ borderBottom: '1px solid #f1f3f4' }}>
                <td style={{ padding: 8, fontSize: 13 }}>{t.id}</td>
                <td style={{ padding: 8, fontSize: 13, fontWeight: 500 }}>{t.name}</td>
                <td style={{ padding: 8, fontSize: 13 }}>{t.category}</td>
                <td style={{ padding: 8, fontSize: 13, textAlign: 'right' }}>${Number(t.target_price).toLocaleString()}</td>
                <td style={{ padding: 8, fontSize: 13 }}>{t.leverage}</td>
                <td style={{ padding: 8, fontSize: 13, color: '#5f6368', maxWidth: 280 }}>{t.description}</td>
                <td style={{ padding: 8, fontSize: 13, whiteSpace: 'nowrap' }}>
                  <button onClick={() => edit(t)} style={{ marginRight: 6, padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => del(t.id)} style={{ padding: '4px 10px', cursor: 'pointer', color: '#d93025' }}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
