import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { assessment_title: '', vendor_name: '', risk_category: 'financial', risk_level: 'low', probability: '', impact_score: '', risk_score: '', description: '', mitigation_strategy: '', contingency_plan: '', owner: '', review_date: '', status: 'identified' };

const riskLevelColors = { critical: '#e74c3c', high: '#e67e22', medium: '#f1c40f', low: '#27ae60' };

export default function RiskAssessmentPage({ token }) {
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
      const res = await axios.get(`${API}/api/risk-assessment`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load risk assessments'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/risk-assessment/${form.id}`, form, { headers });
        toast.success('Risk assessment updated');
      } else {
        await axios.post(`${API}/api/risk-assessment`, form, { headers });
        toast.success('Risk assessment created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save risk assessment'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/risk-assessment/${deleteId}`, { headers });
      toast.success('Risk assessment deleted');
      setShowConfirm(false);
      setDeleteId(null);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setForm({ ...item, review_date: item.review_date ? item.review_date.split('T')[0] : '' });
    setEditing(true);
    setShowModal(true);
  };

  const handleNew = () => {
    setForm(emptyForm);
    setEditing(false);
    setShowModal(true);
  };

  const handleAIAssess = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/assess-risk`, {
        assessment_title: selected.assessment_title,
        vendor_name: selected.vendor_name,
        risk_category: selected.risk_category,
        risk_level: selected.risk_level,
        description: selected.description,
        mitigation_strategy: selected.mitigation_strategy
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI risk assessment failed'); }
    setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Risk Assessment List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.assessment_title}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIAssess} disabled={aiLoading}>
                {aiLoading ? 'Assessing...' : 'AI Assess Risk'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Vendor</label><div className="value">{selected.vendor_name || '-'}</div></div>
            <div className="detail-field"><label>Risk Category</label><div className="value">{selected.risk_category || '-'}</div></div>
            <div className="detail-field">
              <label>Risk Level</label>
              <div className="value">
                <span style={{ color: '#fff', backgroundColor: riskLevelColors[selected.risk_level] || '#999', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85em' }}>
                  {selected.risk_level}
                </span>
              </div>
            </div>
            <div className="detail-field"><label>Probability</label><div className="value">{selected.probability ?? '-'}</div></div>
            <div className="detail-field"><label>Impact Score</label><div className="value">{selected.impact_score ?? '-'}</div></div>
            <div className="detail-field"><label>Risk Score</label><div className="value">{selected.risk_score ?? '-'}</div></div>
            <div className="detail-field"><label>Owner</label><div className="value">{selected.owner || '-'}</div></div>
            <div className="detail-field"><label>Review Date</label><div className="value">{selected.review_date ? new Date(selected.review_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-field"><label>Status</label><div className="value">{selected.status}</div></div>
          </div>
          <div className="detail-section">
            <h3>Description</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.description || 'No description provided'}</p>
          </div>
          <div className="detail-section">
            <h3>Mitigation Strategy</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.mitigation_strategy || 'No mitigation strategy specified'}</p>
          </div>
          <div className="detail-section">
            <h3>Contingency Plan</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.contingency_plan || 'No contingency plan specified'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Risk Assessment' : 'New Risk Assessment'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <RiskAssessmentForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Risk Assessment</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Risk Assessment</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No risk assessments yet</h3><p>Create your first risk assessment to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Risk Assessment</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Vendor</th><th>Risk Category</th><th>Risk Level</th><th>Risk Score</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.assessment_title}</strong></td>
                  <td>{item.vendor_name}</td>
                  <td>{item.risk_category}</td>
                  <td>
                    <span style={{ color: '#fff', backgroundColor: riskLevelColors[item.risk_level] || '#999', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85em' }}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td>{item.risk_score ?? '-'}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Risk Assessment' : 'New Risk Assessment'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <RiskAssessmentForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function RiskAssessmentForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Assessment Title</label><input className="form-input" value={form.assessment_title} onChange={e => set('assessment_title', e.target.value)} placeholder="Risk assessment title" /></div>
      <div className="form-row">
        <div className="form-group"><label>Vendor Name</label><input className="form-input" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="Vendor name" /></div>
        <div className="form-group"><label>Owner</label><input className="form-input" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Risk owner" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Risk Category</label>
          <select className="form-select" value={form.risk_category} onChange={e => set('risk_category', e.target.value)}>
            <option value="financial">Financial</option><option value="operational">Operational</option><option value="compliance">Compliance</option><option value="geopolitical">Geopolitical</option><option value="supply_chain">Supply Chain</option><option value="cybersecurity">Cybersecurity</option>
          </select>
        </div>
        <div className="form-group"><label>Risk Level</label>
          <select className="form-select" value={form.risk_level} onChange={e => set('risk_level', e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Probability</label><input type="number" step="0.01" className="form-input" value={form.probability} onChange={e => set('probability', e.target.value)} placeholder="0.00 - 1.00" /></div>
        <div className="form-group"><label>Impact Score</label><input type="number" step="0.01" className="form-input" value={form.impact_score} onChange={e => set('impact_score', e.target.value)} placeholder="0.00 - 10.00" /></div>
        <div className="form-group"><label>Risk Score</label><input type="number" step="0.01" className="form-input" value={form.risk_score} onChange={e => set('risk_score', e.target.value)} placeholder="0.00 - 10.00" /></div>
      </div>
      <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the risk" /></div>
      <div className="form-group"><label>Mitigation Strategy</label><textarea className="form-textarea" value={form.mitigation_strategy} onChange={e => set('mitigation_strategy', e.target.value)} placeholder="How to mitigate this risk" /></div>
      <div className="form-group"><label>Contingency Plan</label><textarea className="form-textarea" value={form.contingency_plan} onChange={e => set('contingency_plan', e.target.value)} placeholder="Contingency plan if risk materializes" /></div>
      <div className="form-row">
        <div className="form-group"><label>Review Date</label><input type="date" className="form-input" value={form.review_date} onChange={e => set('review_date', e.target.value)} /></div>
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="identified">Identified</option><option value="mitigating">Mitigating</option><option value="resolved">Resolved</option><option value="monitoring">Monitoring</option>
          </select>
        </div>
      </div>
    </>
  );
}
