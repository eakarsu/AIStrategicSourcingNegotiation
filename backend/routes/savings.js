const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all savings
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM savings_tracker ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single saving
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM savings_tracker WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Savings record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create saving
router.post('/', auth, async (req, res) => {
  try {
    const { initiative_name, category, vendor_name, original_cost, negotiated_cost, savings_amount, savings_percentage, savings_type, implementation_date, validation_status, department, fiscal_year, notes } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO savings_tracker (initiative_name, category, vendor_name, original_cost, negotiated_cost, savings_amount, savings_percentage, savings_type, implementation_date, validation_status, department, fiscal_year, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [initiative_name, category, vendor_name, original_cost, negotiated_cost, savings_amount, savings_percentage, savings_type || 'cost_reduction', implementation_date, validation_status || 'pending', department, fiscal_year, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update saving
router.put('/:id', auth, async (req, res) => {
  try {
    const { initiative_name, category, vendor_name, original_cost, negotiated_cost, savings_amount, savings_percentage, savings_type, implementation_date, validation_status, department, fiscal_year, notes } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE savings_tracker SET initiative_name=$1, category=$2, vendor_name=$3, original_cost=$4, negotiated_cost=$5, savings_amount=$6, savings_percentage=$7, savings_type=$8, implementation_date=$9, validation_status=$10, department=$11, fiscal_year=$12, notes=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [initiative_name, category, vendor_name, original_cost, negotiated_cost, savings_amount, savings_percentage, savings_type, implementation_date, validation_status, department, fiscal_year, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Savings record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete saving
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM savings_tracker WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Savings record not found' });
    res.json({ message: 'Savings record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
