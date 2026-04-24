const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all suppliers
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single supplier
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create supplier
router.post('/', auth, async (req, res) => {
  try {
    const { company_name, contact_name, email, phone, address, category, rating, certifications, annual_revenue, employee_count, years_in_business, payment_terms, quality_score, delivery_score, status, notes } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO suppliers (company_name, contact_name, email, phone, address, category, rating, certifications, annual_revenue, employee_count, years_in_business, payment_terms, quality_score, delivery_score, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [company_name, contact_name, email, phone, address, category, rating, certifications, annual_revenue, employee_count, years_in_business, payment_terms, quality_score, delivery_score, status || 'active', notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update supplier
router.put('/:id', auth, async (req, res) => {
  try {
    const { company_name, contact_name, email, phone, address, category, rating, certifications, annual_revenue, employee_count, years_in_business, payment_terms, quality_score, delivery_score, status, notes } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE suppliers SET company_name=$1, contact_name=$2, email=$3, phone=$4, address=$5, category=$6, rating=$7, certifications=$8, annual_revenue=$9, employee_count=$10, years_in_business=$11, payment_terms=$12, quality_score=$13, delivery_score=$14, status=$15, notes=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [company_name, contact_name, email, phone, address, category, rating, certifications, annual_revenue, employee_count, years_in_business, payment_terms, quality_score, delivery_score, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete supplier
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
