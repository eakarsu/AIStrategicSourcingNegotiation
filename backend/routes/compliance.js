const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all compliance records
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM compliance_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single compliance record
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM compliance_records WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Compliance record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create compliance record
router.post('/', auth, async (req, res) => {
  try {
    const { requirement_name, regulation_type, vendor_name, compliance_status, last_audit_date, next_audit_date, audit_findings, corrective_actions, documentation_status, risk_rating, responsible_party, evidence_links, notes } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO compliance_records (requirement_name, regulation_type, vendor_name, compliance_status, last_audit_date, next_audit_date, audit_findings, corrective_actions, documentation_status, risk_rating, responsible_party, evidence_links, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [requirement_name, regulation_type, vendor_name, compliance_status || 'under_review', last_audit_date, next_audit_date, audit_findings, corrective_actions, documentation_status || 'pending', risk_rating || 'medium', responsible_party, evidence_links, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update compliance record
router.put('/:id', auth, async (req, res) => {
  try {
    const { requirement_name, regulation_type, vendor_name, compliance_status, last_audit_date, next_audit_date, audit_findings, corrective_actions, documentation_status, risk_rating, responsible_party, evidence_links, notes } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE compliance_records SET requirement_name=$1, regulation_type=$2, vendor_name=$3, compliance_status=$4, last_audit_date=$5, next_audit_date=$6, audit_findings=$7, corrective_actions=$8, documentation_status=$9, risk_rating=$10, responsible_party=$11, evidence_links=$12, notes=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [requirement_name, regulation_type, vendor_name, compliance_status, last_audit_date, next_audit_date, audit_findings, corrective_actions, documentation_status, risk_rating, responsible_party, evidence_links, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Compliance record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete compliance record
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM compliance_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Compliance record not found' });
    res.json({ message: 'Compliance record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
