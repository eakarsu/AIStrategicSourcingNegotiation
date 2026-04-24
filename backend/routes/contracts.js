const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all contracts
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM contracts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
