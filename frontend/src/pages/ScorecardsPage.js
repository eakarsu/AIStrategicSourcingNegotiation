import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { vendor_name: '', evaluation_period: '', overall_score: '', quality_score: '', delivery_score: '', cost_score: '', responsiveness_score: '', innovation_score: '', compliance_score: '', defect_rate: '', on_time_delivery_pct: '', cost_variance_pct: '', corrective_actions: '', improvement_plan: '', evaluator: '', status: 'draft' };

export default function ScorecardsPage({ token }) {
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
      const res = await axios.get(`${API}/api/scorecards`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load scorecards'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/scorecards/${form.id}`, form, { headers });
        toast.success('Scorecard updated');
      } else {
        await axios.post(`${API}/api/scorecards`, form, { headers });
        toast.success('Scorecard created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save scorecard'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/scorecards/${deleteId}`, { headers });
      toast.success('Scorecard deleted');
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

  const handleAIPerformanceReview = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/performance-review`, {
        vendor_name: selected.vendor_name,
        overall_score: selected.overall_score,
        quality_score: selected.quality_score,
        delivery_score: selected.delivery_score,
        cost_score: selected.cost_score,
        defect_rate: selected.defect_rate,
        on_time_delivery_pct: selected.on_time_delivery_pct
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI performance review failed'); }
    setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Scorecards List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.vendor_name}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIPerformanceReview} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'AI Performance Review'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Evaluation Period</label><div className="value">{selected.evaluation_period || '-'}</div></div>
            <div className="detail-field"><label>Evaluator</label><div className="value">{selected.evaluator || '-'}</div></div>
            <div className="detail-field"><label>Status</label><div className="value">{selected.status}</div></div>
            <div className="detail-field"><label>Overall Score</label><div className="value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selected.overall_score ?? '-'}</div></div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Quality Score</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.quality_score ?? '-'}</div></div>
            <div className="detail-field"><label>Delivery Score</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.delivery_score ?? '-'}</div></div>
            <div className="detail-field"><label>Cost Score</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.cost_score ?? '-'}</div></div>
            <div className="detail-field"><label>Responsiveness Score</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.responsiveness_score ?? '-'}</div></div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Innovation Score</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.innovation_score ?? '-'}</div></div>
            <div className="detail-field"><label>Compliance Score</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.compliance_score ?? '-'}</div></div>
            <div className="detail-field"><label>Defect Rate</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.defect_rate != null ? `${selected.defect_rate}%` : '-'}</div></div>
            <div className="detail-field"><label>On-Time Delivery %</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.on_time_delivery_pct != null ? `${selected.on_time_delivery_pct}%` : '-'}</div></div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Cost Variance %</label><div className="value" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.cost_variance_pct != null ? `${selected.cost_variance_pct}%` : '-'}</div></div>
          </div>
          <div className="detail-section">
            <h3>Corrective Actions</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.corrective_actions || 'No corrective actions specified'}</p>
          </div>
          <div className="detail-section">
            <h3>Improvement Plan</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.improvement_plan || 'No improvement plan specified'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Scorecard' : 'New Scorecard'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <ScorecardForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Performance Scorecards</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Scorecard</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No scorecards yet</h3><p>Create your first performance scorecard to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Scorecard</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Vendor</th><th>Period</th><th>Overall</th><th>Quality</th><th>Delivery</th><th>Cost</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.vendor_name}</strong></td>
                  <td>{item.evaluation_period}</td>
                  <td>{item.overall_score ?? '-'}</td>
                  <td>{item.quality_score ?? '-'}</td>
                  <td>{item.delivery_score ?? '-'}</td>
                  <td>{item.cost_score ?? '-'}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Scorecard' : 'New Scorecard'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <ScorecardForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function ScorecardForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Vendor Name</label><input className="form-input" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="Vendor name" /></div>
      <div className="form-row">
        <div className="form-group"><label>Evaluation Period</label><input className="form-input" value={form.evaluation_period} onChange={e => set('evaluation_period', e.target.value)} placeholder="e.g., Q1 2026" /></div>
        <div className="form-group"><label>Evaluator</label><input className="form-input" value={form.evaluator} onChange={e => set('evaluator', e.target.value)} placeholder="Evaluator name" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Overall Score</label><input type="number" step="0.01" className="form-input" value={form.overall_score} onChange={e => set('overall_score', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Quality Score</label><input type="number" step="0.01" className="form-input" value={form.quality_score} onChange={e => set('quality_score', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Delivery Score</label><input type="number" step="0.01" className="form-input" value={form.delivery_score} onChange={e => set('delivery_score', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Cost Score</label><input type="number" step="0.01" className="form-input" value={form.cost_score} onChange={e => set('cost_score', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Responsiveness Score</label><input type="number" step="0.01" className="form-input" value={form.responsiveness_score} onChange={e => set('responsiveness_score', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Innovation Score</label><input type="number" step="0.01" className="form-input" value={form.innovation_score} onChange={e => set('innovation_score', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Compliance Score</label><input type="number" step="0.01" className="form-input" value={form.compliance_score} onChange={e => set('compliance_score', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Defect Rate (%)</label><input type="number" step="0.01" className="form-input" value={form.defect_rate} onChange={e => set('defect_rate', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>On-Time Delivery (%)</label><input type="number" step="0.01" className="form-input" value={form.on_time_delivery_pct} onChange={e => set('on_time_delivery_pct', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Cost Variance (%)</label><input type="number" step="0.01" className="form-input" value={form.cost_variance_pct} onChange={e => set('cost_variance_pct', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-group"><label>Corrective Actions</label><textarea className="form-textarea" value={form.corrective_actions} onChange={e => set('corrective_actions', e.target.value)} placeholder="Corrective actions required" /></div>
      <div className="form-group"><label>Improvement Plan</label><textarea className="form-textarea" value={form.improvement_plan} onChange={e => set('improvement_plan', e.target.value)} placeholder="Improvement plan details" /></div>
      <div className="form-group"><label>Status</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="draft">Draft</option><option value="submitted">Submitted</option><option value="reviewed">Reviewed</option><option value="approved">Approved</option>
        </select>
      </div>
    </>
  );
}
