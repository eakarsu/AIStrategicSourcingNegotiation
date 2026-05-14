import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const STATES = ['draft', 'dept', 'finance', 'cpo', 'awarded'];
const STATE_LABELS = {
  draft: 'Draft',
  dept: 'Department',
  finance: 'Finance',
  cpo: 'CPO',
  awarded: 'Awarded',
  rejected: 'Rejected'
};

export default function ApprovalWorkflowPage({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [workflows, setWorkflows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => { fetchWorkflows(); }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await axios.get(`${API}/api/approvals`, { headers });
      const data = res.data.data || res.data;
      setWorkflows(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load workflows'); }
    setLoading(false);
  };

  const transition = async (id, action) => {
    setTransitioning(true);
    try {
      const res = await axios.put(`${API}/api/approvals/${id}/transition`, { action, comment }, { headers });
      toast.success(`Workflow transitioned: ${res.data.transition}`);
      setComment('');
      fetchWorkflows();
      setSelected(res.data.workflow);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transition failed');
    }
    setTransitioning(false);
  };

  const getStepIndex = (status) => STATES.indexOf(status);

  const statusColor = (status) => {
    const colors = {
      draft: '#6b7280', dept: '#3b82f6', finance: '#8b5cf6',
      cpo: '#f59e0b', awarded: '#10b981', rejected: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Approval Workflow Manager</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>State machine: Draft → Department → Finance → CPO → Awarded</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
        {/* Workflow List */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Approval Requests</h2>
          {workflows.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No workflows found.</p>
          ) : (
            workflows.map(wf => (
              <div
                key={wf.id}
                onClick={() => setSelected(wf)}
                style={{
                  border: `2px solid ${selected?.id === wf.id ? statusColor(wf.status) : '#e5e7eb'}`,
                  borderRadius: '8px',
                  padding: '0.875rem',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  background: selected?.id === wf.id ? '#f8f7ff' : '#fff',
                  transition: 'border-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{wf.request_title}</div>
                  <span style={{
                    background: statusColor(wf.status),
                    color: '#fff', padding: '2px 8px', borderRadius: '12px',
                    fontSize: '0.7rem', fontWeight: 600
                  }}>{STATE_LABELS[wf.status] || wf.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {wf.department} • ${wf.amount ? Number(wf.amount).toLocaleString() : 'N/A'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {selected ? (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{selected.request_title}</h2>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                {selected.request_type} • {selected.department}
              </div>

              {/* State Machine Visualization */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                  Approval Progress
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {STATES.map((state, idx) => {
                    const currentIdx = getStepIndex(selected.status);
                    const isActive = state === selected.status;
                    const isDone = currentIdx > idx;
                    const isRejected = selected.status === 'rejected';
                    return (
                      <React.Fragment key={state}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: isRejected && isActive ? '#ef4444' : isDone ? '#10b981' : isActive ? '#7c3aed' : '#e5e7eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isDone || isActive ? '#fff' : '#9ca3af',
                            fontSize: '0.75rem', fontWeight: 700,
                            border: isActive ? '3px solid #c4b5fd' : 'none'
                          }}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: isActive ? '#7c3aed' : '#9ca3af', marginTop: '4px', textAlign: 'center', width: '50px' }}>
                            {STATE_LABELS[state]}
                          </div>
                        </div>
                        {idx < STATES.length - 1 && (
                          <div style={{
                            flex: 1, height: '2px',
                            background: isDone ? '#10b981' : '#e5e7eb',
                            marginBottom: '20px'
                          }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Details */}
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#6b7280' }}>Amount:</span> <strong>${selected.amount ? Number(selected.amount).toLocaleString() : 'N/A'}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>Priority:</span> <strong>{selected.priority}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>Requestor:</span> <strong>{selected.requestor || 'N/A'}</strong></div>
                  <div><span style={{ color: '#6b7280' }}>Due Date:</span> <strong>{selected.due_date ? new Date(selected.due_date).toLocaleDateString() : 'N/A'}</strong></div>
                </div>
                {selected.justification && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    <span style={{ color: '#6b7280' }}>Justification:</span>
                    <p style={{ marginTop: '0.25rem', color: '#374151' }}>{selected.justification}</p>
                  </div>
                )}
              </div>

              {/* Transition Actions */}
              {selected.status !== 'awarded' && selected.status !== 'rejected' && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Add Comment (optional)</div>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Enter approval comment or note..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', resize: 'vertical', minHeight: '60px', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <button
                      onClick={() => transition(selected.id, 'advance')}
                      disabled={transitioning}
                      style={{
                        background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px',
                        padding: '10px 20px', cursor: transitioning ? 'not-allowed' : 'pointer',
                        fontWeight: 600, fontSize: '0.9rem', flex: 1
                      }}
                    >
                      {transitioning ? 'Processing...' : `Advance to ${STATE_LABELS[STATES[getStepIndex(selected.status) + 1]] || 'Next'}`}
                    </button>
                    <button
                      onClick={() => transition(selected.id, 'reject')}
                      disabled={transitioning}
                      style={{
                        background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px',
                        padding: '10px 20px', cursor: transitioning ? 'not-allowed' : 'pointer',
                        fontWeight: 600, fontSize: '0.9rem'
                      }}
                    >Reject</button>
                  </div>
                </div>
              )}

              {(selected.status === 'awarded' || selected.status === 'rejected') && (
                <div style={{
                  background: selected.status === 'awarded' ? '#ecfdf5' : '#fef2f2',
                  borderRadius: '8px', padding: '1rem', textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 700, color: selected.status === 'awarded' ? '#065f46' : '#991b1b', fontSize: '1.1rem' }}>
                    {selected.status === 'awarded' ? 'Workflow Complete - Awarded!' : 'Workflow Rejected'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '12px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <p>Select a workflow to view details and take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
