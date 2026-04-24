import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AIOutput from '../components/AIOutput';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emptyForm = { report_title: '', commodity: '', market_segment: '', current_price: '', price_trend: 'stable', price_change_pct: '', supply_outlook: 'balanced', demand_outlook: 'stable', key_drivers: '', competitor_activity: '', forecast_summary: '', data_source: '', report_date: '', region: '', impact_assessment: '', status: 'current' };

export default function MarketIntelPage({ token }) {
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
      const res = await axios.get(`${API}/api/market-intel`, { headers });
      setItems(res.data);
    } catch (err) { toast.error('Failed to load reports'); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/api/market-intel/${form.id}`, form, { headers });
        toast.success('Report updated');
      } else {
        await axios.post(`${API}/api/market-intel`, form, { headers });
        toast.success('Report created');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(false);
      fetchItems();
    } catch (err) { toast.error('Failed to save report'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/api/market-intel/${deleteId}`, { headers });
      toast.success('Report deleted');
      setShowConfirm(false);
      setDeleteId(null);
      if (selected?.id === deleteId) setSelected(null);
      fetchItems();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const handleEdit = (item) => {
    setForm({ ...item, report_date: item.report_date ? item.report_date.split('T')[0] : '' });
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
      const res = await axios.post(`${API}/api/ai/market-analysis`, {
        report_title: selected.report_title,
        commodity: selected.commodity,
        current_price: selected.current_price,
        price_trend: selected.price_trend,
        supply_outlook: selected.supply_outlook,
        demand_outlook: selected.demand_outlook,
        key_drivers: selected.key_drivers
      }, { headers });
      setAiResult(res.data);
    } catch (err) { toast.error('AI analysis failed'); }
    setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <button className="back-link" onClick={() => { setSelected(null); setAiResult(null); }}>
          ← Back to Report List
        </button>
        <div className="detail-container">
          <div className="detail-header">
            <div>
              <h2>{selected.report_title}</h2>
              <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDeleteId(selected.id); setShowConfirm(true); }}>Delete</button>
              <button className="btn btn-success btn-sm" onClick={handleAIAnalysis} disabled={aiLoading}>
                {aiLoading ? 'Analyzing...' : 'AI Market Analysis'}
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Commodity</label><div className="value">{selected.commodity || '-'}</div></div>
            <div className="detail-field"><label>Market Segment</label><div className="value">{selected.market_segment || '-'}</div></div>
            <div className="detail-field"><label>Current Price</label><div className="value">{selected.current_price ? `$${selected.current_price}` : '-'}</div></div>
            <div className="detail-field"><label>Price Trend</label><div className="value">{selected.price_trend || '-'}</div></div>
            <div className="detail-field"><label>Price Change %</label><div className="value">{selected.price_change_pct ? `${selected.price_change_pct}%` : '-'}</div></div>
            <div className="detail-field"><label>Supply Outlook</label><div className="value">{selected.supply_outlook || '-'}</div></div>
            <div className="detail-field"><label>Demand Outlook</label><div className="value">{selected.demand_outlook || '-'}</div></div>
            <div className="detail-field"><label>Region</label><div className="value">{selected.region || '-'}</div></div>
            <div className="detail-field"><label>Data Source</label><div className="value">{selected.data_source || '-'}</div></div>
            <div className="detail-field"><label>Report Date</label><div className="value">{selected.report_date ? new Date(selected.report_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-field"><label>Status</label><div className="value">{selected.status}</div></div>
          </div>
          <div className="detail-section">
            <h3>Key Drivers</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.key_drivers || 'No key drivers specified'}</p>
          </div>
          <div className="detail-section">
            <h3>Competitor Activity</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.competitor_activity || 'No competitor activity noted'}</p>
          </div>
          <div className="detail-section">
            <h3>Forecast Summary</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.forecast_summary || 'No forecast summary provided'}</p>
          </div>
          <div className="detail-section">
            <h3>Impact Assessment</h3>
            <p style={{ lineHeight: 1.6 }}>{selected.impact_assessment || 'No impact assessment provided'}</p>
          </div>
          <AIOutput result={aiResult?.result} type={aiResult?.type} loading={aiLoading} />
        </div>
        <ConfirmDialog show={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete} />
        <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Report' : 'New Report'}
          footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
          <MarketIntelForm form={form} setForm={setForm} />
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Dashboard</button>
          <h1>Market Intelligence</h1>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>+ New Report</button>
      </div>
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Loading...</span></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No reports yet</h3><p>Create your first market intelligence report to get started</p><button className="btn btn-primary" onClick={handleNew}>+ New Report</button></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Report</th><th>Commodity</th><th>Price</th><th>Trend</th><th>Supply</th><th>Demand</th><th>Status</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td><strong>{item.report_title}</strong></td>
                  <td>{item.commodity}</td>
                  <td>{item.current_price ? `$${item.current_price}` : '-'}</td>
                  <td>{item.price_trend}</td>
                  <td>{item.supply_outlook}</td>
                  <td>{item.demand_outlook}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Report' : 'New Report'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
        <MarketIntelForm form={form} setForm={setForm} />
      </Modal>
    </div>
  );
}

