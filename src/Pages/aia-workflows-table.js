// src/Pages/aia-workflows-table.js
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import AIAWorkflowTableComponent from '../Components/AIAWorkflowTableComponent';

const PAGE_SIZE = 25;

// Pillar filter options
const PILLAR_OPTIONS = ['Marketing', 'Sales', 'Operations'];

export default function AIAWorkflowsTable() {
  const [workflows, setWorkflows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');

  // Pillar filter
  const [selectedPillar, setSelectedPillar] = useState('');

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(q.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  // Fetch data
  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let req = supabase
        .from('aia-workflows')
        .select('*', { count: 'exact' });

      // Search across key columns
      if (query) {
        const like = `%${query}%`;
        req = req.or([
          `workflow_name.ilike.${like}`,
          `executive_summary.ilike.${like}`,
          `primary_objective.ilike.${like}`,
          `business_results.ilike.${like}`,
          `business_use_cases.ilike.${like}`
        ].join(','));
      }

      // Pillar filter
      if (selectedPillar) {
        req = req.eq('pillar', selectedPillar);
      }

      const { data, error, count } = await req
        .order('id', { ascending: true })
        .range(from, to);

      if (error) {
        console.error('Supabase error:', error);
        setWorkflows([]);
        setTotal(0);
      } else {
        setWorkflows(data || []);
        setTotal(typeof count === 'number' ? count : 0);
      }
      setLoading(false);
    })();
  }, [page, query, selectedPillar]);

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));
  const rangeLabel = (page, pageSize, total) => {
    if (!total) return '0';
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}–${to}`;
  };

  return (
    <div className="container">
      <h1>
        The <span className="gradient-text">AI Architechs</span> Canon Library
      </h1>
      <h2>
        40 proven workflows our team implements fastest for the biggest wins.
      </h2>
      <p className="subtext">Search and filter by pillar.</p>

      {/* Search input */}
      <div className="search-row" style={{ gap: 8 }}>
        <input
          className="search"
          type="text"
          placeholder="Search workflows…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button className="btn clear" onClick={() => setQ('')}>
            Clear
          </button>
        )}
      </div>

      {/* Pillar filter */}
      <div className="filters-row" style={{ display: 'flex', gap: 12, padding: '10px 0' }}>
        {PILLAR_OPTIONS.map((p) => (
          <button
            key={p}
            className={`btn ${selectedPillar === p ? 'active' : ''}`}
            onClick={() => {
              setSelectedPillar(selectedPillar === p ? '' : p);
              setPage(1);
            }}
          >
            {p}
          </button>
        ))}
        {selectedPillar && (
          <button
            className="btn clear"
            onClick={() => { setSelectedPillar(''); setPage(1); }}
          >
            Clear Pillar
          </button>
        )}
      </div>

      {/* Results summary */}
      <div style={{ padding: '0 24px 8px', color: '#cbd5e1' }}>
        {total > 0 ? (
          <>
            Showing <strong>{rangeLabel(page, PAGE_SIZE, total)}</strong> of{' '}
            <strong>{total}</strong>
            {query ? <> results for “<em>{query}</em>”</> : ' total workflows'}
            {selectedPillar ? <> in <strong>{selectedPillar}</strong></> : null}
          </>
        ) : (
          <>No results{query ? <> for “<em>{query}</em>”</> : ''}.</>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 16 }}>Loading…</div>
      ) : (
        <>
        <AIAWorkflowTableComponent workflows={workflows} />          <Pagination page={page} totalPages={totalPages} goTo={goTo} />
        </>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, goTo }) {
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', padding:'16px 0', flexWrap:'wrap' }}>
      <button className="btn" onClick={() => goTo(1)} disabled={page === 1}>⟪ First</button>
      <button className="btn" onClick={() => goTo(page - 1)} disabled={page === 1}>‹ Prev</button>

      {start > 1 && <span>…</span>}
      {pages.map((p) => (
        <button
          key={p}
          className="btn"
          onClick={() => goTo(p)}
          style={{
            opacity: p === page ? 1 : 0.8,
            outline: p === page ? '2px solid rgba(255,255,255,.5)' : 'none'
          }}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span>…</span>}

      <button className="btn" onClick={() => goTo(page + 1)} disabled={page === totalPages}>Next ›</button>
      <button className="btn" onClick={() => goTo(totalPages)} disabled={page === totalPages}>Last ⟫</button>

      <span style={{ marginLeft: 12, color:'#cbd5e1' }}>
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
