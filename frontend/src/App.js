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
import Navbar from './components/Navbar';

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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
