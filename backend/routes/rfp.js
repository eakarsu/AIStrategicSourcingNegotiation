const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all RFPs
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM rfp_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single RFP
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM rfp_requests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'RFP not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create RFP
router.post('/', auth, async (req, res) => {
  try {
    const { title, category, description, requirements, budget_range, deadline, evaluation_criteria, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO rfp_requests (title, category, description, requirements, budget_range, deadline, evaluation_criteria, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, category, description, requirements, budget_range, deadline, evaluation_criteria, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update RFP
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, category, description, requirements, budget_range, deadline, evaluation_criteria, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE rfp_requests SET title=$1, category=$2, description=$3, requirements=$4, budget_range=$5, deadline=$6, evaluation_criteria=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, category, description, requirements, budget_range, deadline, evaluation_criteria, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'RFP not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete RFP
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM rfp_requests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'RFP not found' });
    res.json({ message: 'RFP deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
