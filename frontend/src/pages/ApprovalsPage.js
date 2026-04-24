import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { request_title: '', request_type: 'purchase_order', requestor: '', department: '', amount: '', justification: '', current_approver: '', approval_chain: '', current_step: 1, total_steps: 3, priority: 'medium', due_date: '', comments: '', attachments: '', status: 'pending' };

export default function ApprovalsPage({ token }) {
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
      const res = await axios.get(`${API}/api/approvals`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load approval workflows'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/approvals/${form.id}`, form, { headers });
        toast.success('Approval request updated');
      } else {
        await axios.post(`${API}/api/approvals`, form, { headers });
        toast.success('Approval request created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save approval request'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/approvals/${deleteId}`, { headers });
      toast.success('Approval request deleted');
      setShowConfirm(false);
      setDeleteId(null);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setForm({ ...item, due_date: item.due_date ? item.due_date.split('T')[0] : '' });
    setEditing(true);
    setShowModal(true);
  };

  const handleNew = () => {
    setForm(emptyForm);
    setEditing(false);
    setShowModal(true);
  };

  const handleAIReview = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/review-approval`, {
        request_title: selected.request_title,
        request_type: selected.request_type,
        amount: selected.amount,
        justification: selected.justification,
        department: selected.department
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI review failed'); }
    setAiLoading(false);
  };

  const formatAmount = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Approvals List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.request_title}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIReview} disabled={aiLoading}>
                {aiLoading ? 'Reviewing...' : 'AI Review Request'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Request Type</label><div className="value">{selected.request_type || '-'}</div></div>
            <div className="detail-field"><label>Requestor</label><div className="value">{selected.requestor || '-'}</div></div>
            <div className="detail-field"><label>Department</label><div className="value">{selected.department || '-'}</div></div>
            <div className="detail-field"><label>Amount</label><div className="value">{formatAmount(selected.amount)}</div></div>
            <div className="detail-field"><label>Priority</label><div className="value">{selected.priority || '-'}</div></div>
            <div className="detail-field"><label>Due Date</label><div className="value">{selected.due_date ? new Date(selected.due_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-field"><label>Current Approver</label><div className="value">{selected.current_approver || '-'}</div></div>
            <div className="detail-field"><label>Approval Progress</label><div className="value">{selected.current_step || 1} / {selected.total_steps || 3}</div></div>
            <div className="detail-field"><label>Status</label><div className="value">{selected.status}</div></div>
          </div>
          <div className="detail-section">
            <h3>Justification</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.justification || 'No justification provided'}</p>
          </div>
          <div className="detail-section">
            <h3>Approval Chain</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.approval_chain || 'No approval chain specified'}</p>
          </div>
          <div className="detail-section">
            <h3>Comments</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.comments || 'No comments'}</p>
          </div>
          <div className="detail-section">
            <h3>Attachments</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.attachments || 'No attachments'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Approval Request' : 'New Approval Request'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <ApprovalForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Approval Workflows</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Request</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No approval requests yet</h3><p>Create your first approval request to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Request</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Request</th><th>Type</th><th>Requestor</th><th>Amount</th><th>Step</th><th>Priority</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.request_title}</strong></td>
                  <td>{item.request_type}</td>
                  <td>{item.requestor}</td>
                  <td>{formatAmount(item.amount)}</td>
                  <td>{item.current_step || 1}/{item.total_steps || 3}</td>
                  <td>{item.priority}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Approval Request' : 'New Approval Request'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <ApprovalForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function ApprovalForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Request Title</label><input className="form-input" value={form.request_title} onChange={e => set('request_title', e.target.value)} placeholder="Request title" /></div>
      <div className="form-row">
        <div className="form-group"><label>Request Type</label>
          <select className="form-select" value={form.request_type} onChange={e => set('request_type', e.target.value)}>
            <option value="purchase_order">Purchase Order</option><option value="contract">Contract</option><option value="rfp">RFP</option><option value="budget">Budget</option><option value="vendor_onboarding">Vendor Onboarding</option><option value="change_order">Change Order</option>
          </select>
        </div>
        <div className="form-group"><label>Requestor</label><input className="form-input" value={form.requestor} onChange={e => set('requestor', e.target.value)} placeholder="Requestor name" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Department</label><input className="form-input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g., Procurement" /></div>
        <div className="form-group"><label>Amount</label><input type="number" className="form-input" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-group"><label>Justification</label><textarea className="form-textarea" value={form.justification} onChange={e => set('justification', e.target.value)} placeholder="Business justification for this request" /></div>
      <div className="form-row">
        <div className="form-group"><label>Current Approver</label><input className="form-input" value={form.current_approver} onChange={e => set('current_approver', e.target.value)} placeholder="Current approver name" /></div>
        <div className="form-group"><label>Approval Chain</label><input className="form-input" value={form.approval_chain} onChange={e => set('approval_chain', e.target.value)} placeholder="e.g., Manager > Director > VP" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Current Step</label><input type="number" className="form-input" value={form.current_step} onChange={e => set('current_step', e.target.value)} min="1" /></div>
        <div className="form-group"><label>Total Steps</label><input type="number" className="form-input" value={form.total_steps} onChange={e => set('total_steps', e.target.value)} min="1" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Priority</label>
          <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="form-group"><label>Due Date</label><input type="date" className="form-input" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="pending">Pending</option><option value="in_review">In Review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="escalated">Escalated</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label>Comments</label><textarea className="form-textarea" value={form.comments} onChange={e => set('comments', e.target.value)} placeholder="Additional comments" /></div>
      <div className="form-group"><label>Attachments</label><textarea className="form-textarea" value={form.attachments} onChange={e => set('attachments', e.target.value)} placeholder="List attachment references" /></div>
    </>
  );
}
