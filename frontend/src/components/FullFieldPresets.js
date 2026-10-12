import React from 'react';

export function fillEveryField(values, variant = 0, choices = {}) {
  const scenarios = ['Supplier review', 'Market disruption', 'Executive decision'];
  return Object.fromEntries(Object.entries(values).map(([key, value]) => {
    // Record references and browser File objects are genuine prerequisites, never examples.
    if (/^(id|.*_id|created_at|updated_at|user_id)$/.test(key) || typeof File !== 'undefined' && value instanceof File || (Array.isArray(value) && value.some((item) => typeof File !== 'undefined' && item instanceof File))) return [key, value];
    if (choices[key]?.length) return [key, choices[key][variant % choices[key].length]];
    if (Array.isArray(value)) return [key, [`${scenarios[variant]}: verify source records`, 'Assign a procurement owner']];
    if (value && typeof value === 'object') return [key, value];
    if (typeof value === 'boolean') return [key, variant !== 1];
    if (/date|deadline|valid_until/.test(key)) return [key, new Date(Date.now() + (variant + 7) * 86400000).toISOString().slice(0, 10)];
    if (/email/.test(key)) return [key, `procurement${variant + 1}@example.com`];
    if (/budget|price|cost|amount/.test(key)) return [key, [25000, 80000, 150000][variant]];
    if (typeof value === 'number') return [key, [30, 60, 90][variant]];
    return [key, `${scenarios[variant]} scenario: review supplier performance, confirm source evidence, identify risks and owners, and flag assumptions before making a sourcing decision.`];
  }));
}

function preserveReferences(values) {
  return Object.fromEntries(Object.entries(values).filter(([key, current]) =>
    /^(id|.*_id|created_at|updated_at|user_id)$/.test(key) ||
    (typeof File !== 'undefined' && (current instanceof File ||
      (Array.isArray(current) && current.some((item) => item instanceof File))))
  ));
}

export default function FullFieldPresets({ value, onChange, choices = {}, presets, disabled = false }) {
  const labels = presets ? presets.map((preset) => preset.label) : ['Supplier review', 'Market disruption', 'Executive decision'];
  return <div className="ai-preset-bar"><div><strong>Fill every field</strong><p>Each example fills required and optional fields. Review and edit before generating.</p></div><div className="ai-actions">{labels.map((label, index) => <button type="button" className="btn btn-secondary" key={label} disabled={disabled} onClick={() => onChange(presets ? { ...value, ...presets[index].values, ...preserveReferences(value) } : fillEveryField(value, index, choices))}>{label}</button>)}</div></div>;
}
