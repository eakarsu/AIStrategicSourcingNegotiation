import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { auction_title: '', category: '', auction_type: 'reverse', description: '', starting_price: '', reserve_price: '', current_best_bid: '', number_of_bidders: '', start_time: '', end_time: '', bid_decrement: '', auto_extend: true, winning_vendor: '', items_description: '', status: 'scheduled' };

export default function AuctionsPage({ token }) {
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
      const res = await axios.get(`${API}/api/auctions`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load Auctions'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/auctions/${form.id}`, form, { headers });
        toast.success('Auction updated');
      } else {
        await axios.post(`${API}/api/auctions`, form, { headers });
        toast.success('Auction created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save Auction'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/auctions/${deleteId}`, { headers });
      toast.success('Auction deleted');
      setShowConfirm(false);
      setDeleteId(null);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setForm({ ...item, start_time: item.start_time ? item.start_time.split('T')[0] + 'T' + (item.start_time.split('T')[1] || '').slice(0, 5) : '', end_time: item.end_time ? item.end_time.split('T')[0] + 'T' + (item.end_time.split('T')[1] || '').slice(0, 5) : '' });
    setEditing(true);
    setShowModal(true);
  };

  const handleNew = () => {
    setForm(emptyForm);
    setEditing(false);
    setShowModal(true);
  };

  const handleAIStrategy = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API}/api/ai/auction-strategy`, {
        auction_title: selected.auction_title,
        category: selected.category,
        auction_type: selected.auction_type,
        starting_price: selected.starting_price,
        reserve_price: selected.reserve_price,
        number_of_bidders: selected.number_of_bidders
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI strategy generation failed'); }
    setAiLoading(false);
  };

  const formatCurrency = (val) => val != null && val !== '' ? `$${Number(val).toLocaleString()}` : '-';
  const formatDateTime = (val) => val ? new Date(val).toLocaleString() : '-';

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Auction List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.auction_title}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIStrategy} disabled={aiLoading}>
                {aiLoading ? 'Generating...' : 'AI Auction Strategy'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Category</label><div className="value">{selected.category || '-'}</div></div>
            <div className="detail-field"><label>Auction Type</label><div className="value">{selected.auction_type || '-'}</div></div>
            <div className="detail-field"><label>Starting Price</label><div className="value">{formatCurrency(selected.starting_price)}</div></div>
            <div className="detail-field"><label>Reserve Price</label><div className="value">{formatCurrency(selected.reserve_price)}</div></div>
            <div className="detail-field"><label>Current Best Bid</label><div className="value">{formatCurrency(selected.current_best_bid)}</div></div>
            <div className="detail-field"><label>Number of Bidders</label><div className="value">{selected.number_of_bidders || '-'}</div></div>
            <div className="detail-field"><label>Start Time</label><div className="value">{formatDateTime(selected.start_time)}</div></div>
            <div className="detail-field"><label>End Time</label><div className="value">{formatDateTime(selected.end_time)}</div></div>
            <div className="detail-field"><label>Bid Decrement</label><div className="value">{formatCurrency(selected.bid_decrement)}</div></div>
            <div className="detail-field"><label>Auto Extend</label><div className="value">{selected.auto_extend ? 'Yes' : 'No'}</div></div>
            <div className="detail-field"><label>Winning Vendor</label><div className="value">{selected.winning_vendor || '-'}</div></div>
            <div className="detail-field"><label>Status</label><div className="value">{selected.status}</div></div>
          </div>
          <div className="detail-section">
            <h3>Description</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.description || 'No description provided'}</p>
          </div>
          <div className="detail-section">
            <h3>Items Description</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.items_description || 'No items description provided'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Auction' : 'New Auction'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <AuctionForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Auction Management</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Auction</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No Auctions yet</h3><p>Create your first Auction to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Auction</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Type</th><th>Starting Price</th><th>Best Bid</th><th>Bidders</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.auction_title}</strong></td>
                  <td>{item.auction_type}</td>
                  <td>{item.starting_price != null ? `$${Number(item.starting_price).toLocaleString()}` : '-'}</td>
                  <td>{item.current_best_bid != null ? `$${Number(item.current_best_bid).toLocaleString()}` : '-'}</td>
                  <td>{item.number_of_bidders || '-'}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Auction' : 'New Auction'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <AuctionForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function AuctionForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Auction Title</label><input className="form-input" value={form.auction_title} onChange={e => set('auction_title', e.target.value)} placeholder="Auction title" /></div>
      <div className="form-row">
        <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g., IT Equipment" /></div>
        <div className="form-group"><label>Auction Type</label>
          <select className="form-select" value={form.auction_type} onChange={e => set('auction_type', e.target.value)}>
            <option value="reverse">Reverse</option><option value="forward">Forward</option><option value="sealed_bid">Sealed Bid</option><option value="dutch">Dutch</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the auction" /></div>
      <div className="form-row">
        <div className="form-group"><label>Starting Price</label><input type="number" step="0.01" className="form-input" value={form.starting_price} onChange={e => set('starting_price', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Reserve Price</label><input type="number" step="0.01" className="form-input" value={form.reserve_price} onChange={e => set('reserve_price', e.target.value)} placeholder="0.00" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Current Best Bid</label><input type="number" step="0.01" className="form-input" value={form.current_best_bid} onChange={e => set('current_best_bid', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Number of Bidders</label><input type="number" className="form-input" value={form.number_of_bidders} onChange={e => set('number_of_bidders', e.target.value)} placeholder="0" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Start Time</label><input type="datetime-local" className="form-input" value={form.start_time} onChange={e => set('start_time', e.target.value)} /></div>
        <div className="form-group"><label>End Time</label><input type="datetime-local" className="form-input" value={form.end_time} onChange={e => set('end_time', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Bid Decrement</label><input type="number" step="0.01" className="form-input" value={form.bid_decrement} onChange={e => set('bid_decrement', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Auto Extend</label>
          <select className="form-select" value={form.auto_extend} onChange={e => set('auto_extend', e.target.value === 'true')}>
            <option value="true">Yes</option><option value="false">No</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Winning Vendor</label><input className="form-input" value={form.winning_vendor} onChange={e => set('winning_vendor', e.target.value)} placeholder="Vendor name" /></div>
        <div className="form-group"><label>Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="scheduled">Scheduled</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="form-group"><label>Items Description</label><textarea className="form-textarea" value={form.items_description} onChange={e => set('items_description', e.target.value)} placeholder="Describe items being auctioned" /></div>
    </>
  );
}
