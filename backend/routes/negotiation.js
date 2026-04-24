const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all negotiation points
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM negotiation_points ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single negotiation point
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM negotiation_points WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Negotiation point not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create negotiation point
router.post('/', auth, async (req, res) => {
  try {
    const { negotiation_title, vendor_name, category, our_position, vendor_position, batna, target_outcome, leverage_points, risk_factors, priority, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO negotiation_points (negotiation_title, vendor_name, category, our_position, vendor_position, batna, target_outcome, leverage_points, risk_factors, priority, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [negotiation_title, vendor_name, category, our_position, vendor_position, batna, target_outcome, leverage_points, risk_factors, priority || 'medium', status || 'preparation', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update negotiation point
router.put('/:id', auth, async (req, res) => {
  try {
    const { negotiation_title, vendor_name, category, our_position, vendor_position, batna, target_outcome, leverage_points, risk_factors, priority, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE negotiation_points SET negotiation_title=$1, vendor_name=$2, category=$3, our_position=$4, vendor_position=$5, batna=$6, target_outcome=$7, leverage_points=$8, risk_factors=$9, priority=$10, status=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [negotiation_title, vendor_name, category, our_position, vendor_position, batna, target_outcome, leverage_points, risk_factors, priority, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Negotiation point not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete negotiation point
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM negotiation_points WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Negotiation point not found' });
    res.json({ message: 'Negotiation point deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
