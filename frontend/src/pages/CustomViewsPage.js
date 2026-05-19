import React from 'react';
import SpendByCategoryChart from '../components/SpendByCategoryChart';
import SupplierRiskHeatmap from '../components/SupplierRiskHeatmap';
import RfpContractPdfBuilder from '../components/RfpContractPdfBuilder';
import NegotiationPlaybookEditor from '../components/NegotiationPlaybookEditor';

export default function CustomViewsPage({ token }) {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, color: '#202124' }} data-testid="custom-views-title">
          Sourcing Views
        </h1>
        <p style={{ color: '#5f6368', marginTop: 6 }}>
          Spend visualization, supplier risk heatmap, RFP/contract document generator, and editable negotiation playbook.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <SpendByCategoryChart token={token} />
        <SupplierRiskHeatmap token={token} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <RfpContractPdfBuilder token={token} />
        <NegotiationPlaybookEditor token={token} />
      </section>
    </div>
  );
}
