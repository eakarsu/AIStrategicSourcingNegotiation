import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { title: '', category: '', description: '', requirements: '', budget_range: '', deadline: '', evaluation_criteria: '', status: 'draft' };

export default function RFPPage({ token }) {
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
      const res = await axios.get(`${API}/api/rfp`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load RFPs'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/rfp/${form.id}`, form, { headers });
        toast.success('RFP updated');
      } else {
        await axios.post(`${API}/api/rfp`, form, { headers });
        toast.success('RFP created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save RFP'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/rfp/${deleteId}`, { headers });
      toast.success('RFP deleted');
      setShowConfirm(false);
      setDeleteId(null);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setForm({ ...item, deadline: item.deadline ? item.deadline.split('T')[0] : '' });
    setEditing(true);
    setShowModal(true);
  };

  const handleNew = () => {
    setForm(emptyForm);
    setEditing(false);
    setShowModal(true);
  };

  const handleAIGenerate = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/generate-rfp`, {
        title: selected.title,
        category: selected.category,
        requirements: selected.requirements,
        budget_range: selected.budget_range
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI generation failed'); }
    setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to RFP List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.title}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIGenerate} disabled={aiLoading}>
                {aiLoading ? 'Generating...' : 'Generate RFP with AI'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Category</label><div className="value">{selected.category || '-'}</div></div>
            <div className="detail-field"><label>Budget Range</label><div className="value">{selected.budget_range || '-'}</div></div>
            <div className="detail-field"><label>Deadline</label><div className="value">{selected.deadline ? new Date(selected.deadline).toLocaleDateString() : '-'}</div></div>
            <div className="detail-field"><label>Status</label><div className="value">{selected.status}</div></div>
          </div>
          <div className="detail-section">
            <h3>Description</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.description || 'No description provided'}</p>
          </div>
          <div className="detail-section">
            <h3>Requirements</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.requirements || 'No requirements specified'}</p>
          </div>
          <div className="detail-section">
            <h3>Evaluation Criteria</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.evaluation_criteria || 'No criteria specified'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit RFP' : 'New RFP'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <RFPForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>RFP Generation</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New RFP</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No RFPs yet</h3><p>Create your first RFP to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New RFP</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Category</th><th>Budget Range</th><th>Deadline</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.title}</strong></td>
                  <td>{item.category}</td>
                  <td>{item.budget_range}</td>
                  <td>{item.deadline ? new Date(item.deadline).toLocaleDateString() : '-'}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit RFP' : 'New RFP'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <RFPForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function RFPForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Title</label><input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="RFP title" /></div>
      <div className="form-row">
        <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g., IT Services" /></div>
        <div className="form-group"><label>Budget Range</label><input className="form-input" value={form.budget_range} onChange={e => set('budget_range', e.target.value)} placeholder="e.g., $100K - $500K" /></div>
      </div>
      <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the procurement need" /></div>
      <div className="form-group"><label>Requirements</label><textarea className="form-textarea" value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="Key requirements" /></div>
      <div className="form-row">
        <div className="form-group"><label>Deadline</label><input type="date" className="form-input" value={form.deadline} onChange={e => set('deadline', e.target.value)} /></div>
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label>Evaluation Criteria</label><textarea className="form-textarea" value={form.evaluation_criteria} onChange={e => set('evaluation_criteria', e.target.value)} placeholder="Criteria for evaluating responses" /></div>
    </>
  );
}
