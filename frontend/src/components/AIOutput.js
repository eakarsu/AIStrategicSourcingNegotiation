import React from 'react';

function parseMarkdown(text) {
  if (!text) return '';

  let html = text
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^[\s-:]+$/.test(c))) return '<!--table-sep-->';
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    // Lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li><br\/>?)+)/g, '<ul>$1</ul>');
  html = html.replace(/<br\/><\/ul>/g, '</ul>');
  html = html.replace(/<ul><br\/>/g, '<ul>');

  // Wrap consecutive <tr> in <table>
  html = html.replace(/<!--table-sep--><br\/>/g, '');
  html = html.replace(/((?:<tr>.*?<\/tr><br\/>?)+)/g, '<table>$1</table>');

  // First row of table as header
  html = html.replace(/<table><tr>(.*?)<\/tr>/g, (match, cells) => {
    const headerCells = cells.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
    return `<table><thead><tr>${headerCells}</tr></thead><tbody>`;
  });
  html = html.replace(/<\/table>/g, '</tbody></table>');

  return `<p>${html}</p>`;
}

export default function AIOutput({ result, type, loading }) {
  if (loading) {
    return (
      <div className="ai-loading">
        <div className="pulse-dot">
          <span></span><span></span><span></span>
        </div>
        <span style={{ color: '#4338ca', fontWeight: 500 }}>AI is generating your analysis...</span>
      </div>
    );
  }

  if (!result) return null;

  const typeLabels = {
    rfp_generation: 'RFP Document Generated',
    bid_comparison: 'Bid Comparison Analysis',
    should_cost: 'Should-Cost Analysis',
    negotiation_points: 'Negotiation Strategy',
    contract_draft: 'Contract Draft'
  };

  return (
    <div className="ai-output-container">
      <div className="ai-output-header">
        <span className="ai-badge">AI POWERED</span>
        <h3>{typeLabels[type] || 'AI Analysis'}</h3>
      </div>
      <div
        className="ai-output-content"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(result) }}
      />
    </div>
  );
}
