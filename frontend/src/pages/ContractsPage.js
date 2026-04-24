import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { contract_title: '', vendor_name: '', contract_type: '', start_date: '', end_date: '', total_value: '', payment_schedule: '', terms_conditions: '', sla_terms: '', termination_clause: '', renewal_terms: '', governing_law: '', status: 'draft' };

export default function ContractsPage({ token }) {
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
      const res = await axios.get(`${API}/api/contracts`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load contracts'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/contracts/${form.id}`, form, { headers });
        toast.success('Contract updated');
      } else {
        await axios.post(`${API}/api/contracts`, form, { headers });
        toast.success('Contract created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/contracts/${deleteId}`, { headers });
      toast.success('Contract deleted');
      setShowConfirm(false);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setForm({
      ...item,
      start_date: item.start_date ? item.start_date.split('T')[0] : '',
      end_date: item.end_date ? item.end_date.split('T')[0] : ''
    });
    setEditing(true);
    setShowModal(true);
  };
  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowModal(true); };

  const handleAIDraft = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/draft-contract`, {
        contract_title: selected.contract_title,
        vendor_name: selected.vendor_name,
        contract_type: selected.contract_type,
        total_value: selected.total_value,
        terms_conditions: selected.terms_conditions,
        sla_terms: selected.sla_terms
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI drafting failed'); }
    setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>← Back to Contracts</button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.contract_title}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{selected.contract_type}</span>
              </div>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIDraft} disabled={aiLoading}>
                {aiLoading ? 'Drafting...' : 'AI Draft Contract'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Vendor</label><div className="value">{selected.vendor_name}</div></div>
            <div className="detail-field"><label>Total Value</label><div className="value" style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>${parseFloat(selected.total_value).toLocaleString()}</div></div>
            <div className="detail-field"><label>Start Date</label><div className="value">{selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-field"><label>End Date</label><div className="value">{selected.end_date ? new Date(selected.end_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-field"><label>Governing Law</label><div className="value">{selected.governing_law || '-'}</div></div>
          </div>
          <div className="detail-section"><h3>Payment Schedule</h3><p style={{ lineHeight: 1.6 }}>{selected.payment_schedule || '-'}</p></div>
          <div className="detail-section"><h3>Terms & Conditions</h3><p style={{ lineHeight: 1.6 }}>{selected.terms_conditions || '-'}</p></div>
          <div className="detail-section"><h3>SLA Terms</h3><p style={{ lineHeight: 1.6 }}>{selected.sla_terms || '-'}</p></div>
          <div className="detail-section"><h3>Termination Clause</h3><p style={{ lineHeight: 1.6 }}>{selected.termination_clause || '-'}</p></div>
          <div className="detail-section"><h3>Renewal Terms</h3><p style={{ lineHeight: 1.6 }}>{selected.renewal_terms || '-'}</p></div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Contract' : 'New Contract'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <ContractForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Contract Drafting</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Contract</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No contracts yet</h3><p>Create your first contract</p><button className="btn btn-primary" onClick={handleNew}>+ New Contract</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Title</th><th>Vendor</th><th>Type</th><th>Value</th><th>End Date</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.contract_title}</strong></td>
                  <td>{item.vendor_name}</td>
                  <td>{item.contract_type}</td>
                  <td>${parseFloat(item.total_value).toLocaleString()}</td>
                  <td>{item.end_date ? new Date(item.end_date).toLocaleDateString() : '-'}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Contract' : 'New Contract'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <ContractForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function ContractForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Contract Title</label><input className="form-input" value={form.contract_title} onChange={e => set('contract_title', e.target.value)} placeholder="Contract title" /></div>
      <div className="form-row">
        <div className="form-group"><label>Vendor Name</label><input className="form-input" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="Vendor" /></div>
        <div className="form-group"><label>Contract Type</label>
          <select className="form-select" value={form.contract_type} onChange={e => set('contract_type', e.target.value)}>
            <option value="">Select type</option>
            <option value="Master Services Agreement">Master Services Agreement</option>
            <option value="Supply Agreement">Supply Agreement</option>
            <option value="SaaS Agreement">SaaS Agreement</option>
            <option value="Professional Services">Professional Services</option>
            <option value="Capital Equipment Purchase">Capital Equipment Purchase</option>
            <option value="Purchase Agreement">Purchase Agreement</option>
            <option value="Managed Services">Managed Services</option>
            <option value="Services Agreement">Services Agreement</option>
            <option value="Construction Contract">Construction Contract</option>
            <option value="Enterprise License">Enterprise License</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Start Date</label><input type="date" className="form-input" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
        <div className="form-group"><label>End Date</label><input type="date" className="form-input" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Total Value ($)</label><input type="number" className="form-input" value={form.total_value} onChange={e => set('total_value', e.target.value)} /></div>
        <div className="form-group"><label>Governing Law</label><input className="form-input" value={form.governing_law} onChange={e => set('governing_law', e.target.value)} placeholder="e.g., State of Delaware" /></div>
      </div>
      <div className="form-group"><label>Payment Schedule</label><textarea className="form-textarea" value={form.payment_schedule} onChange={e => set('payment_schedule', e.target.value)} placeholder="Payment terms and schedule" /></div>
      <div className="form-group"><label>Terms & Conditions</label><textarea className="form-textarea" value={form.terms_conditions} onChange={e => set('terms_conditions', e.target.value)} placeholder="Key terms and conditions" /></div>
      <div className="form-group"><label>SLA Terms</label><textarea className="form-textarea" value={form.sla_terms} onChange={e => set('sla_terms', e.target.value)} placeholder="Service level agreements" /></div>
      <div className="form-group"><label>Termination Clause</label><textarea className="form-textarea" value={form.termination_clause} onChange={e => set('termination_clause', e.target.value)} placeholder="Termination conditions" /></div>
      <div className="form-group"><label>Renewal Terms</label><textarea className="form-textarea" value={form.renewal_terms} onChange={e => set('renewal_terms', e.target.value)} placeholder="Renewal terms" /></div>
      <div className="form-group"><label>Status</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="draft">Draft</option><option value="under_review">Under Review</option><option value="pending_signature">Pending Signature</option><option value="active">Active</option><option value="closed">Closed</option>
        </select>
      </div>
    </>
  );
}
