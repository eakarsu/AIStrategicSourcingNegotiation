import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { requirement_name: '', regulation_type: 'SOX', vendor_name: '', compliance_status: 'under_review', last_audit_date: '', next_audit_date: '', audit_findings: '', corrective_actions: '', documentation_status: 'pending', risk_rating: 'medium', responsible_party: '', evidence_links: '', notes: '' };

const statusColors = { compliant: 'green', non_compliant: 'red', partial: 'yellow', under_review: 'blue', expired: 'gray' };

export default function CompliancePage({ token }) {
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
      const res = await axios.get(`${API}/api/compliance`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load compliance records'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/compliance/${form.id}`, form, { headers });
        toast.success('Compliance record updated');
      } else {
        await axios.post(`${API}/api/compliance`, form, { headers });
        toast.success('Compliance record created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save compliance record'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/compliance/${deleteId}`, { headers });
      toast.success('Compliance record deleted');
      setShowConfirm(false);
      setDeleteId(null);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setForm({ ...item, last_audit_date: item.last_audit_date ? item.last_audit_date.split('T')[0] : '', next_audit_date: item.next_audit_date ? item.next_audit_date.split('T')[0] : '' });
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
      const res = await axios.post(`${API}/api/ai/compliance-review`, {
        requirement_name: selected.requirement_name,
        regulation_type: selected.regulation_type,
        vendor_name: selected.vendor_name,
        compliance_status: selected.compliance_status,
        audit_findings: selected.audit_findings,
        corrective_actions: selected.corrective_actions
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI compliance review failed'); }
    setAiLoading(false);
  };

  const getStatusStyle = (status) => {
    const color = statusColors[status] || 'gray';
    return `status-badge status-${color}`;
  };

  const formatStatus = (status) => {
    return status ? status.replace(/_/g, ' ') : '-';
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Compliance List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.requirement_name}</h2>
              <span className={getStatusStyle(selected.compliance_status)}>{formatStatus(selected.compliance_status)}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIReview} disabled={aiLoading}>
                {aiLoading ? 'Reviewing...' : 'AI Compliance Review'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Regulation Type</label><div className="value">{selected.regulation_type || '-'}</div></div>
            <div className="detail-field"><label>Vendor</label><div className="value">{selected.vendor_name || '-'}</div></div>
            <div className="detail-field"><label>Last Audit Date</label><div className="value">{selected.last_audit_date ? new Date(selected.last_audit_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-field"><label>Next Audit Date</label><div className="value">{selected.next_audit_date ? new Date(selected.next_audit_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-field"><label>Documentation Status</label><div className="value">{formatStatus(selected.documentation_status)}</div></div>
            <div className="detail-field"><label>Risk Rating</label><div className="value">{selected.risk_rating || '-'}</div></div>
            <div className="detail-field"><label>Responsible Party</label><div className="value">{selected.responsible_party || '-'}</div></div>
            <div className="detail-field"><label>Compliance Status</label><div className="value">{formatStatus(selected.compliance_status)}</div></div>
          </div>
          <div className="detail-section">
            <h3>Audit Findings</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.audit_findings || 'No audit findings recorded'}</p>
          </div>
          <div className="detail-section">
            <h3>Corrective Actions</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.corrective_actions || 'No corrective actions specified'}</p>
          </div>
          <div className="detail-section">
            <h3>Evidence Links</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.evidence_links || 'No evidence links provided'}</p>
          </div>
          <div className="detail-section">
            <h3>Notes</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.notes || 'No notes'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Compliance Record' : 'New Compliance Record'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <ComplianceForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Compliance Tracking</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Compliance Record</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No compliance records yet</h3><p>Create your first compliance record to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Compliance Record</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Requirement</th><th>Regulation</th><th>Vendor</th><th>Status</th><th>Last Audit</th><th>Next Audit</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.requirement_name}</strong></td>
                  <td>{item.regulation_type}</td>
                  <td>{item.vendor_name}</td>
                  <td><span className={getStatusStyle(item.compliance_status)}>{formatStatus(item.compliance_status)}</span></td>
                  <td>{item.last_audit_date ? new Date(item.last_audit_date).toLocaleDateString() : '-'}</td>
                  <td>{item.next_audit_date ? new Date(item.next_audit_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Compliance Record' : 'New Compliance Record'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <ComplianceForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function ComplianceForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Requirement Name</label><input className="form-input" value={form.requirement_name} onChange={e => set('requirement_name', e.target.value)} placeholder="Requirement name" /></div>
      <div className="form-row">
        <div className="form-group"><label>Regulation Type</label>
          <select className="form-select" value={form.regulation_type} onChange={e => set('regulation_type', e.target.value)}>
            <option value="SOX">SOX</option><option value="GDPR">GDPR</option><option value="HIPAA">HIPAA</option><option value="ISO_9001">ISO 9001</option><option value="ISO_27001">ISO 27001</option><option value="OSHA">OSHA</option><option value="EPA">EPA</option><option value="FAR">FAR</option><option value="DFAR">DFAR</option><option value="ITAR">ITAR</option>
          </select>
        </div>
        <div className="form-group"><label>Vendor Name</label><input className="form-input" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="Vendor name" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Compliance Status</label>
          <select className="form-select" value={form.compliance_status} onChange={e => set('compliance_status', e.target.value)}>
            <option value="compliant">Compliant</option><option value="non_compliant">Non-Compliant</option><option value="partial">Partial</option><option value="under_review">Under Review</option><option value="expired">Expired</option>
          </select>
        </div>
        <div className="form-group"><label>Risk Rating</label>
          <select className="form-select" value={form.risk_rating} onChange={e => set('risk_rating', e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Last Audit Date</label><input type="date" className="form-input" value={form.last_audit_date} onChange={e => set('last_audit_date', e.target.value)} /></div>
        <div className="form-group"><label>Next Audit Date</label><input type="date" className="form-input" value={form.next_audit_date} onChange={e => set('next_audit_date', e.target.value)} /></div>
      </div>
      <div className="form-group"><label>Audit Findings</label><textarea className="form-textarea" value={form.audit_findings} onChange={e => set('audit_findings', e.target.value)} placeholder="Audit findings" /></div>
      <div className="form-group"><label>Corrective Actions</label><textarea className="form-textarea" value={form.corrective_actions} onChange={e => set('corrective_actions', e.target.value)} placeholder="Corrective actions required" /></div>
      <div className="form-row">
        <div className="form-group"><label>Documentation Status</label>
          <select className="form-select" value={form.documentation_status} onChange={e => set('documentation_status', e.target.value)}>
            <option value="complete">Complete</option><option value="incomplete">Incomplete</option><option value="pending">Pending</option>
          </select>
        </div>
        <div className="form-group"><label>Responsible Party</label><input className="form-input" value={form.responsible_party} onChange={e => set('responsible_party', e.target.value)} placeholder="Responsible person/team" /></div>
      </div>
      <div className="form-group"><label>Evidence Links</label><textarea className="form-textarea" value={form.evidence_links} onChange={e => set('evidence_links', e.target.value)} placeholder="Links to evidence documents" /></div>
      <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes" /></div>
    </>
  );
}
