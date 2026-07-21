require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Validate required env vars at startup
if ((process.env.JWT_SECRET || '').length < 32 || !process.env.GOVERNANCE_TENANT_ID || !process.env.DATABASE_URL) throw new Error('JWT_SECRET (32+ characters), GOVERNANCE_TENANT_ID, and DATABASE_URL are required');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const generatedRoutesEnabled = process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production';

// Make pool and io available to routes
app.locals.pool = pool;
app.locals.io = io;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', require('./middleware/auth'));
app.use('/api/rfp', require('./routes/rfp'));
app.use('/api/rfp-requests', require('./routes/rfp'));
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
if (generatedRoutesEnabled) app.use('/api/ai', require('./routes/ai'));
app.use('/api/export', require('./routes/export'));
app.use('/api/activity-log', require('./routes/activityLog'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));
app.use('/api/notes', require('./routes/notes'));

// Socket.io - Auction rooms
const auctionRooms = new Map();

if (generatedRoutesEnabled) io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
    console.log(`Socket ${socket.id} joined auction room ${auctionId}`);
  });

  socket.on('submit-bid', async ({ auctionId, vendorName, bidAmount }) => {
    try {
      const result = await pool.query(
        'UPDATE auctions SET current_best_bid = LEAST(COALESCE(current_best_bid, starting_price), $1), updated_at = NOW() WHERE id = $2 AND status = \'live\' RETURNING *',
        [bidAmount, auctionId]
      );
      if (result.rows.length > 0) {
        const auction = result.rows[0];
        const bid = { vendorName, bidAmount, timestamp: new Date().toISOString() };
        io.to(`auction-${auctionId}`).emit('new-bid', { bid, auction });
      }
    } catch (err) {
      socket.emit('bid-error', { error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.use('/api/governed-sourcing-negotiation', require('./governance'));
app.use('/api/governance', require('./governance'));

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
