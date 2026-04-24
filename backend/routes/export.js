const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const ALLOWED_ENTITIES = [
  'rfp_requests', 'bids', 'cost_models', 'negotiation_points', 'suppliers',
  'spend_analytics', 'savings_tracker', 'risk_assessments', 'compliance_records',
  'auctions', 'market_intelligence', 'performance_scorecards', 'approval_workflows',
  'category_strategies', 'contracts'
];

// Export any entity as CSV
router.get('/:entity', auth, async (req, res) => {
  try {
    const { entity } = req.params;

    if (!ALLOWED_ENTITIES.includes(entity)) {
      return res.status(400).json({ error: `Invalid entity: ${entity}. Allowed: ${ALLOWED_ENTITIES.join(', ')}` });
    }

    const pool = req.app.locals.pool;
    const result = await pool.query(`SELECT * FROM ${entity} ORDER BY created_at DESC`);

    if (result.rows.length === 0) {
      return res.status(200).set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${entity}_export.csv"`
      }).send('');
    }

    const columns = Object.keys(result.rows[0]);
    const headerRow = columns.map(col => `"${col}"`).join(',');

    const dataRows = result.rows.map(row => {
      return columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
    });

    const csv = [headerRow, ...dataRows].join('\n');

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${entity}_export.csv"`
    });
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
