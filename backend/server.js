require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Database pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Make pool available to routes
app.locals.pool = pool;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rfp', require('./routes/rfp'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/cost-models', require('./routes/costModels'));
app.use('/api/negotiation', require('./routes/negotiation'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/spend-analytics', require('./routes/spendAnalytics'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/risk-assessment', require('./routes/riskAssessment'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/market-intel', require('./routes/marketIntel'));
app.use('/api/scorecards', require('./routes/scorecards'));
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/category-strategy', require('./routes/categoryStrategy'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/export', require('./routes/export'));
app.use('/api/activity-log', require('./routes/activityLog'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));
app.use('/api/notes', require('./routes/notes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
