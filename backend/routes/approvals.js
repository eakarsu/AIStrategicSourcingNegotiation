const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all approval workflows
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM approval_workflows ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single approval workflow
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM approval_workflows WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Approval workflow not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create approval workflow
router.post('/', auth, async (req, res) => {
  try {
    const { request_title, request_type, requestor, department, amount, justification, current_approver, approval_chain, current_step, total_steps, priority, due_date, comments, attachments, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO approval_workflows (request_title, request_type, requestor, department, amount, justification, current_approver, approval_chain, current_step, total_steps, priority, due_date, comments, attachments, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [request_title, request_type, requestor, department, amount, justification, current_approver, approval_chain, current_step || 1, total_steps || 3, priority || 'medium', due_date, comments, attachments, status || 'pending', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update approval workflow
router.put('/:id', auth, async (req, res) => {
  try {
    const { request_title, request_type, requestor, department, amount, justification, current_approver, approval_chain, current_step, total_steps, priority, due_date, comments, attachments, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE approval_workflows SET request_title=$1, request_type=$2, requestor=$3, department=$4, amount=$5, justification=$6, current_approver=$7, approval_chain=$8, current_step=$9, total_steps=$10, priority=$11, due_date=$12, comments=$13, attachments=$14, status=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [request_title, request_type, requestor, department, amount, justification, current_approver, approval_chain, current_step, total_steps, priority, due_date, comments, attachments, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Approval workflow not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete approval workflow
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM approval_workflows WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Approval workflow not found' });
    res.json({ message: 'Approval workflow deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
