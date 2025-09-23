import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function MultiSelectDropdown({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select…',
  searchable = true,
  style = {},
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef(null);

  // close on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // filter options
  const filtered = useMemo(() => {
    const norm = (s) => (s || '').toLowerCase();
    const qq = norm(q);
    return qq ? options.filter(o => norm(o).includes(qq)) : options;
  }, [options, q]);

  const toggle = (val) => {
    if (!onChange) return;
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  const selectAllFiltered = () => {
    const add = filtered.filter(o => !selected.includes(o));
    onChange([...selected, ...add]);
  };

  const clearAll = () => onChange([]);

  const pillText = selected.length ? `${selected.length} selected` : placeholder;

  return (
    <div ref={rootRef} style={{ position: 'relative', minWidth: 260, ...style }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="btn"
        style={{
          width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)'
        }}
      >
        <span style={{ opacity: 0.95 }}>{pillText}</span>
        <span style={{ opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', zIndex: 50, marginTop: 6, width: '100%',
            background: 'rgba(17,24,39,0.97)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.35)', maxHeight: 360, overflow: 'auto'
          }}
        >
          {searchable && (
            <div style={{ padding: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to filter…"
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'white'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button className="btn" onClick={selectAllFiltered}>Select filtered</button>
            <button className="btn" onClick={clearAll}>Clear all</button>
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 6 }}>
            {filtered.map(opt => (
              <li key={opt}>
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    cursor: 'pointer', borderRadius: 6
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggle(opt)}
                  />
                  <span>{opt}</span>
                </label>
              </li>
            ))}
            {filtered.length === 0 && (
              <li style={{ padding: '8px 10px', opacity: 0.7 }}>No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
