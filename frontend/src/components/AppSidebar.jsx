import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './AppSidebar.css';

const LINKS = [
  { to: '/insights/timeline', label: 'Protected Route', group: 'Insights' },
  { to: '/codex/custom-viz', label: 'Protected Route', group: 'Insights' },
  { to: '/codex/operations', label: 'Protected Route', group: 'Insights' },
  { to: '/', label: 'Dashboard', group: 'Workspace' },
  { to: '/rfp', label: 'RFP', group: 'Workspace' },
  { to: '/bids', label: 'Bids', group: 'Workspace' },
  { to: '/cost-models', label: 'Cost Models', group: 'Workspace' },
  { to: '/negotiation', label: 'Negotiation', group: 'Workspace' },
  { to: '/contracts', label: 'Contracts', group: 'Workspace' },
  { to: '/suppliers', label: 'Suppliers', group: 'Workspace' },
  { to: '/spend-analytics', label: 'Spend Analytics', group: 'Workspace' },
  { to: '/savings', label: 'Savings', group: 'Workspace' },
  { to: '/risk-assessment', label: 'Risk Assessment', group: 'Workspace' },
  { to: '/compliance', label: 'Compliance', group: 'Workspace' },
  { to: '/auctions', label: 'Auctions', group: 'Workspace' },
  { to: '/market-intel', label: 'Market Intel', group: 'Workspace' },
  { to: '/scorecards', label: 'Scorecards', group: 'Workspace' },
  { to: '/approvals', label: 'Approvals', group: 'Workspace' },
  { to: '/category-strategy', label: 'Category Strategy', group: 'Workspace' },
  { to: '/activity-log', label: 'Activity Log', group: 'Workspace' },
  { to: '/notifications', label: 'Notifications', group: 'Workspace' },
  { to: '/search', label: 'Search', group: 'Workspace' },
  { to: '/profile', label: 'Profile', group: 'Workspace' },
  { to: '/export', label: 'Export', group: 'Workspace' },
  { to: '/auction-room', label: 'Auction Room', group: 'Workspace' },
  { to: '/supplier-consolidation', label: 'Supplier Consolidation', group: 'Workspace' },
  { to: '/approval-workflow', label: 'Approval Workflow', group: 'Workspace' },
  { to: '/supplier-diversity', label: 'Supplier Diversity', group: 'Workspace' },
  { to: '/delivery-risk', label: 'Delivery Risk', group: 'Workspace' },
  { to: '/supply-chain-resilience', label: 'Supply Chain Resilience', group: 'Workspace' },
  { to: '/invoice-anomaly', label: 'Invoice Anomaly', group: 'Workspace' },
  { to: '/custom-views', label: 'Custom Views', group: 'Workspace' },
  { to: '/cf-supplier-diversity-optimization-identifying-minority-women-small-suppliers', label: 'Protected Route', group: 'Workspace' },
  { to: '/cf-predictive-delivery-risk-flagging-suppliers-likely-to-miss', label: 'Protected Route', group: 'Workspace' },
  { to: '/cf-supply-chain-resilience-mapping-identifying-single-sourced-categories', label: 'Protected Route', group: 'Workspace' },
  { to: '/cf-invoice-anomaly-detection-for-manual-review', label: 'Protected Route', group: 'Workspace' },
  { to: '/cf-marketplace-integration-for-direct-sourcing-with-auto-price-monitoring', label: 'Protected Route', group: 'Workspace' },
  { to: '/cf-contract-obligation-tracker-with-alerts-for-renewals-sla', label: 'Protected Route', group: 'Workspace' },
  { to: '/gap-no-ai-driven-supplier-diversity-optimization', label: 'Protected Route', group: 'Workspace' },
  { to: '/gap-no-predictive-delivery-quality-risk-model', label: 'Protected Route', group: 'Workspace' },
  { to: '/gap-no-invoice-anomaly-detection-ai', label: 'Protected Route', group: 'Workspace' },
  { to: '/gap-limited-integrations-only-an-export-module-no-erp', label: 'Protected Route', group: 'Workspace' },
  { to: '/gap-no-supplier-portal-for-collaborative-bidding', label: 'Protected Route', group: 'Workspace' },
  { to: '/gap-no-invoice-matching-three-way-match-automation', label: 'Protected Route', group: 'Workspace' },
  { to: '/gap-no-contract-obligation-tracking-with-calendar-alerts', label: 'Protected Route', group: 'Workspace' },
  { to: '/gap-no-webhooks-for-external-system-events', label: 'Protected Route', group: 'Workspace' },
  { to: '/gap-no-e-signature-workflow-for-contracts', label: 'Protected Route', group: 'Workspace' },
];

export default function AppSidebar() {
  const [query, setQuery] = useState('');
  const visible = LINKS.filter(link => link.label.toLowerCase().includes(query.toLowerCase().trim()));
  return <aside className="codex-side" aria-label="Application navigation">
    <div className="codex-side-brand"><strong>AIStrategic Sourcing Negotiation</strong><span>Workspace</span></div>
    <label className="codex-side-search-label" htmlFor="codex-side-search">Find a section</label>
    <input id="codex-side-search" className="codex-side-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search navigation" />
    <nav className="codex-side-links" aria-label="Sections">
      {['Workspace', 'AI tools', 'Insights'].map(group => {
        const items = visible.filter(link => link.group === group);
        return items.length ? <div className="codex-side-group" key={group}>
          <span className="codex-side-heading">{group}</span>
          {items.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `codex-side-link${isActive ? ' active' : ''}`}>{link.label}</NavLink>)}
        </div> : null;
      })}
      {visible.length === 0 && <p className="codex-side-empty">No matching sections</p>}
    </nav>
  </aside>;
}
