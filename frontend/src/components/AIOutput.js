import React from 'react';
import AIReport from './AIReport';

const typeLabels = {
  rfp_generation: 'RFP Document Generated',
  bid_comparison: 'Bid Comparison Analysis',
  should_cost: 'Should-Cost Analysis',
  negotiation_points: 'Negotiation Strategy',
  contract_draft: 'Contract Draft'
};

export default function AIOutput({ result, type, loading }) {
  return <AIReport response={result} loading={loading} title={typeLabels[type] || 'AI Analysis'} />;
}
