// src/Components/AIAWorkflowTableComponent.js
import React, { useEffect, useRef } from 'react';
import CollapsibleText from './CollapsibleText';

function useSyncedHorizontalScroll(topRef, bottomRef, widthRef) {
  useEffect(() => {
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;

    const table = bottom.querySelector('table');
    if (!table) return;

    const setWidth = () => {
      const w = table.scrollWidth;
      if (widthRef.current) widthRef.current.style.width = `${w}px`;
    };
    setWidth();

    const ro = new ResizeObserver(setWidth);
    ro.observe(table);
    window.addEventListener('resize', setWidth);

    let syncing = false;
    const onTopScroll = () => {
      if (syncing) return;
      syncing = true;
      bottom.scrollLeft = top.scrollLeft;
      syncing = false;
    };
    const onBottomScroll = () => {
      if (syncing) return;
      syncing = true;
      top.scrollLeft = bottom.scrollLeft;
      syncing = false;
    };

    top.addEventListener('scroll', onTopScroll, { passive: true });
    bottom.addEventListener('scroll', onBottomScroll, { passive: true });

    return () => {
      top.removeEventListener('scroll', onTopScroll);
      bottom.removeEventListener('scroll', onBottomScroll);
      window.removeEventListener('resize', setWidth);
      ro.disconnect();
    };
  }, [topRef, bottomRef, widthRef]);
}

export default function AIAWorkflowTableComponent({ workflows = [] }) {
  const txt = (v) => (Array.isArray(v) ? v.join(', ') : (v ?? ''));
  const toArr = (v) =>
    Array.isArray(v)
      ? v
      : typeof v === 'string'
      ? v.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  // refs for top/bottom scroll sync
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const topInnerRef = useRef(null);

  useSyncedHorizontalScroll(topRef, bottomRef, topInnerRef);

  return (
    <div className="table-section">
      {/* Top scrollbar */}
      <div className="table-scroll-top" ref={topRef}>
        <div ref={topInnerRef} style={{ height: 1 }} />
      </div>

      {/* Main table */}
      <div className="table-wrap" ref={bottomRef}>
        <table className="table-wide">
          <thead>
            <tr>
              <th className="workflow_name">Workflow Name</th>
              <th className="pillar">Pillar</th>
              <th className="subpillar">Subpillar</th>
              <th className="executive_summary">Executive Summary</th>
              <th className="industry">Industry Relevance</th>
              <th className="primary_objective">Primary Objective</th>
              <th className="business_results">Business Results</th>
              <th className="business_use_cases">Business Use Cases</th>
              <th className="step_by_step">Step-by-Step</th>
              <th className="core_ai">Core AI Capabilities</th>
              <th className="llm_components">LLM Agent Components</th>
              <th className="timeline">Timeline</th>
              <th className="weekly_savings">Weekly Savings</th>
              <th className="agency_cost">Agency Equivalent</th>
              <th className="risk">Risk of Inaction</th>
              <th className="n8n">n8n Link</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((w) => (
              <tr key={w.id}>
                <td className="workflow_name">{w.workflow_name}</td>
                <td className="pillar">{w.pillar}</td>
                <td className="subpillar">{w.subpillar}</td>
                <td className="executive_summary">
                  <CollapsibleText text={w.executive_summary} previewChars={220} />
                </td>
                <td className="industry">{txt(w.industry_relevance)}</td>
                <td className="primary_objective">{w.primary_objective}</td>
                <td className="business_results">
                  <CollapsibleText text={w.business_results} previewChars={220} />
                </td>
                <td className="business_use_cases">
                  <CollapsibleText text={w.business_use_cases} previewChars={220} />
                </td>
                <td className="step_by_step">
                  <CollapsibleText text={w.step_by_step} previewChars={220} />
                </td>
                <td className="core_ai">{txt(w.core_ai_capabilities)}</td>
                <td className="llm_components">{txt(w.llm_agent_components)}</td>
                <td className="timeline">{w.timeline_days}</td>
                <td className="weekly_savings">{w.weekly_savings_estimate}</td>
                <td className="agency_cost">{w.agency_equivalent_cost}</td>
                <td className="risk">{w.risk_of_inaction}</td>
                <td className="n8n">
                  {w.n8n_link && (
                    <a href={w.n8n_link} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
