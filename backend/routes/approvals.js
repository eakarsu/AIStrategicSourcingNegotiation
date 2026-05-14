const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// State machine: draft -> dept -> finance -> cpo -> awarded
const STATE_MACHINE = {
  draft: { next: 'dept', roles: ['procurement_specialist', 'admin'], label: 'Submit to Department' },
  dept: { next: 'finance', roles: ['dept_manager', 'admin'], label: 'Approve to Finance' },
  finance: { next: 'cpo', roles: ['finance_manager', 'admin'], label: 'Approve to CPO' },
  cpo: { next: 'awarded', roles: ['cpo', 'admin'], label: 'Final Approval' },
  awarded: { next: null, roles: [], label: 'Awarded' }
};

// Get all approval workflows with pagination
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [result, count] = await Promise.all([
      pool.query('SELECT * FROM approval_workflows ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM approval_workflows')
    ]);

    res.json({
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(count.rows[0].count),
        totalPages: Math.ceil(parseInt(count.rows[0].count) / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Create approval workflow
router.post('/', auth, async (req, res) => {
  try {
    const { request_title, request_type, requestor, department, amount, justification, current_approver, approval_chain, current_step, total_steps, priority, due_date, comments, attachments } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO approval_workflows (request_title, request_type, requestor, department, amount, justification, current_approver, approval_chain, current_step, total_steps, priority, due_date, comments, attachments, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [request_title, request_type, requestor, department, amount, justification, current_approver, approval_chain, current_step || 1, total_steps || 5, priority || 'medium', due_date, comments, attachments, 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// State machine transition: PUT /api/approvals/:id/transition
router.put('/:id/transition', auth, async (req, res) => {
  try {
    const { action, comment } = req.body; // action: 'advance' | 'reject'
    const pool = req.app.locals.pool;

    const workflowResult = await pool.query('SELECT * FROM approval_workflows WHERE id = $1', [req.params.id]);
    if (workflowResult.rows.length === 0) return res.status(404).json({ error: 'Workflow not found' });

    const workflow = workflowResult.rows[0];
    const currentState = workflow.status;
    const stateConfig = STATE_MACHINE[currentState];

    if (!stateConfig) return res.status(400).json({ error: `Unknown state: ${currentState}` });

    // Role check
    const userRole = req.user.role || 'procurement_specialist';
    if (!stateConfig.roles.includes(userRole)) {
      return res.status(403).json({ error: `Role '${userRole}' cannot transition from '${currentState}'. Required: ${stateConfig.roles.join(', ')}` });
    }

    if (action === 'reject') {
      const result = await pool.query(
        `UPDATE approval_workflows SET status = 'rejected', comments = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [comment || 'Rejected', req.params.id]
      );
      return res.json({ workflow: result.rows[0], transition: `${currentState} -> rejected` });
    }

    const nextState = stateConfig.next;
    if (!nextState) return res.status(400).json({ error: 'Workflow already at final state' });

    const newStep = (workflow.current_step || 1) + 1;
    const newApprover = STATE_MACHINE[nextState]?.label || nextState;

    const result = await pool.query(
      `UPDATE approval_workflows SET status = $1, current_step = $2, current_approver = $3, comments = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
      [nextState, newStep, newApprover, comment || null, req.params.id]
    );

    res.json({
      workflow: result.rows[0],
      transition: `${currentState} -> ${nextState}`,
      state_machine: STATE_MACHINE
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
