const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get notifications for current user (unread first, ordered by date)
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY is_read ASC, created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get count of unread notifications
router.get('/unread-count', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read for current user
router.put('/read-all', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create notification (for system use)
router.post('/', auth, async (req, res) => {
  try {
    const { title, message, type, link } = req.body;
    const pool = req.app.locals.pool;

    const validTypes = ['info', 'warning', 'success', 'error'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Allowed: ${validTypes.join(', ')}` });
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title, message, type || 'info', link]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
