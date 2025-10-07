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
  const [revealPrice, setRevealPrice] = useState(false);

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

  const setupFees = agencyComparisons
    .map((text) => {
      const m = text.match(/\$([\d,]+)\s*setup/i);
      return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
    })
    .filter((n) => n > 0);

  const totalSetup = setupFees.reduce((sum, n) => sum + n, 0);

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

      {/* COST BREAKDOWN */}
     <section className="report-section cost-section">
  <h2 className="section-title">Cost Breakdown</h2>

  <div className="cost-grid">
    {/* Agency Costs */}
    <div className="cost-column">
      <h3 className="cost-column-title">Agency Costs</h3>
      <div className="cost-card glass-card">
        <p>
          <strong>Agency Install Estimate:</strong> {agencyCostTotalStr}
        </p>
        <p>
          <strong>Monthly Maintenance (min):</strong> {monthlyMaintenanceTotalStr}
        </p>
      </div>
    </div>

    {/* With AI Architechs */}
    <div className="cost-column">
      <h3 className="cost-column-title">With AI Architechs</h3>
      <div className="cost-card glass-card reveal-card">
        {!revealPrice ? (
          <div className="blur-overlay">
            <div className="lock-icon">
              <span role="img" aria-label="lock">🔒</span>
            </div>
            <button
              onClick={() => setRevealPrice(true)}
              className="reveal-btn"
            >
              Click to Reveal
            </button>
          </div>
        ) : (
          <div className="reveal-content">
            <p>
              <strong>One-Time Fee:</strong> $5,000
            </p>
            <p className="cta-note">
              With ongoing support at only <strong>$10–15/hr</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
</section>

      {/* NEXT STEPS */}
      <section className="report-section next-steps-section">
        <h2 className="section-title">Next Steps</h2>
        <p className="section-subtitle">
          A quick, guided path to get your in-house AI Architech placed and building inside your business.
        </p>

        <div className="steps-container">
          {[
            {
              number: '01',
              title: 'Complete Your Enrollment',
              description: 'Secure your spot and begin your AI Architect placement.',
            },
            {
              number: '02',
              title: 'Sign Your Agreement',
              description: 'You’ll automatically receive your service agreement right after enrollment.',
            },
            {
              number: '03',
              title: 'Meet Your Recruiting Concierge (Within 24 Hours)',
              description:
                'We’ll schedule a 1:1 onboarding call to clarify your goals and ideal candidate profile.',
            },
            {
              number: '04',
              title: 'AI Implementation Call (Within 3 Days)',
              description:
                'Our team will walk you through your custom AI Workflow Blueprint and launch plan.',
            },
            {
              number: '05',
              title: 'Interview Your Top 3 Candidates (Within 7 Days)',
              description:
                'You’ll meet three hand-selected AI-Architechs vetted for your business needs.',
            },
            {
              number: '06',
              title: 'Choose Your Perfect Fit',
              description:
                'Once selected, your AI-Architech begins implementation immediately inside your business.',
            },
          ].map((step, idx) => (
            <div key={idx} className="step-card glass-card">
              <div className="step-number">
                <span>{step.number}</span>
              </div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
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
