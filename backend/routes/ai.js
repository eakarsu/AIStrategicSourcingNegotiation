const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const https = require('https');
const http = require('http');

async function callOpenRouter(prompt, systemPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

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

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'OpenRouter API error'));
          } else {
            resolve(parsed.choices[0].message.content);
          }
        } catch (e) {
          reject(new Error('Failed to parse AI response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Generate RFP
router.post('/generate-rfp', auth, async (req, res) => {
  try {
    const { title, category, requirements, budget_range } = req.body;
    const systemPrompt = `You are an expert procurement specialist. Generate a professional, detailed RFP (Request for Proposal) document. Format your response with clear sections using markdown-style headers. Include: Executive Summary, Scope of Work, Technical Requirements, Evaluation Criteria, Timeline, Budget Guidelines, Submission Requirements, and Terms & Conditions.`;
    const prompt = `Generate a comprehensive RFP document for:
Title: ${title}
Category: ${category}
Requirements: ${requirements}
Budget Range: ${budget_range}

Make it professional and detailed with specific evaluation criteria and clear deliverables.`;

    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'rfp_generation' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compare Bids
router.post('/compare-bids', auth, async (req, res) => {
  try {
    const { bids, criteria } = req.body;
    const systemPrompt = `You are an expert procurement analyst specializing in bid evaluation. Analyze and compare vendor bids with detailed scoring matrices. Provide clear recommendations with data-driven insights. Format your response professionally with sections for: Overall Ranking, Detailed Comparison Matrix, Strengths & Weaknesses per vendor, Risk Assessment, and Final Recommendation.`;
    const prompt = `Compare and analyze these vendor bids:
${JSON.stringify(bids, null, 2)}

Evaluation Criteria: ${criteria || 'Price, Quality, Delivery, Experience, Compliance'}

Provide a detailed comparison matrix with scores, identify the best value proposition, and give a clear recommendation.`;

    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'bid_comparison' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Should-Cost Analysis
router.post('/should-cost', auth, async (req, res) => {
  try {
    const { product_name, category, material_cost, labor_cost, overhead_cost, volume, market_price } = req.body;
    const systemPrompt = `You are an expert cost engineer and should-cost modeling specialist. Provide detailed cost breakdown analysis, identify cost reduction opportunities, and benchmark against market prices. Format your response with sections for: Cost Breakdown Analysis, Market Benchmarking, Cost Drivers, Optimization Opportunities, Recommended Target Price, and Negotiation Leverage Points.`;
    const prompt = `Perform a should-cost analysis for:
Product: ${product_name}
Category: ${category}
Material Cost: $${material_cost}
Labor Cost: $${labor_cost}
Overhead Cost: $${overhead_cost}
Volume: ${volume}
Current Market Price: $${market_price}

Analyze the cost structure, identify potential savings, benchmark against industry standards, and recommend a target price.`;

    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'should_cost' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Negotiation Talking Points
router.post('/negotiation-points', auth, async (req, res) => {
  try {
    const { negotiation_title, vendor_name, our_position, vendor_position, batna, leverage_points } = req.body;
    const systemPrompt = `You are an expert negotiation strategist specializing in procurement and vendor negotiations. Generate comprehensive, actionable negotiation talking points and strategies. Format your response with sections for: Opening Strategy, Key Talking Points, Counter-Arguments, Concession Strategy, Walk-Away Scenarios, Win-Win Opportunities, and Closing Tactics.`;
    const prompt = `Generate negotiation talking points for:
Negotiation: ${negotiation_title}
Vendor: ${vendor_name}
Our Position: ${our_position}
Vendor's Likely Position: ${vendor_position}
BATNA (Best Alternative): ${batna}
Leverage Points: ${leverage_points}

Provide strategic, actionable talking points with specific tactics for each phase of the negotiation.`;

    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'negotiation_points' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Draft Contract
router.post('/draft-contract', auth, async (req, res) => {
  try {
    const { contract_title, vendor_name, contract_type, total_value, terms_conditions, sla_terms } = req.body;
    const systemPrompt = `You are an expert contract attorney specializing in procurement and vendor contracts. Draft professional, legally-sound contract language. Format your response with clear sections including: Preamble, Definitions, Scope of Work, Pricing & Payment Terms, Service Level Agreements, Intellectual Property, Confidentiality, Warranties, Indemnification, Limitation of Liability, Term & Termination, Dispute Resolution, and General Provisions.`;
    const prompt = `Draft a professional contract for:
Title: ${contract_title}
Vendor: ${vendor_name}
Contract Type: ${contract_type}
Total Value: $${total_value}
Key Terms: ${terms_conditions}
SLA Requirements: ${sla_terms}

Generate comprehensive contract language that protects our interests while maintaining fairness.`;

    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'contract_draft' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Evaluate Supplier
router.post('/evaluate-supplier', auth, async (req, res) => {
  try {
    const { company_name, category, rating, certifications, quality_score, delivery_score, years_in_business } = req.body;
    const systemPrompt = `You are an expert supplier evaluation specialist. Provide comprehensive supplier assessments with actionable insights. Format with sections for: Overall Assessment, Strengths, Weaknesses, Risk Factors, Improvement Recommendations, Benchmarking, and Strategic Fit Analysis.`;
    const prompt = `Evaluate this supplier:\nCompany: ${company_name}\nCategory: ${category}\nRating: ${rating}/5\nCertifications: ${certifications}\nQuality Score: ${quality_score}/100\nDelivery Score: ${delivery_score}/100\nYears in Business: ${years_in_business}\n\nProvide a thorough evaluation with improvement recommendations.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'supplier_evaluation' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Analyze Spend
router.post('/analyze-spend', auth, async (req, res) => {
  try {
    const { spend_category, department, vendor_name, amount, budget_allocated, period } = req.body;
    const systemPrompt = `You are an expert procurement spend analyst. Analyze spending patterns and provide actionable cost optimization recommendations. Format with sections for: Spend Overview, Budget Variance Analysis, Trend Analysis, Optimization Opportunities, Consolidation Recommendations, and Action Items.`;
    const prompt = `Analyze this spending record:\nCategory: ${spend_category}\nDepartment: ${department}\nVendor: ${vendor_name}\nAmount: $${amount}\nBudget Allocated: $${budget_allocated}\nPeriod: ${period}\n\nAnalyze spending efficiency and recommend optimizations.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'spend_analysis' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Optimize Savings
router.post('/optimize-savings', auth, async (req, res) => {
  try {
    const { initiative_name, category, original_cost, negotiated_cost, savings_type } = req.body;
    const systemPrompt = `You are an expert procurement savings strategist. Analyze savings initiatives and identify additional optimization opportunities. Format with sections for: Savings Validation, Additional Opportunities, Implementation Strategy, Sustainability Assessment, Best Practices, and ROI Projection.`;
    const prompt = `Analyze this savings initiative:\nInitiative: ${initiative_name}\nCategory: ${category}\nOriginal Cost: $${original_cost}\nNegotiated Cost: $${negotiated_cost}\nSavings Type: ${savings_type}\n\nValidate savings and identify additional optimization opportunities.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'savings_optimization' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Assess Risk
router.post('/assess-risk', auth, async (req, res) => {
  try {
    const { assessment_title, vendor_name, risk_category, risk_level, description, mitigation_strategy } = req.body;
    const systemPrompt = `You are an expert supply chain risk management specialist. Provide comprehensive risk assessments with actionable mitigation strategies. Format with sections for: Risk Summary, Impact Analysis, Probability Assessment, Root Cause Analysis, Mitigation Recommendations, Contingency Planning, and Monitoring Framework.`;
    const prompt = `Assess this risk:\nTitle: ${assessment_title}\nVendor: ${vendor_name}\nCategory: ${risk_category}\nCurrent Level: ${risk_level}\nDescription: ${description}\nCurrent Mitigation: ${mitigation_strategy}\n\nProvide detailed risk assessment and enhanced mitigation strategies.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'risk_assessment' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Compliance Review
router.post('/compliance-review', auth, async (req, res) => {
  try {
    const { requirement_name, regulation_type, vendor_name, compliance_status, audit_findings, corrective_actions } = req.body;
    const systemPrompt = `You are an expert regulatory compliance specialist in procurement. Provide thorough compliance reviews with remediation guidance. Format with sections for: Compliance Status Summary, Gap Analysis, Regulatory Requirements, Remediation Steps, Timeline Recommendations, Documentation Requirements, and Ongoing Monitoring Plan.`;
    const prompt = `Review compliance for:\nRequirement: ${requirement_name}\nRegulation: ${regulation_type}\nVendor: ${vendor_name}\nCurrent Status: ${compliance_status}\nAudit Findings: ${audit_findings}\nCorrective Actions: ${corrective_actions}\n\nProvide compliance review and remediation guidance.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'compliance_review' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Auction Strategy
router.post('/auction-strategy', auth, async (req, res) => {
  try {
    const { auction_title, category, auction_type, starting_price, reserve_price, number_of_bidders } = req.body;
    const systemPrompt = `You are an expert in reverse auctions and competitive bidding for procurement. Provide auction strategy recommendations. Format with sections for: Auction Design Recommendations, Pricing Strategy, Bidder Engagement, Rules & Parameters, Risk Mitigation, Expected Outcomes, and Post-Auction Negotiation Tips.`;
    const prompt = `Develop auction strategy for:\nTitle: ${auction_title}\nCategory: ${category}\nType: ${auction_type}\nStarting Price: $${starting_price}\nReserve Price: $${reserve_price}\nNumber of Bidders: ${number_of_bidders}\n\nProvide optimal auction configuration and strategy.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'auction_strategy' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Market Analysis
router.post('/market-analysis', auth, async (req, res) => {
  try {
    const { report_title, commodity, current_price, price_trend, supply_outlook, demand_outlook, key_drivers } = req.body;
    const systemPrompt = `You are an expert commodity and market intelligence analyst for procurement. Provide detailed market analysis with actionable procurement recommendations. Format with sections for: Market Overview, Price Forecast, Supply-Demand Analysis, Key Risk Factors, Procurement Timing Recommendations, Hedging Strategies, and Strategic Implications.`;
    const prompt = `Analyze market conditions for:\nReport: ${report_title}\nCommodity: ${commodity}\nCurrent Price: $${current_price}\nPrice Trend: ${price_trend}\nSupply Outlook: ${supply_outlook}\nDemand Outlook: ${demand_outlook}\nKey Drivers: ${key_drivers}\n\nProvide market analysis and procurement timing recommendations.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'market_analysis' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Performance Review
router.post('/performance-review', auth, async (req, res) => {
  try {
    const { vendor_name, overall_score, quality_score, delivery_score, cost_score, defect_rate, on_time_delivery_pct } = req.body;
    const systemPrompt = `You are an expert vendor performance management specialist. Provide comprehensive performance reviews with improvement plans. Format with sections for: Performance Summary, Scorecard Analysis, Trend Assessment, Comparative Benchmarking, Improvement Recommendations, Action Items, and Relationship Strategy.`;
    const prompt = `Review vendor performance for:\nVendor: ${vendor_name}\nOverall Score: ${overall_score}/100\nQuality: ${quality_score}/100\nDelivery: ${delivery_score}/100\nCost: ${cost_score}/100\nDefect Rate: ${defect_rate}%\nOn-Time Delivery: ${on_time_delivery_pct}%\n\nProvide comprehensive performance review and improvement plan.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'performance_review' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Review Approval
router.post('/review-approval', auth, async (req, res) => {
  try {
    const { request_title, request_type, amount, justification, department } = req.body;
    const systemPrompt = `You are an expert procurement approval reviewer. Analyze procurement requests for completeness, risk, and value. Format with sections for: Request Summary, Risk Assessment, Value Analysis, Compliance Check, Budget Impact, Recommendation (Approve/Reject/Revise), and Conditions.`;
    const prompt = `Review this approval request:\nTitle: ${request_title}\nType: ${request_type}\nAmount: $${amount}\nDepartment: ${department}\nJustification: ${justification}\n\nProvide approval recommendation with risk assessment and conditions.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'approval_review' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Category Analysis
router.post('/category-analysis', auth, async (req, res) => {
  try {
    const { category_name, annual_spend, number_of_suppliers, strategic_importance, supply_risk, sourcing_strategy, market_dynamics } = req.body;
    const systemPrompt = `You are an expert category management strategist in procurement. Provide comprehensive category strategies using Kraljic matrix and Porter's Five Forces. Format with sections for: Category Profile, Kraljic Positioning, Market Analysis, Strategic Recommendations, Supplier Rationalization, Savings Opportunities, Implementation Roadmap, and KPIs.`;
    const prompt = `Analyze category strategy for:\nCategory: ${category_name}\nAnnual Spend: $${annual_spend}\nSupplier Count: ${number_of_suppliers}\nStrategic Importance: ${strategic_importance}\nSupply Risk: ${supply_risk}\nCurrent Strategy: ${sourcing_strategy}\nMarket Dynamics: ${market_dynamics}\n\nProvide strategic category management recommendations.`;
    const result = await callOpenRouter(prompt, systemPrompt);
    res.json({ result, type: 'category_analysis' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
