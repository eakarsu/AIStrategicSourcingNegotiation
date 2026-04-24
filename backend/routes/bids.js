const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all bids
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM bids ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single bid
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM bids WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bid not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create bid
router.post('/', auth, async (req, res) => {
  try {
    const { rfp_title, vendor_name, bid_amount, delivery_timeline, technical_score, commercial_score, compliance_score, vendor_experience, warranty_terms, payment_terms, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO bids (rfp_title, vendor_name, bid_amount, delivery_timeline, technical_score, commercial_score, compliance_score, vendor_experience, warranty_terms, payment_terms, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [rfp_title, vendor_name, bid_amount, delivery_timeline, technical_score, commercial_score, compliance_score, vendor_experience, warranty_terms, payment_terms, status || 'submitted', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update bid
router.put('/:id', auth, async (req, res) => {
  try {
    const { rfp_title, vendor_name, bid_amount, delivery_timeline, technical_score, commercial_score, compliance_score, vendor_experience, warranty_terms, payment_terms, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE bids SET rfp_title=$1, vendor_name=$2, bid_amount=$3, delivery_timeline=$4, technical_score=$5, commercial_score=$6, compliance_score=$7, vendor_experience=$8, warranty_terms=$9, payment_terms=$10, status=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [rfp_title, vendor_name, bid_amount, delivery_timeline, technical_score, commercial_score, compliance_score, vendor_experience, warranty_terms, payment_terms, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bid not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete bid
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM bids WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bid not found' });
    res.json({ message: 'Bid deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
