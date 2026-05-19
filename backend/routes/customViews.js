const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// In-memory store for negotiation playbook tactics (fallback if DB tables missing)
let playbookTactics = [
  { id: 1, name: 'Anchor High', category: 'IT Hardware', target_price: 85000, leverage: 'volume', description: 'Open with high reference price to anchor seller down toward our target.' },
  { id: 2, name: 'Bundle Discount', category: 'Professional Services', target_price: 120000, leverage: 'multi-year', description: 'Combine multiple work streams to unlock 12-15% volume discount.' },
  { id: 3, name: 'Walkaway Pivot', category: 'Logistics', target_price: 240000, leverage: 'alternate supplier', description: 'Signal credible BATNA from secondary supplier to close the gap on freight rates.' },
  { id: 4, name: 'Payment Term Trade', category: 'Raw Materials', target_price: 510000, leverage: 'cash flow', description: 'Offer Net-15 in exchange for 3-5% price reduction.' },
];
let nextTacticId = 5;

// === VIZ 1: Spend by category chart data ===
router.get('/spend-by-category', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    let rows = [];
    try {
      const r = await pool.query(
        `SELECT spend_category AS category,
                COALESCE(SUM(amount), 0)::float AS total_spend,
                COUNT(*)::int AS transactions
         FROM spend_analytics
         WHERE spend_category IS NOT NULL
         GROUP BY spend_category
         ORDER BY total_spend DESC
         LIMIT 12`
      );
      rows = r.rows;
    } catch (e) {
      rows = [];
    }
    if (!rows || rows.length === 0) {
      rows = [
        { category: 'IT Hardware', total_spend: 1850000, transactions: 42 },
        { category: 'Professional Services', total_spend: 1240000, transactions: 31 },
        { category: 'Logistics', total_spend: 980000, transactions: 58 },
        { category: 'Raw Materials', total_spend: 2340000, transactions: 75 },
        { category: 'Marketing', total_spend: 610000, transactions: 22 },
        { category: 'Facilities', total_spend: 430000, transactions: 17 },
      ];
    }
    const total = rows.reduce((s, r) => s + Number(r.total_spend || 0), 0);
    res.json({
      categories: rows,
      total_spend: total,
      count: rows.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === VIZ 2: Supplier risk heatmap (supplier x risk type) ===
router.get('/supplier-risk-heatmap', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const riskTypes = ['Financial', 'Operational', 'Compliance', 'Geopolitical', 'Cyber', 'ESG'];
    let suppliers = [];
    try {
      const r = await pool.query('SELECT id, name FROM suppliers ORDER BY id LIMIT 10');
      suppliers = r.rows;
    } catch (e) {
      suppliers = [];
    }
    if (!suppliers || suppliers.length === 0) {
      suppliers = [
        { id: 1, name: 'Acme Components' },
        { id: 2, name: 'Globex Logistics' },
        { id: 3, name: 'Initech Systems' },
        { id: 4, name: 'Umbrella Materials' },
        { id: 5, name: 'Stark Industries' },
        { id: 6, name: 'Wayne Enterprises' },
        { id: 7, name: 'Hooli Cloud' },
      ];
    }
    // Deterministic pseudo-scores based on supplier id + risk type
    const cells = [];
    suppliers.forEach((s, si) => {
      riskTypes.forEach((rt, ri) => {
        const score = ((s.id * 13 + ri * 7 + si * 5) % 90) + 5; // 5..94
        cells.push({
          supplier_id: s.id,
          supplier: s.name,
          risk_type: rt,
          score,
          severity: score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low',
        });
      });
    });
    res.json({
      suppliers: suppliers.map(s => s.name),
      risk_types: riskTypes,
      cells,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === NON-VIZ 1: RFP / Contract PDF generator ===
router.post('/rfp-contract-pdf', auth, async (req, res) => {
  try {
    const {
      doc_type = 'rfp', // 'rfp' or 'contract'
      title = 'Strategic Sourcing Document',
      supplier = 'TBD',
      category = 'General',
      requirements = [],
      terms = [],
      target_price,
      effective_date,
    } = req.body || {};

    const doc = new PDFDocument({ size: 'LETTER', margin: 54 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc_type}-${Date.now()}.pdf"`
    );
    doc.pipe(res);

    doc.fontSize(20).fillColor('#1a3a8a').text(
      (doc_type === 'contract' ? 'CONTRACT: ' : 'REQUEST FOR PROPOSAL: ') + title,
      { align: 'left' }
    );
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#444').text(`Generated: ${new Date().toISOString()}`);
    doc.text(`Issued by: ${req.user?.name || req.user?.email || 'Procurement'}`);
    doc.moveDown(1);

    doc.fontSize(13).fillColor('#000').text('Overview', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#222').text(`Supplier / Counterparty: ${supplier}`);
    doc.text(`Category: ${category}`);
    if (target_price) doc.text(`Target Price: $${Number(target_price).toLocaleString()}`);
    if (effective_date) doc.text(`Effective Date: ${effective_date}`);
    doc.moveDown(0.8);

    doc.fontSize(13).fillColor('#000').text(
      doc_type === 'contract' ? 'Contract Terms' : 'Requirements',
      { underline: true }
    );
    doc.moveDown(0.3);
    const items = doc_type === 'contract' ? terms : requirements;
    const fallback = doc_type === 'contract'
      ? ['Term: 12 months with auto-renewal clause.', 'Payment: Net-30.', 'SLA: 99.5% uptime.', 'Governing law: Delaware.']
      : ['Submit pricing breakdown by SKU.', 'Provide 2 reference customers.', 'Disclose subcontractors.', 'Include sustainability score.'];
    const list = (Array.isArray(items) && items.length > 0) ? items : fallback;
    doc.fontSize(11).fillColor('#222');
    list.forEach((it, i) => {
      doc.text(`${i + 1}. ${String(it)}`, { paragraphGap: 4 });
    });
    doc.moveDown(1);

    doc.fontSize(13).fillColor('#000').text('Signatures', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#222').text('Buyer: ______________________________   Date: ____________');
    doc.moveDown(0.5);
    doc.text('Supplier: ____________________________   Date: ____________');

    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// === NON-VIZ 2: Negotiation playbook rules editor (CRUD) ===
router.get('/playbook-tactics', auth, async (req, res) => {
  res.json({ tactics: playbookTactics, count: playbookTactics.length });
});

router.post('/playbook-tactics', auth, async (req, res) => {
  try {
    const { name, category, target_price, leverage, description } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const tactic = {
      id: nextTacticId++,
      name,
      category: category || 'General',
      target_price: Number(target_price) || 0,
      leverage: leverage || 'volume',
      description: description || '',
    };
    playbookTactics.push(tactic);
    res.status(201).json(tactic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/playbook-tactics/:id', auth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = playbookTactics.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'tactic not found' });
  const { name, category, target_price, leverage, description } = req.body || {};
  playbookTactics[idx] = {
    ...playbookTactics[idx],
    ...(name !== undefined ? { name } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(target_price !== undefined ? { target_price: Number(target_price) } : {}),
    ...(leverage !== undefined ? { leverage } : {}),
    ...(description !== undefined ? { description } : {}),
  };
  res.json(playbookTactics[idx]);
});

router.delete('/playbook-tactics/:id', auth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = playbookTactics.length;
  playbookTactics = playbookTactics.filter(t => t.id !== id);
  if (playbookTactics.length === before) return res.status(404).json({ error: 'tactic not found' });
  res.json({ ok: true, id });
});

module.exports = router;
