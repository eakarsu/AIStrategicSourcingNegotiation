const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all Auctions with pagination
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [result, count] = await Promise.all([
      pool.query('SELECT * FROM auctions ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM auctions')
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

// Get single Auction
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM auctions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Start Auction (transitions to live state)
router.post('/:id/start', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const io = req.app.locals.io;

    const auction = await pool.query('SELECT * FROM auctions WHERE id = $1', [req.params.id]);
    if (auction.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });

    const current = auction.rows[0];
    if (current.status !== 'scheduled') {
      return res.status(400).json({ error: `Cannot start auction in state: ${current.status}` });
    }

    const result = await pool.query(
      'UPDATE auctions SET status = $1, start_time = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *',
      ['live', req.params.id]
    );

    // Notify all clients in the room
    if (io) {
      io.to(`auction-${req.params.id}`).emit('auction-started', { auction: result.rows[0] });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Close Auction
router.post('/:id/close', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const io = req.app.locals.io;

    const { winning_vendor } = req.body;
    const result = await pool.query(
      'UPDATE auctions SET status = $1, end_time = NOW(), winning_vendor = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      ['closed', winning_vendor, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });

    if (io) {
      io.to(`auction-${req.params.id}`).emit('auction-closed', { auction: result.rows[0] });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
