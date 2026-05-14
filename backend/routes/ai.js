const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const https = require('https');
const rateLimit = require('express-rate-limit');

// Rate limiter: 20 AI calls per hour per user
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? 'user:' + (req.user.id || req.user.userId) : req.ip,
  message: { error: 'Too many AI requests, please try again later.' }
});

function parseAIJson(content) {
  try { return JSON.parse(content); } catch {}
  try {
    const stripped = content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    return JSON.parse(stripped);
  } catch {}
  try {
    const first = content.indexOf('{');
    const last = content.lastIndexOf('}');
    if (first !== -1 && last !== -1) return JSON.parse(content.slice(first, last + 1));
  } catch {}
  return null;
}

async function callOpenRouter(prompt, systemPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const e = new Error('AI service not configured (OPENROUTER_API_KEY missing)');
    e.statusCode = 503;
    throw e;
  }
  const model = 'anthropic/claude-3-5-sonnet-20241022';

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: 4000,
    temperature: 0.7
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Strategic Sourcing'
      }
    };

    const timeout = setTimeout(() => reject(new Error('AI request timed out')), 30000);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message || 'OpenRouter API error'));
          else resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(new Error('Failed to parse AI response'));
        }
      });
    });

    req.on('error', (e) => { clearTimeout(timeout); reject(e); });
    req.write(body);
    req.end();
  });
}

async function persistAIResult(pool, userId, endpoint, inputData, result) {
  try {
    await pool.query(
      'INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)]
    );
  } catch (err) {
    console.error('Failed to persist AI result:', err.message);
  }
}

