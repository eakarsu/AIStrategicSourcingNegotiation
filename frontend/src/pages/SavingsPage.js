import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { initiative_name: '', category: '', vendor_name: '', original_cost: '', negotiated_cost: '', savings_amount: '', savings_percentage: '', savings_type: 'cost_reduction', implementation_date: '', validation_status: 'pending', department: '', fiscal_year: '', notes: '' };

export default function SavingsPage({ token }) {
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
      const res = await axios.get(`${API}/api/savings`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load savings'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/savings/${form.id}`, form, { headers });
        toast.success('Savings record updated');
      } else {
        await axios.post(`${API}/api/savings`, form, { headers });
        toast.success('Savings record created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save record'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/savings/${deleteId}`, { headers });
      toast.success('Savings record deleted');
      setShowConfirm(false);
      setDeleteId(null);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setForm({ ...item, implementation_date: item.implementation_date ? item.implementation_date.split('T')[0] : '' });
    setEditing(true);
    setShowModal(true);
  };

  const handleNew = () => {
    setForm(emptyForm);
    setEditing(false);
    setShowModal(true);
  };

  const handleAIOptimize = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/optimize-savings`, {
        initiative_name: selected.initiative_name,
        category: selected.category,
        original_cost: selected.original_cost,
        negotiated_cost: selected.negotiated_cost,
        savings_type: selected.savings_type
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI optimization failed'); }
    setAiLoading(false);
  };

  const formatCurrency = (val) => {
    if (val == null || val === '') return '-';
    return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (val) => {
    if (val == null || val === '') return '-';
    return `${Number(val).toFixed(1)}%`;
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Savings List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.initiative_name}</h2>
              <span className={`status-badge status-${selected.validation_status}`}>{selected.validation_status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIOptimize} disabled={aiLoading}>
                {aiLoading ? 'Optimizing...' : 'Optimize with AI'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '1rem 1.5rem', flex: 1, minWidth: 150, textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: 600 }}>Savings Amount</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1b5e20' }}>{formatCurrency(selected.savings_amount)}</div>
            </div>
            <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '1rem 1.5rem', flex: 1, minWidth: 150, textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#2e7d32', fontWeight: 600 }}>Savings Percentage</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1b5e20' }}>{formatPercentage(selected.savings_percentage)}</div>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Category</label><div className="value">{selected.category || '-'}</div></div>
            <div className="detail-field"><label>Vendor</label><div className="value">{selected.vendor_name || '-'}</div></div>
            <div className="detail-field"><label>Original Cost</label><div className="value">{formatCurrency(selected.original_cost)}</div></div>
            <div className="detail-field"><label>Negotiated Cost</label><div className="value">{formatCurrency(selected.negotiated_cost)}</div></div>
            <div className="detail-field"><label>Savings Type</label><div className="value">{selected.savings_type || '-'}</div></div>
            <div className="detail-field"><label>Implementation Date</label><div className="value">{selected.implementation_date ? new Date(selected.implementation_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-field"><label>Department</label><div className="value">{selected.department || '-'}</div></div>
            <div className="detail-field"><label>Fiscal Year</label><div className="value">{selected.fiscal_year || '-'}</div></div>
            <div className="detail-field"><label>Validation Status</label><div className="value">{selected.validation_status}</div></div>
          </div>
          <div className="detail-section">
            <h3>Notes</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.notes || 'No notes provided'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Savings Record' : 'New Savings Record'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <SavingsForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Savings Tracker</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Savings Record</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No savings records yet</h3><p>Create your first savings record to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Savings Record</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Initiative</th><th>Category</th><th>Vendor</th><th>Original Cost</th><th>Negotiated Cost</th><th>Savings</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.initiative_name}</strong></td>
                  <td>{item.category}</td>
                  <td>{item.vendor_name}</td>
                  <td>{formatCurrency(item.original_cost)}</td>
                  <td>{formatCurrency(item.negotiated_cost)}</td>
                  <td style={{ color: '#1b5e20', fontWeight: 600 }}>{formatCurrency(item.savings_amount)}</td>
                  <td><span className={`status-badge status-${item.validation_status}`}>{item.validation_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Savings Record' : 'New Savings Record'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <SavingsForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function SavingsForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Initiative Name</label><input className="form-input" value={form.initiative_name} onChange={e => set('initiative_name', e.target.value)} placeholder="Savings initiative name" /></div>
      <div className="form-row">
        <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g., IT Services" /></div>
        <div className="form-group"><label>Vendor Name</label><input className="form-input" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="Vendor name" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Original Cost</label><input type="number" step="0.01" className="form-input" value={form.original_cost} onChange={e => set('original_cost', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Negotiated Cost</label><input type="number" step="0.01" className="form-input" value={form.negotiated_cost} onChange={e => set('negotiated_cost', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Savings Amount</label><input type="number" step="0.01" className="form-input" value={form.savings_amount} onChange={e => set('savings_amount', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Savings Percentage</label><input type="number" step="0.1" className="form-input" value={form.savings_percentage} onChange={e => set('savings_percentage', e.target.value)} placeholder="0.0" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Savings Type</label>
          <select className="form-select" value={form.savings_type} onChange={e => set('savings_type', e.target.value)}>
            <option value="cost_reduction">Cost Reduction</option>
            <option value="cost_avoidance">Cost Avoidance</option>
            <option value="process_improvement">Process Improvement</option>
          </select>
        </div>
        <div className="form-group"><label>Validation Status</label>
          <select className="form-select" value={form.validation_status} onChange={e => set('validation_status', e.target.value)}>
            <option value="pending">Pending</option>
            <option value="validated">Validated</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Implementation Date</label><input type="date" className="form-input" value={form.implementation_date} onChange={e => set('implementation_date', e.target.value)} /></div>
        <div className="form-group"><label>Fiscal Year</label><input type="number" className="form-input" value={form.fiscal_year} onChange={e => set('fiscal_year', e.target.value)} placeholder="e.g., 2026" /></div>
      </div>
      <div className="form-group"><label>Department</label><input className="form-input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="Department name" /></div>
      <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes" /></div>
    </>
  );
}
