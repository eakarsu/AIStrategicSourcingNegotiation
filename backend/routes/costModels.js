const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all cost models
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM cost_models ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single cost model
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM cost_models WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cost model not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create cost model
router.post('/', auth, async (req, res) => {
  try {
    const { product_name, category, material_cost, labor_cost, overhead_cost, logistics_cost, margin_percentage, market_price, target_price, volume, unit, supplier, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO cost_models (product_name, category, material_cost, labor_cost, overhead_cost, logistics_cost, margin_percentage, market_price, target_price, volume, unit, supplier, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [product_name, category, material_cost, labor_cost, overhead_cost, logistics_cost, margin_percentage, market_price, target_price, volume, unit, supplier, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update cost model
router.put('/:id', auth, async (req, res) => {
  try {
    const { product_name, category, material_cost, labor_cost, overhead_cost, logistics_cost, margin_percentage, market_price, target_price, volume, unit, supplier, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE cost_models SET product_name=$1, category=$2, material_cost=$3, labor_cost=$4, overhead_cost=$5, logistics_cost=$6, margin_percentage=$7, market_price=$8, target_price=$9, volume=$10, unit=$11, supplier=$12, status=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [product_name, category, material_cost, labor_cost, overhead_cost, logistics_cost, margin_percentage, market_price, target_price, volume, unit, supplier, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cost model not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete cost model
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM cost_models WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cost model not found' });
    res.json({ message: 'Cost model deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
