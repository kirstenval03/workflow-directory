import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ReactComponent as WhiteLogo } from '../styles/logo-white.svg';

export default function AIReportResults() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('ai_reports')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setReport(data);
        if (data.status !== 'generating') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch report.');
        clearInterval(interval);
        setLoading(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  if (error) return <p className="error-text">{error}</p>;

  if (loading)
    return (
      <div className="loading-container">
        <h2 className="loading-title">⚡ Generating report...</h2>
        <p className="loading-subtitle">Please wait a few moments.</p>
      </div>
    );

  if (report.status === 'failed') {
    return (
      <div className="failed-container">
        <h2 className="failed-title">❌ Report Generation Failed</h2>
        <p className="failed-message">
          {report.error_message || 'Something went wrong. Please try again.'}
        </p>
      </div>
    );
  }

  const result = report.report_json || {};
  const {
    report_summary,
    efficiency_gaps,
    painpoints,
    implementation_roadmap,
    cost_and_cta,
    risk_reversal,
  } = result;

  // ----------------------------
  // 🧮 COST CALCULATIONS (Totals)
  // ----------------------------
  const agencyComparisons =
    painpoints?.flatMap((p) =>
      p.workflow_recommendations?.map(
        (w) => w.roi_projection?.agency_comparison || ''
      )
    ) || [];

  // Sum of all setup fees like "$5,000 setup + $1,500–2,500/mo"
  const setupFees = agencyComparisons
    .map((text) => {
      const m = text.match(/\$([\d,]+)\s*setup/i);
      return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
    })
    .filter((n) => n > 0);

  const totalSetup = setupFees.reduce((sum, n) => sum + n, 0);

  // Sum of lowest monthly value from each range like "$800-1,500/mo" or "$800–1,500/mo"
  const monthlyMins = agencyComparisons
    .map((text) => {
      const m = text.match(/\$\s*([\d,]+)\s*(?:[-–]\s*[\d,]+)?\s*\/mo/i);
      return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
    })
    .filter((n) => n > 0);

  const totalMonthlyMin = monthlyMins.reduce((sum, n) => sum + n, 0);

  const agencyCostTotalStr = totalSetup
    ? `$${totalSetup.toLocaleString()}`
    : 'Data unavailable';

  const monthlyMaintenanceTotalStr = totalMonthlyMin
    ? `$${totalMonthlyMin.toLocaleString()}/month`
    : 'Data unavailable';

  return (
    <div className="report-container">
      {/* HEADER */}
      <header className="report-header">
        <div className="report-header-gradient">
          <WhiteLogo className="report-logo" />
          <div className="report-header-text">
            <h1 className="report-title">AI Opportunity Report</h1>
            {report.company_name && (
              <h3 className="report-subtitle">Prepared for: {report.company_name}</h3>
            )}
          </div>
        </div>
      </header>

      {/* SUMMARY */}
      <section className="report-section summary-section">
        <h2 className="section-title">Executive Summary</h2>
        <p className="section-paragraph">{report_summary}</p>
      </section>

      {/* EFFICIENCY GAPS */}
      <section className="report-section levers-section">
        <h2 className="section-title">Biggest Levers — Where AI Can Create the Fastest Impact</h2>

        {efficiency_gaps?.length > 0 ? (
          <div className="chart-grouped-container">
            {efficiency_gaps.map((pillarObj, index) => {
              const pillarData = Object.entries(pillarObj.subpillars).map(([sub, score]) => ({
                name: sub.replace('_score', '').replace(/_/g, ' '),
                score,
                color:
                  score <= 30 ? '#ef4444' : score <= 70 ? '#facc15' : '#22c55e',
              }));

              return (
                <div key={index} className="pillar-section">
                  <h3 className="pillar-title">{pillarObj.pillar}</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={Math.min(pillarData.length * 45, 300)}
                  >
                    <BarChart
                      data={pillarData}
                      layout="vertical"
                      margin={{ top: 10, right: 40, left: 160, bottom: 10 }}
                    >
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        interval={0}
                        width={160}
                        tick={({ x, y, payload }) => (
                          <text
                            x={x}
                            y={y + 4}
                            fill="#cbd5e1"
                            fontSize={13}
                            textAnchor="end"
                          >
                            {payload.value}
                          </text>
                        )}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: 13,
                        }}
                      />
                      <Bar dataKey="score" radius={[8, 8, 8, 8]} barSize={18}>
                        {pillarData.map((entry, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={entry.color}
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth={1}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No efficiency data found.</p>
        )}
      </section>

      {/* OPPORTUNITIES */}
      <section className="report-section opportunities-section">
        <h2 className="section-title">Biggest Opportunities</h2>
        {painpoints?.map((p, i) => (
          <div key={i} className="opportunity-card glass-card">
            <h3 className="opportunity-title">
              ⚠️ {`${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Biggest Opportunity:`}{' '}
              {p.opportunity_title}
            </h3>
            {p.original_quote && (
              <blockquote className="opportunity-quote">“{p.original_quote}”</blockquote>
            )}

            {p.workflow_recommendations?.map((w, j) => (
              <div key={j} className="workflow-block">
                <h4 className="workflow-name">{w.workflow_name}</h4>

                {(w.workflow_pillar || w.workflow_subpillar) && (
                  <p className="workflow-pillar-sub">
                    {w.workflow_pillar && <strong>{w.workflow_pillar}</strong>}
                    {w.workflow_subpillar && ` — ${w.workflow_subpillar}`}
                  </p>
                )}

                <p className="workflow-description">{w.workflow_description}</p>

                <ul className="workflow-benefits">
                  {w.benefits?.slice(0, 2).map((b, idx) => (
                    <li key={`pos-${idx}`}>{b}</li>
                  ))}
                  {w.benefits?.slice(2).map((b, idx) => (
                    <li key={`neg-${idx}`}>{b}</li>
                  ))}
                </ul>

                {w.roi_projection && (
                  <div className="roi-section">
                    <p>
                      <strong>⏱ Weekly Savings:</strong> {w.roi_projection.weekly_savings}
                    </p>
                    <p>
                      <strong>📆 Annual Projection:</strong> {w.roi_projection.annual_projection}
                    </p>
                    <p>
                      <strong>⚙️ Implementation Timeline:</strong>{' '}
                      {w.roi_projection.implementation_timeline}
                    </p>
                    <p>
                      <strong>💸 Agency Comparison:</strong>{' '}
                      {w.roi_projection.agency_comparison}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* IMPLEMENTATION ROADMAP */}
      <section className="report-section roadmap-section">
        <h2 className="section-title">Implementation Roadmap</h2>
        <div className="roadmap-list">
          {Object.entries(implementation_roadmap || {}).map(([week, tasks]) =>
            week !== 'total_weeks' ? (
              <div key={week} className="roadmap-week">
                <h4 className="roadmap-week-title">
                  {week.replace('_', ' ').toUpperCase()}
                </h4>
                <ul>
                  {tasks.map((task, tIndex) => (
                    <li key={tIndex}>{task}</li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      </section>

      {/* COST & CTA */}
      <section className="report-section cost-section">
        <h2 className="section-title">Cost Breakdown</h2>
        <div className="cost-details">
          <p>
            <strong>Agency Cost:</strong> {agencyCostTotalStr} upfront
          </p>
          <p>
            <strong>Monthly Maintenance (min):</strong> {monthlyMaintenanceTotalStr}
          </p>
          <p>
            <strong>When you go with AI Architects, you pay a once time fee of:</strong> $5000
          </p>
          <p className="cta-note">
            With on-going support at only <strong>$10–15/hr</strong>.
          </p>
        </div>
      </section>

      {/* RISK REVERSAL */}
      <section className="report-section risk-section">
        <h2 className="section-title">Why This Can’t Wait…</h2>
        <p className="risk-summary">{risk_reversal?.summary}</p>
        <div className="risk-metrics">
          <p>
            ⏱ <strong>{risk_reversal?.hours_lost_per_month}</strong> wasted monthly
          </p>
          <p>
            💸 <strong>{risk_reversal?.money_lost_per_month}</strong> in lost opportunities
          </p>
        </div>
      </section>
    </div>
  );
}
