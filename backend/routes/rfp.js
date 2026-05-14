const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `rfp-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt', '.xlsx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// Get all RFPs with pagination
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [result, count] = await Promise.all([
      pool.query('SELECT * FROM rfp_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM rfp_requests')
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

// Get single RFP
router.get('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM rfp_requests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'RFP not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload file for RFP: POST /api/rfp-requests/:id/upload
router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const pool = req.app.locals.pool;
    const rfpResult = await pool.query('SELECT * FROM rfp_requests WHERE id = $1', [req.params.id]);
    if (rfpResult.rows.length === 0) return res.status(404).json({ error: 'RFP not found' });

    const fileMeta = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploaded_at: new Date().toISOString()
    };

    // Store file metadata in rfp_requests (appending to existing attachments)
    const existing = rfpResult.rows[0].attachments;
    let attachments = [];
    if (existing) {
      try { attachments = JSON.parse(existing); } catch {}
      if (!Array.isArray(attachments)) attachments = [];
    }
    attachments.push(fileMeta);

    await pool.query(
      'UPDATE rfp_requests SET attachments = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(attachments), req.params.id]
    );

    res.json({ message: 'File uploaded successfully', file: fileMeta });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create RFP
router.post('/', auth, async (req, res) => {
  try {
    const { title, category, description, requirements, budget_range, deadline, evaluation_criteria, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO rfp_requests (title, category, description, requirements, budget_range, deadline, evaluation_criteria, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, category, description, requirements, budget_range, deadline, evaluation_criteria, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update RFP
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, category, description, requirements, budget_range, deadline, evaluation_criteria, status } = req.body;
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE rfp_requests SET title=$1, category=$2, description=$3, requirements=$4, budget_range=$5, deadline=$6, evaluation_criteria=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, category, description, requirements, budget_range, deadline, evaluation_criteria, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'RFP not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete RFP
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('DELETE FROM rfp_requests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'RFP not found' });
    res.json({ message: 'RFP deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
