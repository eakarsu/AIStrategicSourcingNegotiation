import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { company_name: '', contact_name: '', email: '', phone: '', address: '', category: '', rating: '', certifications: '', annual_revenue: '', employee_count: '', years_in_business: '', payment_terms: '', quality_score: '', delivery_score: '', status: 'active', notes: '' };

export default function SuppliersPage({ token }) {
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
      const res = await axios.get(`${API}/api/suppliers`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load suppliers'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/suppliers/${form.id}`, form, { headers });
        toast.success('Supplier updated');
      } else {
        await axios.post(`${API}/api/suppliers`, form, { headers });
        toast.success('Supplier created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save supplier'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/suppliers/${deleteId}`, { headers });
      toast.success('Supplier deleted');
      setShowConfirm(false);
      setDeleteId(null);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setForm({ ...item });
    setEditing(true);
    setShowModal(true);
  };

  const handleNew = () => {
    setForm(emptyForm);
    setEditing(false);
    setShowModal(true);
  };

  const handleAIEvaluate = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/evaluate-supplier`, {
        company_name: selected.company_name,
        category: selected.category,
        rating: selected.rating,
        certifications: selected.certifications,
        quality_score: selected.quality_score,
        delivery_score: selected.delivery_score,
        years_in_business: selected.years_in_business
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI evaluation failed'); }
    setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Supplier List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.company_name}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIEvaluate} disabled={aiLoading}>
                {aiLoading ? 'Evaluating...' : 'Evaluate with AI'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Contact Name</label><div className="value">{selected.contact_name || '-'}</div></div>
            <div className="detail-field"><label>Email</label><div className="value">{selected.email || '-'}</div></div>
            <div className="detail-field"><label>Phone</label><div className="value">{selected.phone || '-'}</div></div>
            <div className="detail-field"><label>Category</label><div className="value">{selected.category || '-'}</div></div>
            <div className="detail-field"><label>Rating</label><div className="value">{selected.rating || '-'}</div></div>
            <div className="detail-field"><label>Quality Score</label><div className="value">{selected.quality_score || '-'}</div></div>
            <div className="detail-field"><label>Delivery Score</label><div className="value">{selected.delivery_score || '-'}</div></div>
            <div className="detail-field"><label>Years in Business</label><div className="value">{selected.years_in_business || '-'}</div></div>
            <div className="detail-field"><label>Annual Revenue</label><div className="value">{selected.annual_revenue ? `$${Number(selected.annual_revenue).toLocaleString()}` : '-'}</div></div>
            <div className="detail-field"><label>Employee Count</label><div className="value">{selected.employee_count || '-'}</div></div>
            <div className="detail-field"><label>Payment Terms</label><div className="value">{selected.payment_terms || '-'}</div></div>
            <div className="detail-field"><label>Status</label><div className="value">{selected.status}</div></div>
          </div>
          <div className="detail-section">
            <h3>Address</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.address || 'No address provided'}</p>
          </div>
          <div className="detail-section">
            <h3>Certifications</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.certifications || 'No certifications listed'}</p>
          </div>
          <div className="detail-section">
            <h3>Notes</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.notes || 'No notes'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Supplier' : 'New Supplier'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <SupplierForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Supplier Management</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Supplier</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No suppliers yet</h3><p>Add your first supplier to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Supplier</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Company Name</th><th>Contact</th><th>Category</th><th>Rating</th><th>Quality</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.company_name}</strong></td>
                  <td>{item.contact_name}</td>
                  <td>{item.category}</td>
                  <td>{item.rating}</td>
                  <td>{item.quality_score}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Supplier' : 'New Supplier'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <SupplierForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function SupplierForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Company Name</label><input className="form-input" value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Company name" /></div>
      <div className="form-row">
        <div className="form-group"><label>Contact Name</label><input className="form-input" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Contact person" /></div>
        <div className="form-group"><label>Email</label><input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@company.com" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" /></div>
        <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g., Raw Materials" /></div>
      </div>
      <div className="form-group"><label>Address</label><textarea className="form-textarea" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" /></div>
      <div className="form-row">
        <div className="form-group"><label>Rating (0-5)</label><input type="number" step="0.1" min="0" max="5" className="form-input" value={form.rating} onChange={e => set('rating', e.target.value)} placeholder="4.5" /></div>
        <div className="form-group"><label>Quality Score (0-100)</label><input type="number" step="0.1" min="0" max="100" className="form-input" value={form.quality_score} onChange={e => set('quality_score', e.target.value)} placeholder="92.5" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Delivery Score (0-100)</label><input type="number" step="0.1" min="0" max="100" className="form-input" value={form.delivery_score} onChange={e => set('delivery_score', e.target.value)} placeholder="95.0" /></div>
        <div className="form-group"><label>Years in Business</label><input type="number" className="form-input" value={form.years_in_business} onChange={e => set('years_in_business', e.target.value)} placeholder="10" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Annual Revenue</label><input type="number" step="0.01" className="form-input" value={form.annual_revenue} onChange={e => set('annual_revenue', e.target.value)} placeholder="5000000" /></div>
        <div className="form-group"><label>Employee Count</label><input type="number" className="form-input" value={form.employee_count} onChange={e => set('employee_count', e.target.value)} placeholder="500" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Payment Terms</label><input className="form-input" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} placeholder="e.g., Net 30" /></div>
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label>Certifications</label><textarea className="form-textarea" value={form.certifications} onChange={e => set('certifications', e.target.value)} placeholder="ISO 9001, ISO 14001, etc." /></div>
      <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes" /></div>
    </>
  );
}
