const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all risk assessments
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM risk_assessments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single risk assessment
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM risk_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Risk assessment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create risk assessment
router.post('/', auth, async (req, res) => {
  try {
    const { assessment_title, vendor_name, risk_category, risk_level, probability, impact_score, risk_score, description, mitigation_strategy, contingency_plan, owner, review_date, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO risk_assessments (assessment_title, vendor_name, risk_category, risk_level, probability, impact_score, risk_score, description, mitigation_strategy, contingency_plan, owner, review_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [assessment_title, vendor_name, risk_category, risk_level, probability, impact_score, risk_score, description, mitigation_strategy, contingency_plan, owner, review_date, status || 'identified', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update risk assessment
router.put('/:id', auth, async (req, res) => {
  try {
    const { assessment_title, vendor_name, risk_category, risk_level, probability, impact_score, risk_score, description, mitigation_strategy, contingency_plan, owner, review_date, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE risk_assessments SET assessment_title=$1, vendor_name=$2, risk_category=$3, risk_level=$4, probability=$5, impact_score=$6, risk_score=$7, description=$8, mitigation_strategy=$9, contingency_plan=$10, owner=$11, review_date=$12, status=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [assessment_title, vendor_name, risk_category, risk_level, probability, impact_score, risk_score, description, mitigation_strategy, contingency_plan, owner, review_date, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Risk assessment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete risk assessment
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM risk_assessments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Risk assessment not found' });
    res.json({ message: 'Risk assessment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
