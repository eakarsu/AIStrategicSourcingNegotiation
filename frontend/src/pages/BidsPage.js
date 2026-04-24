import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { rfp_title: '', vendor_name: '', bid_amount: '', delivery_timeline: '', technical_score: '', commercial_score: '', compliance_score: '', vendor_experience: '', warranty_terms: '', payment_terms: '', status: 'submitted' };

export default function BidsPage({ token }) {
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
      const res = await axios.get(`${API}/api/bids`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load bids'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/bids/${form.id}`, form, { headers });
        toast.success('Bid updated');
      } else {
        await axios.post(`${API}/api/bids`, form, { headers });
        toast.success('Bid created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save bid'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/bids/${deleteId}`, { headers });
      toast.success('Bid deleted');
      setShowConfirm(false);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => { setForm({ ...item }); setEditing(true); setShowModal(true); };
  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowModal(true); };

  const handleAICompare = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const bidsToCompare = selected
        ? items.filter(b => b.rfp_title === selected.rfp_title)
        : items.slice(0, 5);
      const res = await axios.post(`${API}/api/ai/compare-bids`, {
        bids: bidsToCompare.map(b => ({
          vendor: b.vendor_name, amount: b.bid_amount, timeline: b.delivery_timeline,
          technical: b.technical_score, commercial: b.commercial_score, compliance: b.compliance_score
        }))
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI comparison failed'); }
    setAiLoading(false);
  };

  if (selected) {
    const avgScore = ((parseFloat(selected.technical_score) + parseFloat(selected.commercial_score) + parseFloat(selected.compliance_score)) / 3).toFixed(1);
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>← Back to Bids List</button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.vendor_name}</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{selected.rfp_title}</p>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAICompare} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'AI Compare Bids'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Bid Amount</label><div className="value" style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>${parseFloat(selected.bid_amount).toLocaleString()}</div></div>
            <div className="detail-field"><label>Delivery Timeline</label><div className="value">{selected.delivery_timeline}</div></div>
            <div className="detail-field"><label>Average Score</label><div className="value" style={{ fontSize: 24, fontWeight: 700 }}>{avgScore}/100</div></div>
            <div className="detail-field"><label>Status</label><div className="value"><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div></div>
          </div>
          <div className="detail-section">
            <h3>Scoring Breakdown</h3>
            <div className="detail-grid">
              <div className="detail-field"><label>Technical Score</label><div className="value">{selected.technical_score}/100</div></div>
              <div className="detail-field"><label>Commercial Score</label><div className="value">{selected.commercial_score}/100</div></div>
              <div className="detail-field"><label>Compliance Score</label><div className="value">{selected.compliance_score}/100</div></div>
            </div>
          </div>
          <div className="detail-section"><h3>Vendor Experience</h3><p style={{ lineHeight: 1.6 }}>{selected.vendor_experience || '-'}</p></div>
          <div className="detail-section"><h3>Warranty Terms</h3><p style={{ lineHeight: 1.6 }}>{selected.warranty_terms || '-'}</p></div>
          <div className="detail-section"><h3>Payment Terms</h3><p style={{ lineHeight: 1.6 }}>{selected.payment_terms || '-'}</p></div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Bid' : 'New Bid'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <BidForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Bid Comparison Matrix</h1>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-success" onClick={handleAICompare} disabled={aiLoading}>AI Compare All</button>
          <button className="btn btn-primary" onClick={handleNew}>+ New Bid</button>
        </div>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No bids yet</h3><p>Add vendor bids to compare</p><button className="btn btn-primary" onClick={handleNew}>+ New Bid</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Vendor</th><th>RFP</th><th>Bid Amount</th><th>Timeline</th><th>Tech Score</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.vendor_name}</strong></td>
                  <td>{item.rfp_title}</td>
                  <td>${parseFloat(item.bid_amount).toLocaleString()}</td>
                  <td>{item.delivery_timeline}</td>
                  <td>{item.technical_score}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Bid' : 'New Bid'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <BidForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function BidForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>RFP Title</label><input className="form-input" value={form.rfp_title} onChange={e => set('rfp_title', e.target.value)} placeholder="Related RFP" /></div>
      <div className="form-row">
        <div className="form-group"><label>Vendor Name</label><input className="form-input" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="Vendor name" /></div>
        <div className="form-group"><label>Bid Amount ($)</label><input type="number" className="form-input" value={form.bid_amount} onChange={e => set('bid_amount', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Delivery Timeline</label><input className="form-input" value={form.delivery_timeline} onChange={e => set('delivery_timeline', e.target.value)} placeholder="e.g., 6 months" /></div>
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="submitted">Submitted</option><option value="under_review">Under Review</option><option value="shortlisted">Shortlisted</option><option value="approved">Approved</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Technical Score</label><input type="number" className="form-input" value={form.technical_score} onChange={e => set('technical_score', e.target.value)} placeholder="0-100" /></div>
        <div className="form-group"><label>Commercial Score</label><input type="number" className="form-input" value={form.commercial_score} onChange={e => set('commercial_score', e.target.value)} placeholder="0-100" /></div>
      </div>
      <div className="form-group"><label>Compliance Score</label><input type="number" className="form-input" value={form.compliance_score} onChange={e => set('compliance_score', e.target.value)} placeholder="0-100" /></div>
      <div className="form-group"><label>Vendor Experience</label><textarea className="form-textarea" value={form.vendor_experience} onChange={e => set('vendor_experience', e.target.value)} placeholder="Vendor background and experience" /></div>
      <div className="form-group"><label>Warranty Terms</label><textarea className="form-textarea" value={form.warranty_terms} onChange={e => set('warranty_terms', e.target.value)} placeholder="Warranty details" /></div>
      <div className="form-group"><label>Payment Terms</label><textarea className="form-textarea" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} placeholder="Payment terms" /></div>
    </>
  );
}
