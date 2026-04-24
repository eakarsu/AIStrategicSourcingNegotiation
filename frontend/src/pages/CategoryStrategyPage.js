import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { category_name: '', category_owner: '', annual_spend: '', number_of_suppliers: '', strategic_importance: 'medium', supply_risk: 'medium', sourcing_strategy: 'competitive_bidding', current_state: '', target_state: '', key_initiatives: '', savings_target_pct: '', timeline: '', stakeholders: '', market_dynamics: '', status: 'draft' };

export default function CategoryStrategyPage({ token }) {
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
      const res = await axios.get(`${API}/api/category-strategy`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load category strategies'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/category-strategy/${form.id}`, form, { headers });
        toast.success('Category strategy updated');
      } else {
        await axios.post(`${API}/api/category-strategy`, form, { headers });
        toast.success('Category strategy created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save category strategy'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/category-strategy/${deleteId}`, { headers });
      toast.success('Category strategy deleted');
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

  const handleAIAnalysis = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/category-analysis`, {
        category_name: selected.category_name,
        annual_spend: selected.annual_spend,
        number_of_suppliers: selected.number_of_suppliers,
        strategic_importance: selected.strategic_importance,
        supply_risk: selected.supply_risk,
        sourcing_strategy: selected.sourcing_strategy,
        market_dynamics: selected.market_dynamics
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI analysis failed'); }
    setAiLoading(false);
  };

  const formatCurrency = (val) => {
    if (!val) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatLabel = (val) => {
    if (!val) return '-';
    return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Category Strategy List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.category_name}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIAnalysis} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'AI Strategy Analysis'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Category Owner</label><div className="value">{selected.category_owner || '-'}</div></div>
            <div className="detail-field"><label>Annual Spend</label><div className="value">{formatCurrency(selected.annual_spend)}</div></div>
            <div className="detail-field"><label>Number of Suppliers</label><div className="value">{selected.number_of_suppliers || '-'}</div></div>
            <div className="detail-field"><label>Strategic Importance</label><div className="value">{formatLabel(selected.strategic_importance)}</div></div>
            <div className="detail-field"><label>Supply Risk</label><div className="value">{formatLabel(selected.supply_risk)}</div></div>
            <div className="detail-field"><label>Sourcing Strategy</label><div className="value">{formatLabel(selected.sourcing_strategy)}</div></div>
            <div className="detail-field"><label>Savings Target %</label><div className="value">{selected.savings_target_pct ? `${selected.savings_target_pct}%` : '-'}</div></div>
            <div className="detail-field"><label>Timeline</label><div className="value">{selected.timeline || '-'}</div></div>
            <div className="detail-field"><label>Status</label><div className="value">{formatLabel(selected.status)}</div></div>
          </div>
          <div className="detail-section">
            <h3>Current State</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.current_state || 'No current state provided'}</p>
          </div>
          <div className="detail-section">
            <h3>Target State</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.target_state || 'No target state provided'}</p>
          </div>
          <div className="detail-section">
            <h3>Key Initiatives</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.key_initiatives || 'No key initiatives specified'}</p>
          </div>
          <div className="detail-section">
            <h3>Stakeholders</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.stakeholders || 'No stakeholders specified'}</p>
          </div>
          <div className="detail-section">
            <h3>Market Dynamics</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.market_dynamics || 'No market dynamics provided'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category Strategy' : 'New Category Strategy'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <CategoryStrategyForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Category Strategy</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Strategy</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No category strategies yet</h3><p>Create your first category strategy to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Strategy</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Category</th><th>Owner</th><th>Annual Spend</th><th>Suppliers</th><th>Importance</th><th>Strategy</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.category_name}</strong></td>
                  <td>{item.category_owner}</td>
                  <td>{formatCurrency(item.annual_spend)}</td>
                  <td>{item.number_of_suppliers || '-'}</td>
                  <td>{formatLabel(item.strategic_importance)}</td>
                  <td>{formatLabel(item.sourcing_strategy)}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category Strategy' : 'New Category Strategy'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <CategoryStrategyForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function CategoryStrategyForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-row">
        <div className="form-group"><label>Category Name</label><input className="form-input" value={form.category_name} onChange={e => set('category_name', e.target.value)} placeholder="e.g., IT Hardware" /></div>
        <div className="form-group"><label>Category Owner</label><input className="form-input" value={form.category_owner} onChange={e => set('category_owner', e.target.value)} placeholder="e.g., John Smith" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Annual Spend</label><input type="number" className="form-input" value={form.annual_spend} onChange={e => set('annual_spend', e.target.value)} placeholder="e.g., 5000000" /></div>
        <div className="form-group"><label>Number of Suppliers</label><input type="number" className="form-input" value={form.number_of_suppliers} onChange={e => set('number_of_suppliers', e.target.value)} placeholder="e.g., 12" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Strategic Importance</label>
          <select className="form-select" value={form.strategic_importance} onChange={e => set('strategic_importance', e.target.value)}>
            <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
        <div className="form-group"><label>Supply Risk</label>
          <select className="form-select" value={form.supply_risk} onChange={e => set('supply_risk', e.target.value)}>
            <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Sourcing Strategy</label>
          <select className="form-select" value={form.sourcing_strategy} onChange={e => set('sourcing_strategy', e.target.value)}>
            <option value="strategic_partnership">Strategic Partnership</option><option value="competitive_bidding">Competitive Bidding</option><option value="sole_source">Sole Source</option><option value="dual_source">Dual Source</option><option value="spot_buy">Spot Buy</option>
          </select>
        </div>
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="draft">Draft</option><option value="in_progress">In Progress</option><option value="approved">Approved</option><option value="implemented">Implemented</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Savings Target %</label><input type="number" step="0.1" className="form-input" value={form.savings_target_pct} onChange={e => set('savings_target_pct', e.target.value)} placeholder="e.g., 15.0" /></div>
        <div className="form-group"><label>Timeline</label><input className="form-input" value={form.timeline} onChange={e => set('timeline', e.target.value)} placeholder="e.g., Q1 2026 - Q4 2026" /></div>
      </div>
      <div className="form-group"><label>Current State</label><textarea className="form-textarea" value={form.current_state} onChange={e => set('current_state', e.target.value)} placeholder="Describe the current state of this category" /></div>
      <div className="form-group"><label>Target State</label><textarea className="form-textarea" value={form.target_state} onChange={e => set('target_state', e.target.value)} placeholder="Describe the desired target state" /></div>
      <div className="form-group"><label>Key Initiatives</label><textarea className="form-textarea" value={form.key_initiatives} onChange={e => set('key_initiatives', e.target.value)} placeholder="Key strategic initiatives" /></div>
      <div className="form-group"><label>Stakeholders</label><textarea className="form-textarea" value={form.stakeholders} onChange={e => set('stakeholders', e.target.value)} placeholder="Key stakeholders involved" /></div>
      <div className="form-group"><label>Market Dynamics</label><textarea className="form-textarea" value={form.market_dynamics} onChange={e => set('market_dynamics', e.target.value)} placeholder="Current market conditions and trends" /></div>
    </>
  );
}
