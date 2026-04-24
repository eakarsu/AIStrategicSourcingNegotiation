import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { spend_category: '', department: '', vendor_name: '', amount: '', period: '', fiscal_year: '', budget_allocated: '', variance_percentage: '', transaction_count: '', contract_reference: '', cost_center: '', payment_method: '', currency: 'USD', status: 'tracked', notes: '' };

export default function SpendAnalyticsPage({ token }) {
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
      const res = await axios.get(`${API}/api/spend-analytics`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load spend records'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/spend-analytics/${form.id}`, form, { headers });
        toast.success('Spend record updated');
      } else {
        await axios.post(`${API}/api/spend-analytics`, form, { headers });
        toast.success('Spend record created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save spend record'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/spend-analytics/${deleteId}`, { headers });
      toast.success('Spend record deleted');
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

  const handleAIAnalyze = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/analyze-spend`, {
        spend_category: selected.spend_category,
        department: selected.department,
        vendor_name: selected.vendor_name,
        amount: selected.amount,
        budget_allocated: selected.budget_allocated,
        period: selected.period
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI analysis failed'); }
    setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Spend Analytics List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.spend_category} - {selected.vendor_name}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIAnalyze} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'AI Analyze Spend'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Category</label><div className="value">{selected.spend_category || '-'}</div></div>
            <div className="detail-field"><label>Department</label><div className="value">{selected.department || '-'}</div></div>
            <div className="detail-field"><label>Vendor</label><div className="value">{selected.vendor_name || '-'}</div></div>
            <div className="detail-field"><label>Amount</label><div className="value">{selected.amount ? `${selected.currency || 'USD'} ${Number(selected.amount).toLocaleString()}` : '-'}</div></div>
            <div className="detail-field"><label>Period</label><div className="value">{selected.period || '-'}</div></div>
            <div className="detail-field"><label>Fiscal Year</label><div className="value">{selected.fiscal_year || '-'}</div></div>
            <div className="detail-field"><label>Budget Allocated</label><div className="value">{selected.budget_allocated ? `${selected.currency || 'USD'} ${Number(selected.budget_allocated).toLocaleString()}` : '-'}</div></div>
            <div className="detail-field"><label>Variance %</label><div className="value">{selected.variance_percentage != null ? `${selected.variance_percentage}%` : '-'}</div></div>
            <div className="detail-field"><label>Transaction Count</label><div className="value">{selected.transaction_count || '-'}</div></div>
            <div className="detail-field"><label>Contract Reference</label><div className="value">{selected.contract_reference || '-'}</div></div>
            <div className="detail-field"><label>Cost Center</label><div className="value">{selected.cost_center || '-'}</div></div>
            <div className="detail-field"><label>Payment Method</label><div className="value">{selected.payment_method || '-'}</div></div>
            <div className="detail-field"><label>Currency</label><div className="value">{selected.currency || 'USD'}</div></div>
            <div className="detail-field"><label>Status</label><div className="value">{selected.status || '-'}</div></div>
          </div>
          <div className="detail-section">
            <h3>Notes</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.notes || 'No notes provided'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Spend Record' : 'New Spend Record'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <SpendForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Spend Analytics</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Spend Record</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No spend records yet</h3><p>Create your first spend record to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Spend Record</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Category</th><th>Department</th><th>Vendor</th><th>Amount</th><th>Period</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.spend_category}</strong></td>
                  <td>{item.department}</td>
                  <td>{item.vendor_name}</td>
                  <td>{item.amount ? `${item.currency || 'USD'} ${Number(item.amount).toLocaleString()}` : '-'}</td>
                  <td>{item.period}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Spend Record' : 'New Spend Record'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <SpendForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function SpendForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-row">
        <div className="form-group"><label>Spend Category</label><input className="form-input" value={form.spend_category} onChange={e => set('spend_category', e.target.value)} placeholder="e.g., IT Services" /></div>
        <div className="form-group"><label>Department</label><input className="form-input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g., Engineering" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Vendor Name</label><input className="form-input" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="Vendor name" /></div>
        <div className="form-group"><label>Amount</label><input type="number" step="0.01" className="form-input" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Period</label><input className="form-input" value={form.period} onChange={e => set('period', e.target.value)} placeholder="e.g., Q1 2026" /></div>
        <div className="form-group"><label>Fiscal Year</label><input type="number" className="form-input" value={form.fiscal_year} onChange={e => set('fiscal_year', e.target.value)} placeholder="e.g., 2026" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Budget Allocated</label><input type="number" step="0.01" className="form-input" value={form.budget_allocated} onChange={e => set('budget_allocated', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Variance %</label><input type="number" step="0.01" className="form-input" value={form.variance_percentage} onChange={e => set('variance_percentage', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Transaction Count</label><input type="number" className="form-input" value={form.transaction_count} onChange={e => set('transaction_count', e.target.value)} placeholder="0" /></div>
        <div className="form-group"><label>Contract Reference</label><input className="form-input" value={form.contract_reference} onChange={e => set('contract_reference', e.target.value)} placeholder="Contract ID" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Cost Center</label><input className="form-input" value={form.cost_center} onChange={e => set('cost_center', e.target.value)} placeholder="Cost center code" /></div>
        <div className="form-group"><label>Payment Method</label><input className="form-input" value={form.payment_method} onChange={e => set('payment_method', e.target.value)} placeholder="e.g., Wire Transfer" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Currency</label><input className="form-input" value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="USD" /></div>
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="tracked">Tracked</option><option value="reviewed">Reviewed</option><option value="flagged">Flagged</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes" /></div>
    </>
  );
}