// Generate RFP
router.post('/generate-rfp', auth, aiRateLimiter, async (req, res) => {
  try {
    const { title, category, requirements, budget_range } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are an expert procurement specialist. Generate a professional RFP document. Return structured JSON with analysis field containing recommendations, risks, savings_opportunity, and priority. Also include rfp_content with full document sections.`;
    const prompt = `Generate a comprehensive RFP document for:
Title: ${title}
Category: ${category}
Requirements: ${requirements}
Budget Range: ${budget_range}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "high|medium|low" }, "rfp_content": { "executive_summary": "", "scope_of_work": "", "technical_requirements": "", "evaluation_criteria": "", "timeline": "", "submission_requirements": "" } }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'generate-rfp', { title, category, requirements, budget_range }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'rfp_generation' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Compare Bids (DB-grounded)
router.post('/compare-bids', auth, aiRateLimiter, async (req, res) => {
  try {
    const { rfp_id, criteria } = req.body;
    const pool = req.app.locals.pool;

    let bids = req.body.bids;
    if (rfp_id) {
      const bidsResult = await pool.query('SELECT * FROM bids WHERE rfp_id = $1', [rfp_id]);
      bids = bidsResult.rows;
    }

    const systemPrompt = `You are an expert procurement analyst. Analyze vendor bids and return structured JSON.`;
    const prompt = `Compare these vendor bids:
${JSON.stringify(bids, null, 2)}
Evaluation Criteria: ${criteria || 'Price, Quality, Delivery, Experience, Compliance'}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "high" }, "ranking": [{ "vendor": "", "score": 0, "strengths": [], "weaknesses": [] }], "recommended_vendor": "" }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'compare-bids', { rfp_id, criteria }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'bid_comparison' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Should-Cost Analysis
router.post('/should-cost', auth, aiRateLimiter, async (req, res) => {
  try {
    const { product_name, category, material_cost, labor_cost, overhead_cost, volume, market_price } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are an expert cost engineer. Return structured JSON with should-cost breakdown.`;
    const prompt = `Perform a should-cost analysis for:
Product: ${product_name}, Category: ${category}
Material Cost: $${material_cost}, Labor Cost: $${labor_cost}, Overhead: $${overhead_cost}
Volume: ${volume}, Market Price: $${market_price}

Return JSON: { "material_cost": 0, "labor_cost": 0, "overhead": 0, "margin": 0, "should_cost_total": 0, "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "medium" }, "optimization_opportunities": [] }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'should-cost', { product_name, category, material_cost, labor_cost, overhead_cost, volume, market_price }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'should_cost' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Negotiation Points (DB-grounded)
router.post('/negotiation-points', auth, aiRateLimiter, async (req, res) => {
  try {
    const { negotiation_id, negotiation_title, vendor_name, our_position, vendor_position, batna, leverage_points } = req.body;
    const pool = req.app.locals.pool;

    let dbContext = '';
    if (negotiation_id) {
      const negResult = await pool.query('SELECT * FROM negotiation_points WHERE id = $1', [negotiation_id]);
      if (negResult.rows.length > 0) dbContext = `\nExisting negotiation record: ${JSON.stringify(negResult.rows[0])}`;
    }

    const systemPrompt = `You are an expert negotiation strategist. Return structured JSON with BATNA value, ZOPA range, and leverage factors.`;
    const prompt = `Generate negotiation talking points for:
Title: ${negotiation_title}, Vendor: ${vendor_name}
Our Position: ${our_position}, Vendor Position: ${vendor_position}
BATNA: ${batna}, Leverage: ${leverage_points}${dbContext}

Return JSON: { "batna_value": 0, "zopa_range": { "min": 0, "max": 0 }, "leverage_factors": [], "opening_strategy": "", "talking_points": [], "concession_strategy": "", "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "high" } }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'negotiation-points', { negotiation_id, negotiation_title, vendor_name }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'negotiation_points' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Draft Contract
router.post('/draft-contract', auth, aiRateLimiter, async (req, res) => {
  try {
    const { contract_title, vendor_name, contract_type, total_value, terms_conditions, sla_terms } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are an expert contract attorney. Return structured JSON with contract sections and analysis.`;
    const prompt = `Draft a contract for:
Title: ${contract_title}, Vendor: ${vendor_name}, Type: ${contract_type}
Value: $${total_value}, Terms: ${terms_conditions}, SLA: ${sla_terms}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "high" }, "contract_sections": { "preamble": "", "scope": "", "pricing": "", "sla": "", "termination": "" } }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'draft-contract', { contract_title, vendor_name, contract_type, total_value }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'contract_draft' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Evaluate Supplier
router.post('/evaluate-supplier', auth, aiRateLimiter, async (req, res) => {
  try {
    const { company_name, category, rating, certifications, quality_score, delivery_score, years_in_business } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a supplier evaluation specialist. Return structured JSON.`;
    const prompt = `Evaluate supplier: ${company_name}, Category: ${category}, Rating: ${rating}/5
Quality: ${quality_score}/100, Delivery: ${delivery_score}/100, Years: ${years_in_business}
Certifications: ${certifications}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "medium" }, "overall_score": 0, "strengths": [], "weaknesses": [], "strategic_fit": "" }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'evaluate-supplier', { company_name, category }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'supplier_evaluation' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Analyze Spend
router.post('/analyze-spend', auth, aiRateLimiter, async (req, res) => {
  try {
    const { spend_category, department, vendor_name, amount, budget_allocated, period } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a procurement spend analyst. Return structured JSON.`;
    const prompt = `Analyze spending: Category: ${spend_category}, Dept: ${department}
Vendor: ${vendor_name}, Amount: $${amount}, Budget: $${budget_allocated}, Period: ${period}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "medium" }, "budget_variance_pct": 0, "consolidation_opportunities": [], "action_items": [] }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'analyze-spend', { spend_category, department, amount }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'spend_analysis' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Optimize Savings
router.post('/optimize-savings', auth, aiRateLimiter, async (req, res) => {
  try {
    const { initiative_name, category, original_cost, negotiated_cost, savings_type } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a procurement savings strategist. Return structured JSON.`;
    const prompt = `Analyze savings initiative: ${initiative_name}, Category: ${category}
Original: $${original_cost}, Negotiated: $${negotiated_cost}, Type: ${savings_type}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "high" }, "validated_savings": 0, "additional_opportunities": [], "roi_projection": 0 }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'optimize-savings', { initiative_name, category, original_cost, negotiated_cost }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'savings_optimization' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Assess Risk
router.post('/assess-risk', auth, aiRateLimiter, async (req, res) => {
  try {
    const { assessment_title, vendor_name, risk_category, risk_level, description, mitigation_strategy } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a supply chain risk specialist. Return structured JSON.`;
    const prompt = `Assess risk: ${assessment_title}, Vendor: ${vendor_name}
Category: ${risk_category}, Level: ${risk_level}, Description: ${description}
Current mitigation: ${mitigation_strategy}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "high" }, "impact_score": 0, "probability_score": 0, "mitigation_recommendations": [], "contingency_plan": "" }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'assess-risk', { assessment_title, vendor_name, risk_category }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'risk_assessment' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Compliance Review
router.post('/compliance-review', auth, aiRateLimiter, async (req, res) => {
  try {
    const { requirement_name, regulation_type, vendor_name, compliance_status, audit_findings, corrective_actions } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a regulatory compliance specialist. Return structured JSON.`;
    const prompt = `Review compliance: ${requirement_name}, Regulation: ${regulation_type}
Vendor: ${vendor_name}, Status: ${compliance_status}
Findings: ${audit_findings}, Actions: ${corrective_actions}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "high" }, "compliance_score": 0, "gap_analysis": [], "remediation_steps": [], "timeline_days": 30 }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'compliance-review', { requirement_name, vendor_name, compliance_status }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'compliance_review' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Auction Strategy
router.post('/auction-strategy', auth, aiRateLimiter, async (req, res) => {
  try {
    const { auction_title, category, auction_type, starting_price, reserve_price, number_of_bidders } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a reverse auction expert. Return structured JSON with bid schedule.`;
    const prompt = `Develop auction strategy: ${auction_title}, Category: ${category}
Type: ${auction_type}, Starting: $${starting_price}, Reserve: $${reserve_price}, Bidders: ${number_of_bidders}

Return JSON: { "bid_schedule": [{ "round": 1, "target_price": 0, "decrement": 0, "expected_vendors": 0 }], "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "medium" }, "reserve_strategy": "", "expected_winner_price": 0 }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'auction-strategy', { auction_title, category, starting_price, reserve_price }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'auction_strategy' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Market Analysis
router.post('/market-analysis', auth, aiRateLimiter, async (req, res) => {
  try {
    const { report_title, commodity, current_price, price_trend, supply_outlook, demand_outlook, key_drivers } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a market intelligence analyst. Return structured JSON.`;
    const prompt = `Analyze market: ${report_title}, Commodity: ${commodity}
Price: $${current_price}, Trend: ${price_trend}, Supply: ${supply_outlook}, Demand: ${demand_outlook}
Drivers: ${key_drivers}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "medium" }, "price_forecast_30d": 0, "price_forecast_90d": 0, "procurement_timing": "", "hedging_strategy": "" }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'market-analysis', { report_title, commodity, current_price }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'market_analysis' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Performance Review
router.post('/performance-review', auth, aiRateLimiter, async (req, res) => {
  try {
    const { vendor_name, overall_score, quality_score, delivery_score, cost_score, defect_rate, on_time_delivery_pct } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a vendor performance specialist. Return structured JSON.`;
    const prompt = `Review performance: ${vendor_name}
Overall: ${overall_score}/100, Quality: ${quality_score}/100, Delivery: ${delivery_score}/100, Cost: ${cost_score}/100
Defect Rate: ${defect_rate}%, On-Time: ${on_time_delivery_pct}%

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "medium" }, "performance_grade": "A|B|C|D|F", "improvement_actions": [], "relationship_strategy": "" }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'performance-review', { vendor_name, overall_score }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'performance_review' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Review Approval
router.post('/review-approval', auth, aiRateLimiter, async (req, res) => {
  try {
    const { request_title, request_type, amount, justification, department } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a procurement approval reviewer. Return structured JSON.`;
    const prompt = `Review approval: ${request_title}, Type: ${request_type}
Amount: $${amount}, Dept: ${department}, Justification: ${justification}

Return JSON: { "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "high" }, "recommendation": "approve|reject|revise", "conditions": [], "risk_level": "low|medium|high", "budget_impact": 0 }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'review-approval', { request_title, request_type, amount }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'approval_review' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Category Analysis (Kraljic Matrix)
router.post('/category-analysis', auth, aiRateLimiter, async (req, res) => {
  try {
    const { category_name, annual_spend, number_of_suppliers, strategic_importance, supply_risk, sourcing_strategy, market_dynamics } = req.body;
    const pool = req.app.locals.pool;
    const systemPrompt = `You are a category management strategist using Kraljic matrix. Return structured JSON with matrix quadrant.`;
    const prompt = `Analyze category: ${category_name}, Annual Spend: $${annual_spend}
Suppliers: ${number_of_suppliers}, Strategic Importance: ${strategic_importance}, Supply Risk: ${supply_risk}
Strategy: ${sourcing_strategy}, Market: ${market_dynamics}

Return JSON: { "matrix_quadrant": "strategic|leverage|bottleneck|non-critical", "analysis": { "recommendations": [], "risks": [], "savings_opportunity": 0, "priority": "high" }, "supplier_rationalization": [], "savings_opportunities": [], "kpis": [] }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'category-analysis', { category_name, annual_spend, strategic_importance, supply_risk }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'category_analysis' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Supplier Consolidation (NEW)
router.post('/supplier-consolidation', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const spendData = await pool.query('SELECT * FROM spend_analytics ORDER BY amount DESC LIMIT 50');

    const systemPrompt = `You are a supplier consolidation expert. Analyze spend data and return structured JSON.`;
    const prompt = `Analyze spend data for supplier consolidation opportunities:
${JSON.stringify(spendData.rows, null, 2)}

Return JSON: { "consolidations": [{ "from_vendors": [], "to_vendor": "", "projected_savings": 0, "rationale": "", "risk_level": "low|medium|high" }], "total_projected_savings": 0, "implementation_timeline_months": 0 }`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'supplier-consolidation', { spendRows: spendData.rows.length }, result);
    res.json({ result: result.raw || content, parsed: result, type: 'supplier_consolidation' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Supplier diversity optimization
router.post('/supplier-diversity', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const suppliers = await pool.query('SELECT * FROM suppliers LIMIT 100').catch(() => ({ rows: [] }));

    const systemPrompt = `You are a supplier diversity expert. Identify diverse suppliers (minority, women-owned, small business, veteran-owned, LGBTQ+, disability-owned) and recommend prioritization. Return JSON only.`;
    const prompt = `Suppliers list:
${JSON.stringify(suppliers.rows.slice(0, 50), null, 2)}

Return JSON:
{
  "diverse_candidates": [{"supplier_id": <id>, "diversity_categories": ["..."], "fit_score": <0-100>, "rationale": "..."}],
  "current_diversity_pct": <0-100>,
  "target_diversity_pct": <0-100>,
  "recommendations": ["..."],
  "summary": "..."
}`;
    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };
    await persistAIResult(pool, req.user.id, 'supplier-diversity', { suppliers: suppliers.rows.length }, result);
    res.json({ result: content, parsed: result, type: 'supplier_diversity' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Predictive delivery / quality risk
router.post('/delivery-risk', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { supplier_id } = req.body;

    let supplier = null;
    if (supplier_id) {
      const r = await pool.query('SELECT * FROM suppliers WHERE id = $1', [supplier_id]).catch(() => ({ rows: [] }));
      supplier = r.rows[0] || null;
    }
    const recentRisks = await pool.query('SELECT * FROM risk_assessments ORDER BY created_at DESC LIMIT 20').catch(() => ({ rows: [] }));
    const scorecards = await pool.query('SELECT * FROM scorecards ORDER BY created_at DESC LIMIT 20').catch(() => ({ rows: [] }));

    const systemPrompt = `You are a supply chain risk analyst. Predict delivery and quality risk for a supplier based on history and benchmarks. Return JSON only.`;
    const prompt = `Supplier: ${JSON.stringify(supplier || {})}
Recent risk assessments: ${JSON.stringify(recentRisks.rows.slice(0, 10))}
Scorecards: ${JSON.stringify(scorecards.rows.slice(0, 10))}

Return JSON:
{
  "delivery_risk_score": <0-100>,
  "quality_risk_score": <0-100>,
  "predicted_late_delivery_pct": <0-100>,
  "key_factors": ["..."],
  "mitigations": ["..."],
  "review_cadence_days": <number>,
  "summary": "..."
}`;
    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };
    await persistAIResult(pool, req.user.id, 'delivery-risk', { supplier_id }, result);
    res.json({ result: content, parsed: result, type: 'delivery_risk' });
  } catch (err) {
    res.status(500).json({ error: 'AI service error' });
  }
});

// Supply Chain Resilience Mapping
router.post('/supply-chain-resilience', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { commodity, region, scenario_horizon_months } = req.body || {};

    const suppliers = await pool.query('SELECT * FROM suppliers LIMIT 50').catch(() => ({ rows: [] }));
    const recentRisks = await pool.query('SELECT * FROM risk_assessments ORDER BY created_at DESC LIMIT 20').catch(() => ({ rows: [] }));
    const contracts = await pool.query('SELECT id, vendor_name, contract_type, total_value, end_date FROM contracts LIMIT 30').catch(() => ({ rows: [] }));

    const systemPrompt = `You are a supply-chain resilience mapping expert. Map single-source dependencies,
geographic concentration, tier-2 exposure, and scenario-based shocks (e.g. port closure, regional conflict,
sanctions, climate). Recommend redundancy and dual-sourcing actions. Return JSON only.`;
    const prompt = `Commodity: ${commodity || 'unspecified'}
Region focus: ${region || 'global'}
Scenario horizon (months): ${scenario_horizon_months || 12}
Suppliers (sample): ${JSON.stringify(suppliers.rows.slice(0, 30))}
Recent risk assessments: ${JSON.stringify(recentRisks.rows.slice(0, 10))}
Active contracts: ${JSON.stringify(contracts.rows.slice(0, 20))}

Return JSON:
{
  "single_source_exposures": [{"category": "<text>", "vendor": "<text>", "spend_share_pct": <0-100>, "criticality": "low|medium|high"}],
  "geographic_concentration": [{"region": "<text>", "spend_share_pct": <0-100>, "shock_scenarios": ["<text>"]}],
  "tier2_exposures": ["<text>"],
  "shock_scenarios": [{"scenario": "<text>", "likelihood": "low|medium|high", "impact": "low|medium|high", "mitigations": ["<text>"]}],
  "redundancy_recommendations": [{"action": "<text>", "category": "<text>", "expected_resilience_gain_pct": <0-100>, "cost_estimate": "<text>"}],
  "overall_resilience_score": <0-100>,
  "summary": "<2-3 sentences>"
}`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'supply-chain-resilience', { commodity, region, scenario_horizon_months }, result);
    res.json({ result: content, parsed: result, type: 'supply_chain_resilience' });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: err.message });
    }
    res.status(500).json({ error: 'AI service error' });
  }
});

// Invoice Anomaly Detection
router.post('/invoice-anomaly', auth, aiRateLimiter, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { vendor_name, lookback_days, invoices: bodyInvoices } = req.body || {};

    let invoices = bodyInvoices;
    if (!Array.isArray(invoices) || invoices.length === 0) {
      const days = parseInt(lookback_days) || 180;
      try {
        const cond = vendor_name ? "AND vendor_name = $2" : '';
        const params = vendor_name ? [days, vendor_name] : [days];
        const r = await pool.query(
          `SELECT id, vendor_name, amount, period, spend_category, department, budget_allocated
             FROM spend_analytics
            WHERE created_at >= NOW() - ($1 || ' days')::interval ${cond}
            ORDER BY created_at DESC LIMIT 100`,
          params
        );
        invoices = r.rows;
      } catch (_) {
        invoices = [];
      }
    }

    const systemPrompt = `You are an accounts-payable forensic analyst. Find anomalies in vendor invoices:
duplicates, price spikes, round-number patterns, off-cycle billing, split invoicing to skirt approval
thresholds, vendor not on approved list, mismatched PO/receipt. Return JSON only.`;
    const prompt = `Vendor filter: ${vendor_name || 'ALL'}
Invoices (sample): ${JSON.stringify((invoices || []).slice(0, 80))}

Return JSON:
{
  "anomalies": [{"invoice_id": <id|null>, "vendor": "<text>", "type": "duplicate|price_spike|round_number|off_cycle|split|unapproved_vendor|po_mismatch|other", "severity": "low|medium|high", "amount": <number|null>, "evidence": "<text>", "recommended_action": "<text>"}],
  "duplicate_clusters": [["<invoice_id_or_label>"]],
  "vendor_risk_summary": [{"vendor": "<text>", "anomaly_count": <int>, "risk_level": "low|medium|high"}],
  "total_amount_at_risk": <number>,
  "summary": "<2-3 sentences>"
}`;

    const content = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(content);
    const result = parsed || { raw: content };

    await persistAIResult(pool, req.user.id, 'invoice-anomaly', { vendor_name, lookback_days, invoice_count: (invoices || []).length }, result);
    res.json({ result: content, parsed: result, type: 'invoice_anomaly' });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: err.message });
    }
    res.status(500).json({ error: 'AI service error' });
  }
});

// Get AI results history
router.get('/results', auth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [results, count] = await Promise.all([
      pool.query('SELECT * FROM ai_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [req.user.id, limit, offset]),
      pool.query('SELECT COUNT(*) FROM ai_results WHERE user_id = $1', [req.user.id])
    ]);

    res.json({
      data: results.rows,
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

module.exports = router;
