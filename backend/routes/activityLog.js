const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all activity logs with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { entity_type, action, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT al.*, u.name as user_name
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (entity_type) {
      query += ` AND al.entity_type = $${paramIndex++}`;
      params.push(entity_type);
    }

    if (action) {
      query += ` AND al.action = $${paramIndex++}`;
      params.push(action);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create activity log entry
router.post('/', auth, async (req, res) => {
  try {
    const { entity_type, entity_id, action, details } = req.body;
    const pool = req.app.locals.pool;

    const validActions = ['create', 'update', 'delete', 'view', 'export'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action. Allowed: ${validActions.join(', ')}` });
    }

    const result = await pool.query(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, entity_type, entity_id, action, details]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
