const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Global search across all major entities
router.get('/', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const pool = req.app.locals.pool;
    const searchTerm = `%${q.trim()}%`;

    const searches = [
      {
        entity_type: 'rfp_requests',
        label: 'RFP Requests',
        path: '/rfp',
        query: `SELECT id, title, category as snippet FROM rfp_requests WHERE title ILIKE $1 OR category ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'bids',
        label: 'Bids',
        path: '/bids',
        query: `SELECT id, COALESCE(vendor_name, '') || ' - ' || COALESCE(rfp_title, '') as title, vendor_name as snippet FROM bids WHERE vendor_name ILIKE $1 OR rfp_title ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'suppliers',
        label: 'Suppliers',
        path: '/suppliers',
        query: `SELECT id, company_name as title, category as snippet FROM suppliers WHERE company_name ILIKE $1 OR category ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'contracts',
        label: 'Contracts',
        path: '/contracts',
        query: `SELECT id, contract_title as title, vendor_name as snippet FROM contracts WHERE contract_title ILIKE $1 OR vendor_name ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'cost_models',
        label: 'Cost Models',
        path: '/cost-models',
        query: `SELECT id, product_name as title, category as snippet FROM cost_models WHERE product_name ILIKE $1 OR category ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'negotiation_points',
        label: 'Negotiations',
        path: '/negotiation',
        query: `SELECT id, negotiation_title as title, vendor_name as snippet FROM negotiation_points WHERE negotiation_title ILIKE $1 OR vendor_name ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'spend_analytics',
        label: 'Spend Analytics',
        path: '/spend-analytics',
        query: `SELECT id, spend_category as title, vendor_name as snippet FROM spend_analytics WHERE spend_category ILIKE $1 OR vendor_name ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'auctions',
        label: 'Auctions',
        path: '/auctions',
        query: `SELECT id, auction_title as title, category as snippet FROM auctions WHERE auction_title ILIKE $1 OR category ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'category_strategies',
        label: 'Category Strategies',
        path: '/category-strategy',
        query: `SELECT id, category_name as title, category_owner as snippet FROM category_strategies WHERE category_name ILIKE $1 OR category_owner ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'risk_assessments',
        label: 'Risk Assessments',
        path: '/risk-assessment',
        query: `SELECT id, assessment_title as title, vendor_name as snippet FROM risk_assessments WHERE assessment_title ILIKE $1 OR vendor_name ILIKE $1 LIMIT 10`,
      },
      {
        entity_type: 'compliance_records',
        label: 'Compliance',
        path: '/compliance',
        query: `SELECT id, requirement_name as title, vendor_name as snippet FROM compliance_records WHERE requirement_name ILIKE $1 OR vendor_name ILIKE $1 LIMIT 10`,
      },
    ];

    const results = {};
    const queryPromises = searches.map(async (search) => {
      try {
        const result = await pool.query(search.query, [searchTerm]);
        if (result.rows.length > 0) {
          results[search.entity_type] = {
            label: search.label,
            path: search.path,
            items: result.rows.map(row => ({
              id: row.id,
              title: row.title,
              entity_type: search.entity_type,
              snippet: row.snippet,
            })),
          };
        }
      } catch {
        // Skip entities that may not exist or have different schemas
      }
    });

    await Promise.all(queryPromises);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
