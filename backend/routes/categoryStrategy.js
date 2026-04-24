const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all category strategies
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM category_strategies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single category strategy
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM category_strategies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category strategy not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create category strategy
router.post('/', auth, async (req, res) => {
  try {
    const { category_name, category_owner, annual_spend, number_of_suppliers, strategic_importance, supply_risk, sourcing_strategy, current_state, target_state, key_initiatives, savings_target_pct, timeline, stakeholders, market_dynamics, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO category_strategies (category_name, category_owner, annual_spend, number_of_suppliers, strategic_importance, supply_risk, sourcing_strategy, current_state, target_state, key_initiatives, savings_target_pct, timeline, stakeholders, market_dynamics, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [category_name, category_owner, annual_spend, number_of_suppliers, strategic_importance, supply_risk, sourcing_strategy, current_state, target_state, key_initiatives, savings_target_pct, timeline, stakeholders, market_dynamics, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update category strategy
router.put('/:id', auth, async (req, res) => {
  try {
    const { category_name, category_owner, annual_spend, number_of_suppliers, strategic_importance, supply_risk, sourcing_strategy, current_state, target_state, key_initiatives, savings_target_pct, timeline, stakeholders, market_dynamics, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE category_strategies SET category_name=$1, category_owner=$2, annual_spend=$3, number_of_suppliers=$4, strategic_importance=$5, supply_risk=$6, sourcing_strategy=$7, current_state=$8, target_state=$9, key_initiatives=$10, savings_target_pct=$11, timeline=$12, stakeholders=$13, market_dynamics=$14, status=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [category_name, category_owner, annual_spend, number_of_suppliers, strategic_importance, supply_risk, sourcing_strategy, current_state, target_state, key_initiatives, savings_target_pct, timeline, stakeholders, market_dynamics, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category strategy not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete category strategy
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM category_strategies WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category strategy not found' });
    res.json({ message: 'Category strategy deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
