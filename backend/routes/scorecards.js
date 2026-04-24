const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all scorecards
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM performance_scorecards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single scorecard
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM performance_scorecards WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scorecard not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create scorecard
router.post('/', auth, async (req, res) => {
  try {
    const { vendor_name, evaluation_period, overall_score, quality_score, delivery_score, cost_score, responsiveness_score, innovation_score, compliance_score, defect_rate, on_time_delivery_pct, cost_variance_pct, corrective_actions, improvement_plan, evaluator, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO performance_scorecards (vendor_name, evaluation_period, overall_score, quality_score, delivery_score, cost_score, responsiveness_score, innovation_score, compliance_score, defect_rate, on_time_delivery_pct, cost_variance_pct, corrective_actions, improvement_plan, evaluator, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [vendor_name, evaluation_period, overall_score, quality_score, delivery_score, cost_score, responsiveness_score, innovation_score, compliance_score, defect_rate, on_time_delivery_pct, cost_variance_pct, corrective_actions, improvement_plan, evaluator, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update scorecard
router.put('/:id', auth, async (req, res) => {
  try {
    const { vendor_name, evaluation_period, overall_score, quality_score, delivery_score, cost_score, responsiveness_score, innovation_score, compliance_score, defect_rate, on_time_delivery_pct, cost_variance_pct, corrective_actions, improvement_plan, evaluator, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE performance_scorecards SET vendor_name=$1, evaluation_period=$2, overall_score=$3, quality_score=$4, delivery_score=$5, cost_score=$6, responsiveness_score=$7, innovation_score=$8, compliance_score=$9, defect_rate=$10, on_time_delivery_pct=$11, cost_variance_pct=$12, corrective_actions=$13, improvement_plan=$14, evaluator=$15, status=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [vendor_name, evaluation_period, overall_score, quality_score, delivery_score, cost_score, responsiveness_score, innovation_score, compliance_score, defect_rate, on_time_delivery_pct, cost_variance_pct, corrective_actions, improvement_plan, evaluator, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scorecard not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete scorecard
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM performance_scorecards WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scorecard not found' });
    res.json({ message: 'Scorecard deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