function MarketIntelForm({ form, setForm }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div className="form-group"><label>Report Title</label><input className="form-input" value={form.report_title} onChange={e => set('report_title', e.target.value)} placeholder="Report title" /></div>
      <div className="form-row">
        <div className="form-group"><label>Commodity</label><input className="form-input" value={form.commodity} onChange={e => set('commodity', e.target.value)} placeholder="e.g., Steel, Copper" /></div>
        <div className="form-group"><label>Market Segment</label><input className="form-input" value={form.market_segment} onChange={e => set('market_segment', e.target.value)} placeholder="e.g., Industrial Metals" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Current Price</label><input type="number" step="0.01" className="form-input" value={form.current_price} onChange={e => set('current_price', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Price Trend</label>
          <select className="form-select" value={form.price_trend} onChange={e => set('price_trend', e.target.value)}>
            <option value="rising">Rising</option><option value="falling">Falling</option><option value="stable">Stable</option><option value="volatile">Volatile</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Price Change %</label><input type="number" step="0.01" className="form-input" value={form.price_change_pct} onChange={e => set('price_change_pct', e.target.value)} placeholder="0.00" /></div>
        <div className="form-group"><label>Supply Outlook</label>
          <select className="form-select" value={form.supply_outlook} onChange={e => set('supply_outlook', e.target.value)}>
            <option value="surplus">Surplus</option><option value="balanced">Balanced</option><option value="tight">Tight</option><option value="shortage">Shortage</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Demand Outlook</label>
          <select className="form-select" value={form.demand_outlook} onChange={e => set('demand_outlook', e.target.value)}>
            <option value="growing">Growing</option><option value="stable">Stable</option><option value="declining">Declining</option>
          </select>
        </div>
        <div className="form-group"><label>Region</label><input className="form-input" value={form.region} onChange={e => set('region', e.target.value)} placeholder="e.g., North America" /></div>
      </div>
      <div className="form-group"><label>Key Drivers</label><textarea className="form-textarea" value={form.key_drivers} onChange={e => set('key_drivers', e.target.value)} placeholder="Key market drivers" /></div>
      <div className="form-group"><label>Competitor Activity</label><textarea className="form-textarea" value={form.competitor_activity} onChange={e => set('competitor_activity', e.target.value)} placeholder="Notable competitor activity" /></div>
      <div className="form-group"><label>Forecast Summary</label><textarea className="form-textarea" value={form.forecast_summary} onChange={e => set('forecast_summary', e.target.value)} placeholder="Market forecast summary" /></div>
      <div className="form-group"><label>Impact Assessment</label><textarea className="form-textarea" value={form.impact_assessment} onChange={e => set('impact_assessment', e.target.value)} placeholder="Impact on sourcing strategy" /></div>
      <div className="form-row">
        <div className="form-group"><label>Data Source</label><input className="form-input" value={form.data_source} onChange={e => set('data_source', e.target.value)} placeholder="e.g., Bloomberg, Internal" /></div>
        <div className="form-group"><label>Report Date</label><input type="date" className="form-input" value={form.report_date} onChange={e => set('report_date', e.target.value)} /></div>
      </div>
      <div className="form-group"><label>Status</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="current">Current</option><option value="outdated">Outdated</option><option value="archived">Archived</option>
        </select>
      </div>
    </>
  );
}
