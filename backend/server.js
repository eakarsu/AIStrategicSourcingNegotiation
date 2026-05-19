require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Validate required env vars at startup
const requiredEnv = ['OPENROUTER_API_KEY', 'JWT_SECRET', 'DB_HOST'];
const missingEnv = requiredEnv.filter(k => !process.env[k]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

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

const PORT = process.env.BACKEND_PORT || 3001;

// Database pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

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

// Init ai_results table
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint VARCHAR(100),
    input_data JSONB,
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

// Init uploads dir
const fs = require('fs');
const uploadsDir = require('path').join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Routes
app.use('/api/auth', require('./routes/auth'));
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

// Socket.io - Auction rooms
const auctionRooms = new Map();

io.on('connection', (socket) => {
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

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
app.use('/api/supplier-diversity-optimizer', require('./routes/supplierDiversityOptimizer')); app.use('/api/predictive-delivery-risk', require('./routes/predictiveDeliveryRisk')); app.use('/api/supply-chain-resilience-mapping', require('./routes/supplyChainResilienceMapping')); app.use('/api/invoice-anomaly-detection', require('./routes/invoiceAnomalyDetection')); app.use('/api/marketplace-integration', require('./routes/marketplaceIntegration')); app.use('/api/contract-obligation-tracker', require('./routes/contractObligationTracker'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-driven-supplier-diversity-optimization', require('./routes/gapNoAiDrivenSupplierDiversityOptimization'));
app.use('/api/gap-no-predictive-delivery-quality-risk-model', require('./routes/gapNoPredictiveDeliveryQualityRiskModel'));
app.use('/api/gap-no-invoice-anomaly-detection-ai', require('./routes/gapNoInvoiceAnomalyDetectionAi'));
app.use('/api/gap-limited-integrations-only-an-export-module-no-erp', require('./routes/gapLimitedIntegrationsOnlyAnExportModuleNoErp'));
app.use('/api/gap-no-supplier-portal-for-collaborative-bidding', require('./routes/gapNoSupplierPortalForCollaborativeBidding'));
app.use('/api/gap-no-invoice-matching-three-way-match-automation', require('./routes/gapNoInvoiceMatchingThreeWayMatchAutomation'));
app.use('/api/gap-no-contract-obligation-tracking-with-calendar-alerts', require('./routes/gapNoContractObligationTrackingWithCalendarAlerts'));
app.use('/api/gap-no-webhooks-for-external-system-events', require('./routes/gapNoWebhooksForExternalSystemEvents'));
app.use('/api/gap-no-e-signature-workflow-for-contracts', require('./routes/gapNoESignatureWorkflowForContracts'));

// === Custom Sourcing Views (mount BEFORE 404) ===
app.use('/api/custom-views', require('./routes/customViews'));

// 404 fallback (must remain last)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});
