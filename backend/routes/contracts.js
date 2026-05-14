const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// Get all contracts with pagination
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [result, count] = await Promise.all([
      pool.query('SELECT * FROM contracts ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM contracts')
    ]);

    res.json({
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(count.rows[0].count),
        totalPages: Math.ceil(parseInt(count.rows[0].count) / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single contract
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contract not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate PDF for contract
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contract not found' });

    const contract = result.rows[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contract-${contract.id}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('CONTRACT AGREEMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(contract.contract_title || 'Untitled Contract', { align: 'center' });
    doc.moveDown();

    // Metadata
    doc.fontSize(10).font('Helvetica');
    doc.text(`Contract ID: ${contract.id}`);
    doc.text(`Date: ${new Date(contract.created_at).toLocaleDateString()}`);
    doc.text(`Status: ${contract.status}`);
    doc.moveDown();

    // Parties
    doc.fontSize(12).font('Helvetica-Bold').text('PARTIES');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Vendor: ${contract.vendor_name || 'N/A'}`);
    doc.text(`Contract Type: ${contract.contract_type || 'N/A'}`);
    doc.moveDown();

    // Financial Terms
    doc.fontSize(12).font('Helvetica-Bold').text('FINANCIAL TERMS');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Value: $${contract.total_value ? Number(contract.total_value).toLocaleString() : 'N/A'}`);
    doc.text(`Start Date: ${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A'}`);
    doc.text(`End Date: ${contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A'}`);
    doc.text(`Payment Schedule: ${contract.payment_schedule || 'N/A'}`);
    doc.moveDown();

    // Terms & Conditions
    if (contract.terms_conditions) {
      doc.fontSize(12).font('Helvetica-Bold').text('TERMS & CONDITIONS');
      doc.fontSize(10).font('Helvetica').text(contract.terms_conditions, { width: 500 });
      doc.moveDown();
    }

    // SLA Terms
    if (contract.sla_terms) {
      doc.fontSize(12).font('Helvetica-Bold').text('SERVICE LEVEL AGREEMENTS');
      doc.fontSize(10).font('Helvetica').text(contract.sla_terms, { width: 500 });
      doc.moveDown();
    }

    // Termination
    if (contract.termination_clause) {
      doc.fontSize(12).font('Helvetica-Bold').text('TERMINATION CLAUSE');
      doc.fontSize(10).font('Helvetica').text(contract.termination_clause, { width: 500 });
      doc.moveDown();
    }

    // Signature block
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').text('SIGNATURES');
    doc.fontSize(10).font('Helvetica');
    doc.text('_____________________________          _____________________________');
    doc.text('Authorized Signatory                          Vendor Representative');
    doc.text(`Date: ___________________                Date: ___________________`);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create contract
router.post('/', auth, async (req, res) => {
  try {
    const { contract_title, vendor_name, contract_type, start_date, end_date, total_value, payment_schedule, terms_conditions, sla_terms, termination_clause, renewal_terms, governing_law, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO contracts (contract_title, vendor_name, contract_type, start_date, end_date, total_value, payment_schedule, terms_conditions, sla_terms, termination_clause, renewal_terms, governing_law, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [contract_title, vendor_name, contract_type, start_date, end_date, total_value, payment_schedule, terms_conditions, sla_terms, termination_clause, renewal_terms, governing_law, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update contract
router.put('/:id', auth, async (req, res) => {
  try {
    const { contract_title, vendor_name, contract_type, start_date, end_date, total_value, payment_schedule, terms_conditions, sla_terms, termination_clause, renewal_terms, governing_law, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE contracts SET contract_title=$1, vendor_name=$2, contract_type=$3, start_date=$4, end_date=$5, total_value=$6, payment_schedule=$7, terms_conditions=$8, sla_terms=$9, termination_clause=$10, renewal_terms=$11, governing_law=$12, status=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [contract_title, vendor_name, contract_type, start_date, end_date, total_value, payment_schedule, terms_conditions, sla_terms, termination_clause, renewal_terms, governing_law, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contract not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete contract
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM contracts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contract not found' });
    res.json({ message: 'Contract deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
