import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RFPPage from './pages/RFPPage';
import BidsPage from './pages/BidsPage';
import CostModelsPage from './pages/CostModelsPage';
import NegotiationPage from './pages/NegotiationPage';
import ContractsPage from './pages/ContractsPage';
import SuppliersPage from './pages/SuppliersPage';
import SpendAnalyticsPage from './pages/SpendAnalyticsPage';
import SavingsPage from './pages/SavingsPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import CompliancePage from './pages/CompliancePage';
import AuctionsPage from './pages/AuctionsPage';
import MarketIntelPage from './pages/MarketIntelPage';
import ScorecardsPage from './pages/ScorecardsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import CategoryStrategyPage from './pages/CategoryStrategyPage';
import ActivityLogPage from './pages/ActivityLogPage';
import NotificationsPage from './pages/NotificationsPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import ExportPage from './pages/ExportPage';
import AuctionRoomPage from './pages/AuctionRoomPage';
import SupplierConsolidationPage from './pages/SupplierConsolidationPage';
import ApprovalWorkflowPage from './pages/ApprovalWorkflowPage';
import SupplierDiversityPage from './pages/SupplierDiversityPage';
import DeliveryRiskPage from './pages/DeliveryRiskPage';
import SupplyChainResiliencePage from './pages/SupplyChainResiliencePage';
import InvoiceAnomalyPage from './pages/InvoiceAnomalyPage';
import Navbar from './components/Navbar';
import CustomViewsPage from './pages/CustomViewsPage';
import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// === Batch 08 Gaps & Frontend Mounts ===
import CfSupplierDiversityOptimizationIdentifyingMinorityWomenSmall from './pages/CfSupplierDiversityOptimizationIdentifyingMinorityWomenSmall'
import CfPredictiveDeliveryRiskFlaggingSuppliersLikelyTo from './pages/CfPredictiveDeliveryRiskFlaggingSuppliersLikelyTo'
import CfSupplyChainResilienceMappingIdentifyingSingleSourced from './pages/CfSupplyChainResilienceMappingIdentifyingSingleSourced'
import CfInvoiceAnomalyDetectionForManualReview from './pages/CfInvoiceAnomalyDetectionForManualReview'
import CfMarketplaceIntegrationForDirectSourcingWithAuto from './pages/CfMarketplaceIntegrationForDirectSourcingWithAuto'
import CfContractObligationTrackerWithAlertsForRenewals from './pages/CfContractObligationTrackerWithAlertsForRenewals'
import GapNoAiDrivenSupplierDiversityOptimization from './pages/GapNoAiDrivenSupplierDiversityOptimization'
import GapNoPredictiveDeliveryQualityRiskModel from './pages/GapNoPredictiveDeliveryQualityRiskModel'
import GapNoInvoiceAnomalyDetectionAi from './pages/GapNoInvoiceAnomalyDetectionAi'
import GapLimitedIntegrationsOnlyAnExportModuleNo from './pages/GapLimitedIntegrationsOnlyAnExportModuleNo'
import GapNoSupplierPortalForCollaborativeBidding from './pages/GapNoSupplierPortalForCollaborativeBidding'
import GapNoInvoiceMatchingThreeWayMatchAutomation from './pages/GapNoInvoiceMatchingThreeWayMatchAutomation'
import GapNoContractObligationTrackingWithCalendarAlerts from './pages/GapNoContractObligationTrackingWithCalendarAlerts'
import GapNoWebhooksForExternalSystemEvents from './pages/GapNoWebhooksForExternalSystemEvents'
import GapNoESignatureWorkflowForContracts from './pages/GapNoESignatureWorkflowForContracts'

