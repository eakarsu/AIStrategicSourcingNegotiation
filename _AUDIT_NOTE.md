# Audit Note — AIStrategicSourcingNegotiation

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_08.md` (section 7).

## Original Recommendations

### Missing AI Counterparts
- AI-driven supplier diversity optimization
- Predictive delivery/quality risk

### Missing Non-AI Features
- ERP (SAP, Oracle) integrations
- Supplier portal for collaborative bidding
- Invoice three-way match automation
- Contract obligation tracking

### Custom Feature Suggestions
- Supplier diversity optimization
- Predictive delivery risk
- Supply chain resilience mapping
- Invoice anomaly detection
- Marketplace integration

## Implemented (this round)
1. `POST /api/ai/supplier-diversity` — diverse-supplier ranking + diversity gap analysis.
2. `POST /api/ai/delivery-risk` — predicted delivery/quality risk per supplier.

Pattern reused: `callOpenRouter` + `parseAIJson` + `persistAIResult(pool, ...)`. Syntax-checked.

## Backlog (prioritized)
1. **MECHANICAL** Supply chain resilience mapping endpoint.
2. **MECHANICAL** Invoice anomaly detection endpoint.
3. **NEEDS-CREDS** ERP integrations (SAP/Oracle).
4. **NEEDS-PRODUCT-DECISION** Supplier portal, contract obligation tracker.

## Apply pass 3 (frontend)

LEFT-AS-IS. `frontend/src/pages/SupplierDiversityPage.js` and `DeliveryRiskPage.js`
already call `/api/ai/supplier-diversity` and `/api/ai/delivery-risk` with explicit
`Authorization: Bearer ${token}` (token passed in from `App.js`). Both routes
registered in `App.js` (lines 31-32, 97-98). Errors (including 503 no-key) handled
via react-toastify. No FE changes required.

## Apply pass 4 (mechanical backlog)

LEFT-AS-IS. Both MECHANICAL backlog items are already implemented end-to-end:

1. `POST /api/ai/supply-chain-resilience` — `backend/routes/ai.js:545` | FE: `frontend/src/pages/SupplyChainResiliencePage.js` (registered in `App.js:33,101`).
2. `POST /api/ai/invoice-anomaly` — `backend/routes/ai.js:590` | FE: `frontend/src/pages/InvoiceAnomalyPage.js` (registered in `App.js:34,102`).

Both reuse `callOpenRouter` + `parseAIJson` + `persistAIResult` and `aiRateLimiter`
+ `auth`. 503 surfaces from the shared helper when `OPENROUTER_API_KEY` is unset.
Remaining backlog is NEEDS-CREDS (ERP) / NEEDS-PRODUCT-DECISION (supplier portal,
contract obligation tracker). No code changes this pass.
