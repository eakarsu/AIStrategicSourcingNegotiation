const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all spend analytics records
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM spend_analytics ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single spend analytics record
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM spend_analytics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Spend record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create spend analytics record
router.post('/', auth, async (req, res) => {
  try {
    const { spend_category, department, vendor_name, amount, period, fiscal_year, budget_allocated, variance_percentage, transaction_count, contract_reference, cost_center, payment_method, currency, status, notes } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO spend_analytics (spend_category, department, vendor_name, amount, period, fiscal_year, budget_allocated, variance_percentage, transaction_count, contract_reference, cost_center, payment_method, currency, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [spend_category, department, vendor_name, amount, period, fiscal_year, budget_allocated, variance_percentage, transaction_count, contract_reference, cost_center, payment_method, currency || 'USD', status || 'tracked', notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update spend analytics record
router.put('/:id', auth, async (req, res) => {
  try {
    const { spend_category, department, vendor_name, amount, period, fiscal_year, budget_allocated, variance_percentage, transaction_count, contract_reference, cost_center, payment_method, currency, status, notes } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE spend_analytics SET spend_category=$1, department=$2, vendor_name=$3, amount=$4, period=$5, fiscal_year=$6, budget_allocated=$7, variance_percentage=$8, transaction_count=$9, contract_reference=$10, cost_center=$11, payment_method=$12, currency=$13, status=$14, notes=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [spend_category, department, vendor_name, amount, period, fiscal_year, budget_allocated, variance_percentage, transaction_count, contract_reference, cost_center, payment_method, currency, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Spend record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete spend analytics record
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM spend_analytics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Spend record not found' });
    res.json({ message: 'Spend record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
