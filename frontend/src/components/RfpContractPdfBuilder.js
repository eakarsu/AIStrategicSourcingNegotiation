import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function RfpContractPdfBuilder({ token }) {
  const [docType, setDocType] = useState('rfp');
  const [title, setTitle] = useState('Q3 IT Hardware Refresh');
  const [supplier, setSupplier] = useState('Acme Components');
  const [category, setCategory] = useState('IT Hardware');
  const [targetPrice, setTargetPrice] = useState('85000');
  const [effectiveDate, setEffectiveDate] = useState('2026-07-01');
  const [linesText, setLinesText] = useState(
    'Submit pricing breakdown by SKU\nProvide 2 reference customers\nDisclose subcontractors\nInclude sustainability score'
  );
  const [status, setStatus] = useState('');

  const generate = async () => {
    setStatus('generating...');
    try {
      const items = linesText.split('\n').map(l => l.trim()).filter(Boolean);
      const body = {
        doc_type: docType,
        title,
        supplier,
        category,
        target_price: targetPrice ? Number(targetPrice) : undefined,
        effective_date: effectiveDate,
        requirements: docType === 'rfp' ? items : undefined,
        terms: docType === 'contract' ? items : undefined,
      };
      const res = await axios.post(`${API}/api/custom-views/rfp-contract-pdf`, body, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docType}-${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setStatus('PDF downloaded.');
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const input = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #dadce0',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
  };
  const label = { display: 'block', fontSize: 12, color: '#5f6368', marginBottom: 4, marginTop: 8 };

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 style={{ marginTop: 0, color: '#202124' }}>RFP / Contract PDF Builder</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>Document Type</label>
          <select value={docType} onChange={e => setDocType(e.target.value)} style={input}>
            <option value="rfp">RFP</option>
            <option value="contract">Contract</option>
          </select>
        </div>
        <div>
          <label style={label}>Title</label>
          <input style={input} value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label style={label}>Supplier</label>
          <input style={input} value={supplier} onChange={e => setSupplier(e.target.value)} />
        </div>
        <div>
          <label style={label}>Category</label>
          <input style={input} value={category} onChange={e => setCategory(e.target.value)} />
        </div>
        <div>
          <label style={label}>Target Price (USD)</label>
          <input style={input} type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} />
        </div>
        <div>
          <label style={label}>Effective Date</label>
          <input style={input} type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
        </div>
      </div>
      <label style={label}>{docType === 'contract' ? 'Contract Terms' : 'Requirements'} (one per line)</label>
      <textarea
        rows={6}
        value={linesText}
        onChange={e => setLinesText(e.target.value)}
        style={{ ...input, fontFamily: 'monospace' }}
      />
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={generate}
          data-testid="generate-pdf-btn"
          style={{
            background: '#1a73e8',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Generate PDF
        </button>
        <span style={{ color: '#5f6368', fontSize: 13 }}>{status}</span>
      </div>
    </div>
  );
}
