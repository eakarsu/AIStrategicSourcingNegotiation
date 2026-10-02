import React from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: "/rfp", label: "RFPPage" },
  { to: "/bids", label: "Bids Page" },
  { to: "/cost-models", label: "Cost Models Page" },
  { to: "/negotiation", label: "Negotiation Page" },
  { to: "/contracts", label: "Contracts Page" },
  { to: "/suppliers", label: "Suppliers Page" },
  { to: "/spend-analytics", label: "Spend Analytics Page" },
  { to: "/savings", label: "Savings Page" },
  { to: "/risk-assessment", label: "Risk Assessment Page" },
  { to: "/compliance", label: "Compliance Page" },
  { to: "/auctions", label: "Auctions Page" },
  { to: "/market-intel", label: "Market Intel Page" },
  { to: "/scorecards", label: "Scorecards Page" },
  { to: "/approvals", label: "Approvals Page" },
  { to: "/category-strategy", label: "Category Strategy Page" },
  { to: "/activity-log", label: "Activity Log Page" },
  { to: "/notifications", label: "Notifications Page" },
  { to: "/search", label: "Search Page" },
  { to: "/profile", label: "Profile Page" },
  { to: "/export", label: "Export Page" },
  { to: "/auction-room", label: "Auction Room Page" },
  { to: "/supplier-consolidation", label: "Supplier Consolidation Page" },
  { to: "/approval-workflow", label: "Approval Workflow Page" },
  { to: "/supplier-diversity", label: "Supplier Diversity Page" },
  { to: "/delivery-risk", label: "Delivery Risk Page" },
  { to: "/supply-chain-resilience", label: "Supply Chain Resilience Page" },
  { to: "/invoice-anomaly", label: "Invoice Anomaly Page" },
  { to: "/custom-views", label: "Custom Views Page" },
  { to: "/cf-supplier-diversity-optimization-identifying-minority-women-small-suppliers", label: "Protected Route" },
  { to: "/cf-predictive-delivery-risk-flagging-suppliers-likely-to-miss", label: "Protected Route" },
  { to: "/cf-supply-chain-resilience-mapping-identifying-single-sourced-categories", label: "Protected Route" },
  { to: "/cf-invoice-anomaly-detection-for-manual-review", label: "Protected Route" },
  { to: "/cf-marketplace-integration-for-direct-sourcing-with-auto-price-monitoring", label: "Protected Route" },
  { to: "/cf-contract-obligation-tracker-with-alerts-for-renewals-sla", label: "Protected Route" },
  { to: "/gap-no-ai-driven-supplier-diversity-optimization", label: "Protected Route" },
  { to: "/gap-no-predictive-delivery-quality-risk-model", label: "Protected Route" },
  { to: "/gap-no-invoice-anomaly-detection-ai", label: "Protected Route" },
  { to: "/gap-limited-integrations-only-an-export-module-no-erp", label: "Protected Route" },
  { to: "/gap-no-supplier-portal-for-collaborative-bidding", label: "Protected Route" },
  { to: "/gap-no-invoice-matching-three-way-match-automation", label: "Protected Route" },
  { to: "/gap-no-contract-obligation-tracking-with-calendar-alerts", label: "Protected Route" },
  { to: "/gap-no-webhooks-for-external-system-events", label: "Protected Route" },
  { to: "/gap-no-e-signature-workflow-for-contracts", label: "Protected Route" },
];

const CSS = `
.app-shell{display:grid;grid-template-columns:264px 1fr;min-height:100vh}
.sidebar{background:#0b1220;color:#fff;padding:22px 14px;position:sticky;top:0;height:100vh;overflow:auto;display:flex;flex-direction:column;gap:6px}
.sidebar-brand{padding:6px 10px 16px;border-bottom:1px solid #ffffff18;margin-bottom:10px}
.sidebar-brand .eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:11px;font-weight:800;color:#7dd3fc}
.sidebar-brand h1{font-size:17px;margin:8px 0 0;line-height:1.25;word-break:break-word}
.sidebar-nav{display:flex;flex-direction:column;gap:2px;flex:1;overflow:auto}
.sidebar-nav a{display:block;border-radius:10px;color:#94a3b8;padding:9px 12px;text-decoration:none;font-weight:600;font-size:13.5px}
.sidebar-nav a:hover{background:#ffffff12;color:#fff}
.sidebar-nav a.active{background:#2563eb;color:#fff}
.sidebar-foot{margin-top:12px;padding-top:12px;border-top:1px solid #ffffff18;display:flex;flex-direction:column;gap:8px}
.sidebar-user{font-size:12px;color:#cbd5e1}
.sidebar-logout{border:0;border-radius:10px;padding:10px 12px;font-weight:800;cursor:pointer;background:#1e293b;color:#e2e8f0}
.sidebar-logout:hover{background:#334155}
@media(max-width:900px){.app-shell{grid-template-columns:1fr}.sidebar{position:relative;height:auto}}
`;

export default function Sidebar({ user, onLogout }) {
  return (
    <>
      <style>{CSS}</style>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="eyebrow">Sidebar app</span>
          <h1>AIStrategicSourcingNegotiation</h1>
        </div>
        <nav className="sidebar-nav">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {user && <span className="sidebar-user">{user.name || user.email || 'Signed in'}</span>}
          <button className="sidebar-logout" onClick={onLogout}>Logout</button>
        </div>
      </aside>
    </>
  );
}
