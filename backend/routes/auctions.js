const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all Auctions
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM auctions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single Auction
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM auctions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Auction
router.post('/', auth, async (req, res) => {
  try {
    const { auction_title, category, auction_type, description, starting_price, reserve_price, current_best_bid, number_of_bidders, start_time, end_time, bid_decrement, auto_extend, winning_vendor, items_description, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO auctions (auction_title, category, auction_type, description, starting_price, reserve_price, current_best_bid, number_of_bidders, start_time, end_time, bid_decrement, auto_extend, winning_vendor, items_description, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [auction_title, category, auction_type, description, starting_price, reserve_price, current_best_bid, number_of_bidders, start_time, end_time, bid_decrement, auto_extend !== undefined ? auto_extend : true, winning_vendor, items_description, status || 'scheduled', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Auction
router.put('/:id', auth, async (req, res) => {
  try {
    const { auction_title, category, auction_type, description, starting_price, reserve_price, current_best_bid, number_of_bidders, start_time, end_time, bid_decrement, auto_extend, winning_vendor, items_description, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE auctions SET auction_title=$1, category=$2, auction_type=$3, description=$4, starting_price=$5, reserve_price=$6, current_best_bid=$7, number_of_bidders=$8, start_time=$9, end_time=$10, bid_decrement=$11, auto_extend=$12, winning_vendor=$13, items_description=$14, status=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [auction_title, category, auction_type, description, starting_price, reserve_price, current_best_bid, number_of_bidders, start_time, end_time, bid_decrement, auto_extend, winning_vendor, items_description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Auction
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM auctions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });
    res.json({ message: 'Auction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
