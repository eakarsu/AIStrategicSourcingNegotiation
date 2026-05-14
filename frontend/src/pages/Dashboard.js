import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Dashboard({ token }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    const endpoints = [
      { key: 'rfps', url: '/api/rfp' },
      { key: 'bids', url: '/api/bids' },
      { key: 'costModels', url: '/api/cost-models' },
      { key: 'negotiations', url: '/api/negotiation' },
      { key: 'contracts', url: '/api/contracts' },
      { key: 'suppliers', url: '/api/suppliers' },
      { key: 'spendAnalytics', url: '/api/spend-analytics' },
      { key: 'savings', url: '/api/savings' },
      { key: 'riskAssessments', url: '/api/risk-assessment' },
      { key: 'compliance', url: '/api/compliance' },
      { key: 'auctions', url: '/api/auctions' },
      { key: 'marketIntel', url: '/api/market-intel' },
      { key: 'scorecards', url: '/api/scorecards' },
      { key: 'approvals', url: '/api/approvals' },
      { key: 'categoryStrategy', url: '/api/category-strategy' },
    ];

    Promise.all(
      endpoints.map(ep =>
        axios.get(`${API}${ep.url}`, { headers }).then(r => ({ [ep.key]: r.data.length })).catch(() => ({ [ep.key]: 0 }))
      )
    ).then(results => {
      const merged = {};
      results.forEach(r => Object.assign(merged, r));
      setStats(merged);
    });
  }, [token]);

  const features = [
    { title: 'RFP Generation', description: 'Generate professional RFP documents from requirements using AI. Manage and track all your request for proposals.', path: '/rfp', key: 'rfps', icon: '📋', color: '#1a73e8', bg: '#e8f0fe' },
    { title: 'Bid Comparison Matrix', description: 'Compare vendor bids side-by-side with AI-powered analysis. Score and rank bids across multiple criteria.', path: '/bids', key: 'bids', icon: '📊', color: '#0d904f', bg: '#e6f4ea' },
    { title: 'Should-Cost Modeling', description: 'Build detailed cost models with AI analysis. Identify savings opportunities and benchmark against market prices.', path: '/cost-models', key: 'costModels', icon: '💰', color: '#e37400', bg: '#fef7e0' },
    { title: 'Negotiation Talking Points', description: 'AI-generated negotiation strategies and talking points. Prepare for vendor negotiations with data-driven insights.', path: '/negotiation', key: 'negotiations', icon: '🤝', color: '#7c3aed', bg: '#f3e8ff' },
    { title: 'Contract Drafting', description: 'Draft professional contracts with AI assistance. Manage contract lifecycle from creation to execution.', path: '/contracts', key: 'contracts', icon: '📝', color: '#d93025', bg: '#fce8e6' },
    { title: 'Supplier Management', description: 'Track and manage your supplier portfolio. Monitor ratings, certifications, and performance metrics.', path: '/suppliers', key: 'suppliers', icon: '🏭', color: '#0891b2', bg: '#e0f7fa' },
    { title: 'Spend Analytics', description: 'Analyze procurement spend across departments and categories. Track budgets and identify cost optimization opportunities.', path: '/spend-analytics', key: 'spendAnalytics', icon: '📈', color: '#059669', bg: '#d1fae5' },
    { title: 'Savings Tracker', description: 'Track negotiated savings and cost avoidance initiatives. Validate and report procurement value delivered.', path: '/savings', key: 'savings', icon: '💵', color: '#16a34a', bg: '#dcfce7' },
    { title: 'Risk Assessment', description: 'Identify and mitigate supplier and supply chain risks. AI-powered risk scoring and mitigation strategies.', path: '/risk-assessment', key: 'riskAssessments', icon: '⚠️', color: '#dc2626', bg: '#fee2e2' },
    { title: 'Compliance Tracking', description: 'Monitor regulatory compliance across vendors. Track audits, certifications, and corrective actions.', path: '/compliance', key: 'compliance', icon: '✅', color: '#4f46e5', bg: '#eef2ff' },
    { title: 'Auction Management', description: 'Run reverse auctions and competitive bidding events. AI-optimized auction strategies for maximum savings.', path: '/auctions', key: 'auctions', icon: '🔨', color: '#b45309', bg: '#fef3c7' },
    { title: 'Market Intelligence', description: 'Track commodity prices, market trends, and supply/demand dynamics. AI-driven market forecasting.', path: '/market-intel', key: 'marketIntel', icon: '🌍', color: '#0d9488', bg: '#ccfbf1' },
    { title: 'Performance Scorecards', description: 'Evaluate vendor performance with comprehensive scorecards. Track quality, delivery, cost, and innovation metrics.', path: '/scorecards', key: 'scorecards', icon: '🏆', color: '#ca8a04', bg: '#fef9c3' },
    { title: 'Approval Workflow', description: 'Manage procurement approval chains. Track purchase orders, contracts, and budget requests through approval stages.', path: '/approvals', key: 'approvals', icon: '✍️', color: '#9333ea', bg: '#f3e8ff' },
    { title: 'Category Strategy', description: 'Develop and manage sourcing strategies by category. Align procurement with business objectives and market dynamics.', path: '/category-strategy', key: 'categoryStrategy', icon: '🗂️', color: '#374151', bg: '#f3f4f6' },
    { title: 'Supplier Diversity', description: 'AI ranks diverse-supplier opportunities and surfaces diversity gaps in your spend.', path: '/supplier-diversity', icon: '🌈', color: '#7c3aed', bg: '#f3e8ff' },
    { title: 'Delivery & Quality Risk', description: 'Predict delivery and quality risk per supplier across a forward horizon.', path: '/delivery-risk', icon: '🚚', color: '#dc2626', bg: '#fee2e2' },
  ];

  const utilityFeatures = [
    { title: 'Global Search', description: 'Search across all modules - find suppliers, RFPs, contracts, and more instantly.', path: '/search', icon: '🔍', color: '#1a73e8', bg: '#e8f0fe' },
    { title: 'Export Data', description: 'Download procurement data as CSV files from any module for reporting and analysis.', path: '/export', icon: '📥', color: '#059669', bg: '#d1fae5' },
    { title: 'Activity Log', description: 'Track all user actions across the platform. Full audit trail for compliance.', path: '/activity-log', icon: '📜', color: '#7c3aed', bg: '#f3e8ff' },
    { title: 'Notifications', description: 'Stay updated with alerts for approvals, expirations, risk alerts, and milestones.', path: '/notifications', icon: '🔔', color: '#e37400', bg: '#fef7e0' },
    { title: 'My Profile', description: 'Manage your account settings, change password, and view your recent activity.', path: '/profile', icon: '👤', color: '#0891b2', bg: '#e0f7fa' },
  ];

  return (
    <div>
      <div className="dashboard-header">
        <h1>Strategic Sourcing Dashboard</h1>
        <p>AI-powered procurement intelligence platform with 20 integrated modules</p>
      </div>

      <div className="dashboard-stats">
        {features.slice(0, 5).map((f, i) => (
          <div key={i} className="stat-card" onClick={() => navigate(f.path)} style={{ cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
            <div className="stat-value">{stats[f.key] || 0}</div>
            <div className="stat-label">{f.title}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-cards">
        {features.map((f, i) => (
          <div key={i} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="feature-card-icon" style={{ background: f.bg, color: f.color }}>
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
            <span className="feature-card-count">{stats[f.key] || 0} items</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Platform Tools</h2>
        <p style={{ color: '#5f6368', fontSize: 14, marginBottom: 20 }}>Search, export, audit trail, notifications, and account management</p>
        <div className="dashboard-cards">
          {utilityFeatures.map((f, i) => (
            <div key={`util-${i}`} className="feature-card" onClick={() => navigate(f.path)}>
              <div className="feature-card-icon" style={{ background: f.bg, color: f.color }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
