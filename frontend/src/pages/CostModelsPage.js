import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { product_name: '', category: '', material_cost: '', labor_cost: '', overhead_cost: '', logistics_cost: '', margin_percentage: '', market_price: '', target_price: '', volume: '', unit: '', supplier: '', status: 'draft' };

export default function CostModelsPage({ token }) {
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
      const res = await axios.get(`${API}/api/cost-models`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load cost models'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/cost-models/${form.id}`, form, { headers });
        toast.success('Cost model updated');
      } else {
        await axios.post(`${API}/api/cost-models`, form, { headers });
        toast.success('Cost model created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/cost-models/${deleteId}`, { headers });
      toast.success('Cost model deleted');
      setShowConfirm(false);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => { setForm({ ...item }); setEditing(true); setShowModal(true); };
  const handleNew = () => { setForm(emptyForm); setEditing(false); setShowModal(true); };

  const handleAIAnalyze = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/should-cost`, {
        product_name: selected.product_name,
        category: selected.category,
        material_cost: selected.material_cost,
        labor_cost: selected.labor_cost,
        overhead_cost: selected.overhead_cost,
        volume: selected.volume,
        market_price: selected.market_price
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI analysis failed'); }
    setAiLoading(false);
  };

  const calcTotal = (item) => {
    return (parseFloat(item.material_cost || 0) + parseFloat(item.labor_cost || 0) + parseFloat(item.overhead_cost || 0) + parseFloat(item.logistics_cost || 0)).toFixed(2);
  };

  if (selected) {
    const totalCost = calcTotal(selected);
    const savings = (parseFloat(selected.market_price) - parseFloat(selected.target_price)).toFixed(2);
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>← Back to Cost Models</button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.product_name}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIAnalyze} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'AI Should-Cost Analysis'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Category</label><div className="value">{selected.category}</div></div>
            <div className="detail-field"><label>Supplier</label><div className="value">{selected.supplier}</div></div>
            <div className="detail-field"><label>Volume</label><div className="value">{parseInt(selected.volume).toLocaleString()} {selected.unit}</div></div>
            <div className="detail-field"><label>Margin</label><div className="value">{selected.margin_percentage}%</div></div>
          </div>
          <div className="detail-section">
            <h3>Cost Breakdown</h3>
            <div className="detail-grid">
              <div className="detail-field"><label>Material Cost</label><div className="value" style={{ fontSize: 18, fontWeight: 600 }}>${parseFloat(selected.material_cost).toLocaleString()}</div></div>
              <div className="detail-field"><label>Labor Cost</label><div className="value" style={{ fontSize: 18, fontWeight: 600 }}>${parseFloat(selected.labor_cost).toLocaleString()}</div></div>
              <div className="detail-field"><label>Overhead Cost</label><div className="value" style={{ fontSize: 18, fontWeight: 600 }}>${parseFloat(selected.overhead_cost).toLocaleString()}</div></div>
              <div className="detail-field"><label>Logistics Cost</label><div className="value" style={{ fontSize: 18, fontWeight: 600 }}>${parseFloat(selected.logistics_cost).toLocaleString()}</div></div>
            </div>
          </div>
          <div className="detail-section">
            <h3>Pricing Analysis</h3>
            <div className="detail-grid">
              <div className="detail-field"><label>Total Unit Cost</label><div className="value" style={{ fontSize: 22, fontWeight: 700 }}>${totalCost}</div></div>
              <div className="detail-field"><label>Market Price</label><div className="value" style={{ fontSize: 22, fontWeight: 700 }}>${parseFloat(selected.market_price).toLocaleString()}</div></div>
              <div className="detail-field"><label>Target Price</label><div className="value" style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>${parseFloat(selected.target_price).toLocaleString()}</div></div>
              <div className="detail-field"><label>Potential Savings/Unit</label><div className="value" style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>${savings}</div></div>
            </div>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Cost Model' : 'New Cost Model'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <CostForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Should-Cost Modeling</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Cost Model</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No cost models yet</h3><p>Create your first cost model</p><button className="btn btn-primary" onClick={handleNew}>+ New Cost Model</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Product</th><th>Category</th><th>Supplier</th><th>Total Cost</th><th>Market Price</th><th>Target</th><th>Status</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.product_name}</strong></td>
                  <td>{item.category}</td>
                  <td>{item.supplier}</td>
                  <td>${calcTotal(item)}</td>
                  <td>${parseFloat(item.market_price).toLocaleString()}</td>
                  <td>${parseFloat(item.target_price).toLocaleString()}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Cost Model' : 'New Cost Model'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <CostForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function CostForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Product Name</label><input className="form-input" value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="Product name" /></div>
      <div className="form-row">
        <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g., Raw Materials" /></div>
        <div className="form-group"><label>Supplier</label><input className="form-input" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Supplier name" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Material Cost ($)</label><input type="number" step="0.01" className="form-input" value={form.material_cost} onChange={e => set('material_cost', e.target.value)} /></div>
        <div className="form-group"><label>Labor Cost ($)</label><input type="number" step="0.01" className="form-input" value={form.labor_cost} onChange={e => set('labor_cost', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Overhead Cost ($)</label><input type="number" step="0.01" className="form-input" value={form.overhead_cost} onChange={e => set('overhead_cost', e.target.value)} /></div>
        <div className="form-group"><label>Logistics Cost ($)</label><input type="number" step="0.01" className="form-input" value={form.logistics_cost} onChange={e => set('logistics_cost', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Market Price ($)</label><input type="number" step="0.01" className="form-input" value={form.market_price} onChange={e => set('market_price', e.target.value)} /></div>
        <div className="form-group"><label>Target Price ($)</label><input type="number" step="0.01" className="form-input" value={form.target_price} onChange={e => set('target_price', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Volume</label><input type="number" className="form-input" value={form.volume} onChange={e => set('volume', e.target.value)} /></div>
        <div className="form-group"><label>Unit</label><input className="form-input" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="e.g., tons, units" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Margin %</label><input type="number" step="0.01" className="form-input" value={form.margin_percentage} onChange={e => set('margin_percentage', e.target.value)} /></div>
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="draft">Draft</option><option value="under_review">Under Review</option><option value="approved">Approved</option>
          </select>
        </div>
      </div>
    </>
  );
}