// Minimal ProtectedRoute shim — earlier batch referenced this without importing/defining it.
function ProtectedRoute({ children }) {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? children : <Navigate to="/" />;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (tokenVal, userVal) => {
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  if (!token) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} onLogout={handleLogout} token={token} />
        <main className="main-content">
          <Routes>
        <Route path="/insights/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

            <Route path="/" element={<Dashboard token={token} />} />
            <Route path="/rfp" element={<RFPPage token={token} />} />
            <Route path="/bids" element={<BidsPage token={token} />} />
            <Route path="/cost-models" element={<CostModelsPage token={token} />} />
            <Route path="/negotiation" element={<NegotiationPage token={token} />} />
            <Route path="/contracts" element={<ContractsPage token={token} />} />
            <Route path="/suppliers" element={<SuppliersPage token={token} />} />
            <Route path="/spend-analytics" element={<SpendAnalyticsPage token={token} />} />
            <Route path="/savings" element={<SavingsPage token={token} />} />
            <Route path="/risk-assessment" element={<RiskAssessmentPage token={token} />} />
            <Route path="/compliance" element={<CompliancePage token={token} />} />
            <Route path="/auctions" element={<AuctionsPage token={token} />} />
            <Route path="/market-intel" element={<MarketIntelPage token={token} />} />
            <Route path="/scorecards" element={<ScorecardsPage token={token} />} />
            <Route path="/approvals" element={<ApprovalsPage token={token} />} />
            <Route path="/category-strategy" element={<CategoryStrategyPage token={token} />} />
            <Route path="/activity-log" element={<ActivityLogPage token={token} />} />
            <Route path="/notifications" element={<NotificationsPage token={token} />} />
            <Route path="/search" element={<SearchPage token={token} />} />
            <Route path="/profile" element={<ProfilePage token={token} user={user} onUserUpdate={handleUserUpdate} />} />
            <Route path="/export" element={<ExportPage token={token} />} />
            <Route path="/auction-room" element={<AuctionRoomPage token={token} />} />
            <Route path="/supplier-consolidation" element={<SupplierConsolidationPage token={token} />} />
            <Route path="/approval-workflow" element={<ApprovalWorkflowPage token={token} />} />
            <Route path="/supplier-diversity" element={<SupplierDiversityPage token={token} />} />
            <Route path="/delivery-risk" element={<DeliveryRiskPage token={token} />} />
            <Route path="/supply-chain-resilience" element={<SupplyChainResiliencePage token={token} />} />
            <Route path="/invoice-anomaly" element={<InvoiceAnomalyPage token={token} />} />
            <Route path="/custom-views" element={<CustomViewsPage token={token} />} />
            {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-supplier-diversity-optimization-identifying-minority-women-small-suppliers" element={<ProtectedRoute><CfSupplierDiversityOptimizationIdentifyingMinorityWomenSmall /></ProtectedRoute>} />
      <Route path="/cf-predictive-delivery-risk-flagging-suppliers-likely-to-miss" element={<ProtectedRoute><CfPredictiveDeliveryRiskFlaggingSuppliersLikelyTo /></ProtectedRoute>} />
      <Route path="/cf-supply-chain-resilience-mapping-identifying-single-sourced-categories" element={<ProtectedRoute><CfSupplyChainResilienceMappingIdentifyingSingleSourced /></ProtectedRoute>} />
      <Route path="/cf-invoice-anomaly-detection-for-manual-review" element={<ProtectedRoute><CfInvoiceAnomalyDetectionForManualReview /></ProtectedRoute>} />
      <Route path="/cf-marketplace-integration-for-direct-sourcing-with-auto-price-monitoring" element={<ProtectedRoute><CfMarketplaceIntegrationForDirectSourcingWithAuto /></ProtectedRoute>} />
      <Route path="/cf-contract-obligation-tracker-with-alerts-for-renewals-sla" element={<ProtectedRoute><CfContractObligationTrackerWithAlertsForRenewals /></ProtectedRoute>} />
      <Route path="/gap-no-ai-driven-supplier-diversity-optimization" element={<ProtectedRoute><GapNoAiDrivenSupplierDiversityOptimization /></ProtectedRoute>} />
      <Route path="/gap-no-predictive-delivery-quality-risk-model" element={<ProtectedRoute><GapNoPredictiveDeliveryQualityRiskModel /></ProtectedRoute>} />
      <Route path="/gap-no-invoice-anomaly-detection-ai" element={<ProtectedRoute><GapNoInvoiceAnomalyDetectionAi /></ProtectedRoute>} />
      <Route path="/gap-limited-integrations-only-an-export-module-no-erp" element={<ProtectedRoute><GapLimitedIntegrationsOnlyAnExportModuleNo /></ProtectedRoute>} />
      <Route path="/gap-no-supplier-portal-for-collaborative-bidding" element={<ProtectedRoute><GapNoSupplierPortalForCollaborativeBidding /></ProtectedRoute>} />
      <Route path="/gap-no-invoice-matching-three-way-match-automation" element={<ProtectedRoute><GapNoInvoiceMatchingThreeWayMatchAutomation /></ProtectedRoute>} />
      <Route path="/gap-no-contract-obligation-tracking-with-calendar-alerts" element={<ProtectedRoute><GapNoContractObligationTrackingWithCalendarAlerts /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-for-external-system-events" element={<ProtectedRoute><GapNoWebhooksForExternalSystemEvents /></ProtectedRoute>} />
      <Route path="/gap-no-e-signature-workflow-for-contracts" element={<ProtectedRoute><GapNoESignatureWorkflowForContracts /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
