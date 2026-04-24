const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all Market Intelligence reports
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM market_intelligence ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single Market Intelligence report
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM market_intelligence WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Market Intelligence report
router.post('/', auth, async (req, res) => {
  try {
    const { report_title, commodity, market_segment, current_price, price_trend, price_change_pct, supply_outlook, demand_outlook, key_drivers, competitor_activity, forecast_summary, data_source, report_date, region, impact_assessment, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO market_intelligence (report_title, commodity, market_segment, current_price, price_trend, price_change_pct, supply_outlook, demand_outlook, key_drivers, competitor_activity, forecast_summary, data_source, report_date, region, impact_assessment, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [report_title, commodity, market_segment, current_price, price_trend, price_change_pct, supply_outlook, demand_outlook, key_drivers, competitor_activity, forecast_summary, data_source, report_date, region, impact_assessment, status || 'current', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Market Intelligence report
router.put('/:id', auth, async (req, res) => {
  try {
    const { report_title, commodity, market_segment, current_price, price_trend, price_change_pct, supply_outlook, demand_outlook, key_drivers, competitor_activity, forecast_summary, data_source, report_date, region, impact_assessment, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE market_intelligence SET report_title=$1, commodity=$2, market_segment=$3, current_price=$4, price_trend=$5, price_change_pct=$6, supply_outlook=$7, demand_outlook=$8, key_drivers=$9, competitor_activity=$10, forecast_summary=$11, data_source=$12, report_date=$13, region=$14, impact_assessment=$15, status=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [report_title, commodity, market_segment, current_price, price_trend, price_change_pct, supply_outlook, demand_outlook, key_drivers, competitor_activity, forecast_summary, data_source, report_date, region, impact_assessment, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Market Intelligence report
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM market_intelligence WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
