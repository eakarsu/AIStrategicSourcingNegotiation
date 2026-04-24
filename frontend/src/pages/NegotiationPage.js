import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { negotiation_title: '', vendor_name: '', category: '', our_position: '', vendor_position: '', batna: '', target_outcome: '', leverage_points: '', risk_factors: '', priority: 'medium', status: 'preparation' };

export default function NegotiationPage({ token }) {
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/api/negotiation`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load negotiations'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/negotiation/${form.id}`, form, { headers });
        toast.success('Negotiation updated');
      } else {
        await axios.post(`${API}/api/negotiation`, form, { headers });
        toast.success('Negotiation created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/negotiation/${deleteId}`, { headers });
      toast.success('Negotiation deleted');
      setShowConfirm(false);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => { setForm({ ...item }); setEditing(true); setShowModal(true); };
  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowModal(true); };

  const handleAIGenerate = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/negotiation-points`, {
        negotiation_title: selected.negotiation_title,
        vendor_name: selected.vendor_name,
        our_position: selected.our_position,
        vendor_position: selected.vendor_position,
        batna: selected.batna,
        leverage_points: selected.leverage_points
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI generation failed'); }
    setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>← Back to Negotiations</button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.negotiation_title}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
                <span className={`status-badge status-${selected.priority}`}>{selected.priority} priority</span>
              </div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIGenerate} disabled={aiLoading}>
                {aiLoading ? 'Generating...' : 'AI Talking Points'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Vendor</label><div className="value">{selected.vendor_name}</div></div>
            <div className="detail-field"><label>Category</label><div className="value">{selected.category}</div></div>
          </div>
          <div className="detail-section"><h3>Our Position</h3><p style={{ lineHeight: 1.6 }}>{selected.our_position || '-'}</p></div>
          <div className="detail-section"><h3>Vendor's Position</h3><p style={{ lineHeight: 1.6 }}>{selected.vendor_position || '-'}</p></div>
          <div className="detail-section"><h3>BATNA (Best Alternative)</h3><p style={{ lineHeight: 1.6 }}>{selected.batna || '-'}</p></div>
          <div className="detail-section"><h3>Target Outcome</h3><p style={{ lineHeight: 1.6 }}>{selected.target_outcome || '-'}</p></div>
          <div className="detail-section"><h3>Leverage Points</h3><p style={{ lineHeight: 1.6 }}>{selected.leverage_points || '-'}</p></div>
          <div className="detail-section"><h3>Risk Factors</h3><p style={{ lineHeight: 1.6 }}>{selected.risk_factors || '-'}</p></div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Negotiation' : 'New Negotiation'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <NegotiationForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Negotiation Talking Points</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Negotiation</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No negotiations yet</h3><p>Add a negotiation to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Negotiation</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Vendor</th><th>Category</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.negotiation_title}</strong></td>
                  <td>{item.vendor_name}</td>
                  <td>{item.category}</td>
                  <td><span className={`status-badge status-${item.priority}`}>{item.priority}</span></td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Negotiation' : 'New Negotiation'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <NegotiationForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function NegotiationForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Negotiation Title</label><input className="form-input" value={form.negotiation_title} onChange={e => set('negotiation_title', e.target.value)} placeholder="Title" /></div>
      <div className="form-row">
        <div className="form-group"><label>Vendor Name</label><input className="form-input" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="Vendor" /></div>
        <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g., Raw Materials" /></div>
      </div>
      <div className="form-group"><label>Our Position</label><textarea className="form-textarea" value={form.our_position} onChange={e => set('our_position', e.target.value)} placeholder="What we want to achieve" /></div>
      <div className="form-group"><label>Vendor's Position</label><textarea className="form-textarea" value={form.vendor_position} onChange={e => set('vendor_position', e.target.value)} placeholder="What the vendor likely wants" /></div>
      <div className="form-group"><label>BATNA</label><textarea className="form-textarea" value={form.batna} onChange={e => set('batna', e.target.value)} placeholder="Best alternative to negotiated agreement" /></div>
      <div className="form-group"><label>Target Outcome</label><textarea className="form-textarea" value={form.target_outcome} onChange={e => set('target_outcome', e.target.value)} placeholder="Desired outcome" /></div>
      <div className="form-group"><label>Leverage Points</label><textarea className="form-textarea" value={form.leverage_points} onChange={e => set('leverage_points', e.target.value)} placeholder="Key leverage in negotiation" /></div>
      <div className="form-group"><label>Risk Factors</label><textarea className="form-textarea" value={form.risk_factors} onChange={e => set('risk_factors', e.target.value)} placeholder="Potential risks" /></div>
      <div className="form-row">
        <div className="form-group"><label>Priority</label>
          <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="preparation">Preparation</option><option value="in_progress">In Progress</option><option value="closed">Closed</option>
          </select>
        </div>
      </div>
    </>
  );
}
