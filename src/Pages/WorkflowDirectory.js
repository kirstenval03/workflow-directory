// src/Pages/WorkflowDirectory.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import WorkflowTableComponent from '../Components/WorkflowTableComponent';
import MultiSelectDropdown from '../Components/MultiSelectDropdown';

const PAGE_SIZE = 25;

/** ---- FILTER OPTIONS ---- **/
const FUNCTION_OPTIONS = [
  'Admin',
  'Agriculture',
  'Content Creation',
  'Creativity and Entertainment',
  'Customer/Client Service',
  'Ecommerce',
  'Education',
  'Finance',
  'HR',
  'Health and Wellness',
  'Hospitality and Food Services',
  'IT',
  'Knowledge Management and Internal Communications',
  'Legal',
  'Logistics',
  'Manufacturing',
  'Marketing',
  'Online Service or Education',
  'Operations',
  'Procurement',
  // canonical label shown in UI:
  'Product/Service Development',
  'Professional and Business Services',
  'Quality Control',
  'Research',
  'Retail and Ecommerce',
  'SaaS',
  'Sales',
  'Secops',
  'Security',
  'Support',
];

// Map UI label -> DB spellings that should match
const FUNCTION_ALIAS = {
  'Product/Service Development': [
    'Product Service Development',
    'Product/Service Development',
  ],
};

// Industry options (deduped and cased consistently)
const INDUSTRY_OPTIONS = [
  'Agriculture',
  'Business and Personal Transportation',
  'Consulting',
  'Creativity and Entertainment',
  'Crop Management',
  'Crop Science',
  'Education',
  'Farming Technology',
  'Finance',
  'Financial Products and Wealth Management',
  'Food Production',
  'Food and Beverage',
  'Health and Wellness',
  'Healthcare',
  'Healthcare and Wellness',
  'Home Services and Trades',
  'Hospitality and Food Services',
  'Human Resources',
  'IT',
  'IT Services',
  'Investment',
  'Legal',
  'Logistics',
  'Manufacturing',
  'Marketing',
  'Media and Publishing',
  'Online Service',
  'Online Service or Education',
  'Other',
  'Procurement',
  'Product/Service Development',
  'Professional and Business Services',
  'Property Management',
  'Real Estate',
  'Research',
  'Retail and Ecommerce',
  'SaaS',
  'Sustainability Consulting',
  'Technology',
  'Travel and Hospitality',
  'Travel and Tourism',
];

export default function WorkflowDirectory() {
  const [workflows, setWorkflows] = useState([]);
  const [page, setPage] = useState(1);          // 1-based
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState('');               // search text (UI)
  const [query, setQuery] = useState('');       // debounced value used for fetch

  // multi-select filters
  const [selectedFunctions, setSelectedFunctions] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);

  // Debounce: wait 300ms after typing before querying
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);          // reset to first page on new search
      setQuery(q.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // base select with count
      let req = supabase
        .from('workflow_directory')
        .select('*', { count: 'exact' });

      // If searching, apply an OR across several text columns
      if (query) {
        const like = `%${query}%`;
        req = req.or([
          `workflow_name.ilike.${like}`,
          `executive_summary.ilike.${like}`,
          `business_results.ilike.${like}`,
          `business_use_cases.ilike.${like}`,
          `step_by_step.ilike.${like}`,
          `integrations_used.ilike.${like}`,
          `primary_objective.ilike.${like}`,
          `core_ai_capabilities.ilike.${like}`,
          `notification_channels.ilike.${like}`,
        ].join(','));
      }

      // Expand aliased function values before filtering
      if (selectedFunctions.length > 0) {
        const expandedFunctionFilters = selectedFunctions.flatMap(f =>
          FUNCTION_ALIAS[f] ? FUNCTION_ALIAS[f] : [f]
        );
        req = req.overlaps('business_functions', expandedFunctionFilters);
      }

      // Industries: OR within selection, AND with functions
      if (selectedIndustries.length > 0) {
        req = req.overlaps('industry_relevance', selectedIndustries);
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
  }, [page, query, selectedFunctions, selectedIndustries]);

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));
  const rangeLabel = (page, pageSize, total) => {
    if (!total) return '0';
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}–${to}`;
  };

  return (
    <>
      <div className="container">
       <h1>
  The <span className="gradient-text">AI Architechs</span> Workflow Directory
</h1>
<h2>
  2000 AI automations & integrations your business could run today.
</h2>
        <p className="subtext">Search your workflow library.</p>

        {/* Search input */}
        <div className="search-row" style={{ gap: 8 }}>
          <input
            className="search"
            type="text"
            placeholder="Search (e.g., customer, marketing, Slack)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="btn clear" onClick={() => setQ('')}>
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="filters-row" style={{ display:'flex', gap:16, padding:'10px 0 0', flexWrap:'wrap' }}>
          <MultiSelectDropdown
            label="Function"
            options={FUNCTION_OPTIONS}
            selected={selectedFunctions}
            onChange={(vals) => { setSelectedFunctions(vals); setPage(1); }}
            placeholder="Select function(s)…"
          />
          <MultiSelectDropdown
            label="Industry"
            options={INDUSTRY_OPTIONS}
            selected={selectedIndustries}
            onChange={(vals) => { setSelectedIndustries(vals); setPage(1); }}
            placeholder="Select industry(ies)…"
          />
          {(selectedFunctions.length || selectedIndustries.length) ? (
            <button
              className="btn clear"
              onClick={() => { setSelectedFunctions([]); setSelectedIndustries([]); setPage(1); }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="table-section">
        {/* results summary */}
        <div style={{padding: '0 24px 8px', color: '#cbd5e1'}}>
          {total > 0 ? (
            <>
              Showing <strong>{rangeLabel(page, PAGE_SIZE, total)}</strong> of <strong>{total}</strong>
              {query ? <> results for “<em>{query}</em>”</> : ' total workflows'}
              {(selectedFunctions.length || selectedIndustries.length) ? <> with filters</> : null}
            </>
          ) : (
            <>No results{query ? <> for “<em>{query}</em>”</> : ''}.</>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 16 }}>Loading…</div>
        ) : (
          <>
            <WorkflowTableComponent workflows={workflows} />
            <Pagination page={page} totalPages={totalPages} goTo={goTo} />
          </>
        )}
      </div>
    </>
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
