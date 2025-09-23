import React, { useEffect, useRef } from 'react';
import CollapsibleText from './CollapsibleText';

function useSyncedHorizontalScroll(topRef, bottomRef, widthRef) {
  useEffect(() => {
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;

    const table = bottom.querySelector('table');
    if (!table) return;

    // Set top bar width to actual table width
    const setWidth = () => {
      const w = table.scrollWidth; // full scrollable width
      if (widthRef.current) widthRef.current.style.width = `${w}px`;
    };
    setWidth();

    // Keep width updated when content or size changes
    const ro = new ResizeObserver(setWidth);
    ro.observe(table);
    window.addEventListener('resize', setWidth);

    // Sync scroll positions both ways
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

export default function WorkflowTableComponent({ workflows = [] }) {
  const txt = (v) => (Array.isArray(v) ? v.join(', ') : (v ?? ''));
  const toArr = (v) =>
    Array.isArray(v)
      ? v
      : typeof v === 'string'
        ? v.split(',').map(s => s.trim()).filter(Boolean)
        : [];

  const FN_COLOR = {
    Admin: 'pill-slate',
    Marketing: 'pill-pink',
    Sales: 'pill-amber',
    'Customer/Client Service': 'pill-cyan',
    IT: 'pill-indigo',
    Finance: 'pill-lime',
    Operations: 'pill-slate',
  };
  const IND_COLOR = {
    SaaS: 'pill-purple',
    'Online Service or Education': 'pill-teal',
    'Professional and Business Services': 'pill-sky',
    Retail: 'pill-emerald',
    Ecommerce: 'pill-rose',
    Other: 'pill-gray',
  };
  const colorFor = (label, map) => map[label] || 'pill-gray';

  // refs for top/bottom scroll containers and the top inner width shim
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const topInnerRef = useRef(null);

  // activate syncing
  useSyncedHorizontalScroll(topRef, bottomRef, topInnerRef);

  return (
    <div className="table-section">
      {/* Top scrollbar (width is set dynamically) */}
      <div className="table-scroll-top" ref={topRef}>
        <div ref={topInnerRef} style={{ height: 1 }} />
      </div>

      {/* Main table + bottom scrollbar */}
      <div className="table-wrap" ref={bottomRef}>
        <table className="table-wide">
          <thead>
            <tr>
              <th>Workflow Name</th>
              <th>Google Drive Link</th>
              <th>Executive Summary</th>
              <th>Business Functions</th>
              <th>Industry Relevance</th>
              <th>Primary Objective</th>
              <th>Business Results</th>
              <th>Use Cases</th>
              <th>Step-by-Step</th>
              <th>Integrations</th>
              <th>Core AI Capabilities</th>
              <th>Notification Channels</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((w) => (
              <tr key={w.id}>
                <td>{w.workflow_name}</td>
                <td>{w.drive_link && <a href={w.drive_link} target="_blank" rel="noreferrer">View</a>}</td>
                <td>{w.executive_summary}</td>
                <td>
                  <div className="pill-row">
                    {toArr(w.business_functions).map((tag, i) => (
                      <span key={i} className={`pill ${colorFor(tag, FN_COLOR)}`}>{tag}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="pill-row">
                    {toArr(w.industry_relevance).map((tag, i) => (
                      <span key={i} className={`pill ${colorFor(tag, IND_COLOR)}`}>{tag}</span>
                    ))}
                  </div>
                </td>
                <td>{w.primary_objective}</td>
                <td>{w.business_results}</td>
                <td>{w.business_use_cases}</td>
                <td><CollapsibleText text={w.step_by_step} previewChars={220} /></td>
                <td>{w.integrations_used}</td>
                <td>{w.core_ai_capabilities}</td>
                <td>{w.notification_channels}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
