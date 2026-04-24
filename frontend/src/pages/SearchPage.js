import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ENTITY_ICONS = {
  rfp_requests: { icon: '\uD83D\uDCCB', color: '#1a73e8' },
  bids: { icon: '\uD83D\uDCCA', color: '#0d904f' },
  suppliers: { icon: '\uD83C\uDFED', color: '#0891b2' },
  contracts: { icon: '\uD83D\uDCDD', color: '#d93025' },
  cost_models: { icon: '\uD83D\uDCB0', color: '#e37400' },
  negotiation_points: { icon: '\uD83E\uDD1D', color: '#7c3aed' },
  spend_analytics: { icon: '\uD83D\uDCC8', color: '#059669' },
  auctions: { icon: '\uD83D\uDD28', color: '#b45309' },
  category_strategies: { icon: '\uD83D\uDDC2\uFE0F', color: '#374151' },
  risk_assessments: { icon: '\u26A0\uFE0F', color: '#dc2626' },
  compliance_records: { icon: '\u2705', color: '#4f46e5' },
};

export default function SearchPage({ token }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const headers = { Authorization: `Bearer ${token}` };
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(`${API}/api/search?q=${encodeURIComponent(q.trim())}`, { headers });
      setResults(res.data);
    } catch (err) { toast.error('Search failed'); }
    setLoading(false);
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    doSearch(query);
  };

  const totalResults = results ? Object.values(results).reduce((sum, group) => sum + (group.items || []).length, 0) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Global Search</h1>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search across all modules... (suppliers, RFPs, contracts, bids, etc.)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, fontSize: 16, padding: '14px 20px' }}
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="loading-spinner"><div className="spinner"></div><span className="loading-text">Searching...</span></div>
      )}

      {!loading && searched && results && (
        <>
          <p style={{ fontSize: 14, color: '#5f6368', marginBottom: 20 }}>
            {totalResults === 0 ? 'No results found' : `Found ${totalResults} result${totalResults !== 1 ? 's' : ''}`}
            {query && <> for "<strong>{query}</strong>"</>}
          </p>

          {totalResults === 0 && (
            <div className="empty-state">
              <h3>No matches found</h3>
              <p>Try different keywords or check your spelling.</p>
            </div>
          )}

          {Object.entries(results).map(([entityType, group]) => {
            const items = group.items || [];
            if (items.length === 0) return null;
            const entityConfig = ENTITY_ICONS[entityType] || { icon: '\uD83D\uDCC4', color: '#666' };
            return (
              <div key={entityType} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#5f6368', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{entityConfig.icon}</span>
                  {group.label || entityType} ({items.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(item => (
                    <div
                      key={`${entityType}-${item.id}`}
                      onClick={() => navigate(group.path || '/')}
                      style={{
                        background: 'white',
                        borderRadius: 12,
                        padding: '16px 20px',
                        border: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = entityConfig.color; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: entityConfig.color + '15', color: entityConfig.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, flexShrink: 0,
                      }}>
                        {entityConfig.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title}</div>
                        {item.snippet && item.snippet !== item.title && (
                          <div style={{ fontSize: 13, color: '#5f6368', marginTop: 2 }}>{item.snippet}</div>
                        )}
                      </div>
                      <span className="status-badge" style={{ background: entityConfig.color + '15', color: entityConfig.color }}>
                        {group.label || entityType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {!searched && !loading && (
        <div className="empty-state">
          <h3>Search the entire platform</h3>
          <p>Find suppliers, RFPs, contracts, bids, and more across all modules.</p>
        </div>
      )}
    </div>
  );
}
