const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get notes for an entity
router.get('/', auth, async (req, res) => {
  try {
    const { entity_type, entity_id } = req.query;
    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'entity_type and entity_id are required' });
    }

    const pool = req.app.locals.pool;
    const result = await pool.query(
      `SELECT n.*, u.name as user_name
       FROM notes n
       LEFT JOIN users u ON n.user_id = u.id
       WHERE n.entity_type = $1 AND n.entity_id = $2
       ORDER BY n.created_at DESC`,
      [entity_type, entity_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create note
router.post('/', auth, async (req, res) => {
  try {
    const { entity_type, entity_id, content } = req.body;
    if (!entity_type || !entity_id || !content) {
      return res.status(400).json({ error: 'entity_type, entity_id, and content are required' });
    }

    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO notes (entity_type, entity_id, content, user_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [entity_type, entity_id, content, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update note (only if user owns it)
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE notes SET content = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [content, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found or unauthorized' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete note (only if user owns it)
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found or unauthorized' });
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
