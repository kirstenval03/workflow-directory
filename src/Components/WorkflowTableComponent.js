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

  // 🎨 Base color maps for known exact matches
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

  // 🌈 Extended logic for new/compound labels
  const getPillColor = (text) => {
    if (!text) return 'pill-gray';
    const lower = text.toLowerCase();

    if (lower.includes('lead generation')) return 'pill-rose';
    if (lower.includes('lead nurture')) return 'pill-amber';
    if (lower.includes('analytics')) return 'pill-cyan';
    if (lower.includes('content')) return 'pill-purple';
    if (lower.includes('operations')) return 'pill-emerald';
    if (lower.includes('sales')) return 'pill-sky';
    if (lower.includes('automation')) return 'pill-indigo';
    if (lower.includes('marketing')) return 'pill-pink';
    if (lower.includes('ai')) return 'pill-lime';
    return 'pill-gray';
  };

  const colorFor = (label, map) => map[label] || getPillColor(label);

  // refs for top/bottom scroll containers and the top inner width shim
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const topInnerRef = useRef(null);

  // activate syncing
  useSyncedHorizontalScroll(topRef, bottomRef, topInnerRef);

 return (
  <div className="w-full mx-auto px-4 pb-20">
    {/* Top scrollbar */}
    <div
      ref={topRef}
      className="overflow-x-auto h-2 mb-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent rounded-lg"
    >
      <div ref={topInnerRef} className="h-1" />
    </div>

    {/* Table (no vertical scroll — full visible height) */}
    <div
      ref={bottomRef}
      className="overflow-x-auto border border-white/10 rounded-xl bg-white/5 backdrop-blur-md shadow-md scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
    >
      <table className="min-w-full text-left text-[13px] text-slate-200 border-collapse">
        <thead>
          <tr className="bg-white/10 text-slate-300 text-xs uppercase tracking-wider">
            {[
              'Workflow Name',
              'Link',
              'Executive Summary',
              'Business Functions',
              'Industry Relevance',
              'Primary Objective',
              'Business Results',
              'Use Cases',
              'Step-by-Step',
              'Integrations',
              'Core AI Capabilities',
              'Notification Channels'
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-3 font-semibold whitespace-nowrap bg-white/10 backdrop-blur-sm"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/10">
          {workflows.map((w) => (
            <tr
              key={w.id}
              className="hover:bg-white/5 transition-colors border-b border-white/5"
            >
              <td className="px-3 py-3 font-medium text-slate-100 w-[200px]">
                {w.workflow_name}
              </td>
              <td className="px-3 py-3 text-blue-400 hover:underline w-[70px]">
                {w.drive_link && (
                  <a href={w.drive_link} target="_blank" rel="noreferrer">
                    View
                  </a>
                )}
              </td>
              <td className="px-3 py-3 max-w-[260px] text-slate-300">
                <p className="line-clamp-3">{w.executive_summary}</p>
              </td>

              {/* Business Functions */}
              <td className="px-3 py-3 w-[180px]">
                <div className="flex flex-wrap gap-2">
                  {toArr(w.business_functions).map((tag, i) => (
                    <span key={i} className={`pill ${colorFor(tag, FN_COLOR)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </td>

              {/* Industry Relevance */}
              <td className="px-3 py-3 w-[180px]">
                <div className="flex flex-wrap gap-2">
                  {toArr(w.industry_relevance).map((tag, i) => (
                    <span key={i} className={`pill ${colorFor(tag, IND_COLOR)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </td>

              <td className="px-3 py-3 max-w-[220px] text-slate-300">
                {w.primary_objective}
              </td>
              <td className="px-3 py-3 max-w-[220px] text-slate-300">
                {w.business_results}
              </td>
              <td className="px-3 py-3 max-w-[200px] text-slate-300">
                {w.business_use_cases}
              </td>
              <td className="px-3 py-3 max-w-[220px] text-slate-300">
                <CollapsibleText text={w.step_by_step} previewChars={200} />
              </td>
              <td className="px-3 py-3 text-slate-400 max-w-[180px]">
                {w.integrations_used}
              </td>
              <td className="px-3 py-3 text-slate-400 max-w-[180px]">
                {w.core_ai_capabilities}
              </td>
              <td className="px-3 py-3 text-slate-400 max-w-[180px]">
                {w.notification_channels}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

}
