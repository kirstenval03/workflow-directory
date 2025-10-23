import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ReactComponent as WhiteLogo } from "../styles/logo-white.svg";
import replacementBadge from "../styles/replacement_badge.png";

export default function AIReportResults() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealPrice, setRevealPrice] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("ai_reports")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        setReport(data);
        if (data.status !== "generating") {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch report.");
        clearInterval(interval);
        setLoading(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  if (error)
    return <p className="text-center text-red-400 mt-10">{error}</p>;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center text-slate-100">
        <h2 className="text-2xl font-semibold mb-2 animate-pulse">
          ⚡ Generating report...
        </h2>
        <p className="text-slate-400">Please wait a few moments.</p>
      </div>
    );

  if (report.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center text-slate-100">
        <h2 className="text-2xl font-semibold text-red-400">
          ❌ Report Generation Failed
        </h2>
        <p className="text-slate-400 mt-2">
          {report.error_message || "Something went wrong. Please try again."}
        </p>
      </div>
    );
  }

  // =========================
  // NEW JSON SHAPE MAPPING
  // =========================
  const result = report.report_json || {};

  const {
    report_summary,
    pillar_scores, // { pillar: { subpillar: score } }
    opportunities, // array (previously "painpoints")
    implementation_roadmap, // { total_weeks, week_1: {workflow_name,focus,expected_outcome}, ... }
    cost_and_cta, // { cta, our_cost_range, agency_cost_range, monthly_maintenance_range }
    risk_reversal, // { with_ai_architechs:[], without_ai_architechs:[] }
  } = result;

  // ----------------------------
  // Build "efficiency_gaps"-like structure from pillar_scores
  // ----------------------------
  const efficiencyLike =
    pillar_scores
      ? Object.entries(pillar_scores).map(([pillarName, subs]) => ({
          pillar: pillarName,
          subpillars: subs, // { subpillar: score }
        }))
      : [];

  // ----------------------------
  // 🧮 COST CALCULATIONS (parse agency_equivalent_cost)
  // ----------------------------
  const allAgencyCostStrings =
    opportunities?.flatMap((p) =>
      p?.workflow_recommendations?.map(
        (w) => w?.roi_projection?.agency_equivalent_cost || ""
      )
    ) || [];

  // sum all "setup" fees in strings like "$5,000 setup + $1,500-2,500/mo"
  const setupFees = allAgencyCostStrings
    .map((text) => {
      const m = text.match(/\$([\d,]+)\s*setup/i);
      return m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
    })
    .filter((n) => n > 0);
  const totalSetup = setupFees.reduce((sum, n) => sum + n, 0);

  // sum minimum of monthly ranges in strings like "$1,500-2,500/mo"
  const monthlyMins = allAgencyCostStrings
    .map((text) => {
      const m = text.match(/\$\s*([\d,]+)\s*(?:[-–]\s*[\d,]+)?\s*\/mo/i);
      return m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
    })
    .filter((n) => n > 0);
  const totalMonthlyMin = monthlyMins.reduce((sum, n) => sum + n, 0);

  const agencyCostTotalStr = totalSetup
    ? `$${totalSetup.toLocaleString()}`
    : "Data unavailable";
  const monthlyMaintenanceTotalStr = totalMonthlyMin
    ? `$${totalMonthlyMin.toLocaleString()}/month`
    : "Data unavailable";

  // ----------------------------
  // 🧩 SORT OPPORTUNITIES by weakest subpillar score
  // ----------------------------
  // produce lowercase map of all subpillar scores for quick lookup
  const subpillarScores = {};
  efficiencyLike.forEach((pillar) => {
    Object.entries(pillar.subpillars || {}).forEach(([sub, score]) => {
      subpillarScores[sub.trim().toLowerCase()] = score;
    });
  });

  
// remove any opportunities that have no workflow recommendations
const filteredOpportunities = (opportunities || []).filter(
  (opp) => opp.workflow_recommendations && opp.workflow_recommendations.length > 0
);

const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    const aSub =
      a.workflow_recommendations?.[0]?.workflow_subpillar?.toLowerCase().trim() ||
      "";
    const bSub =
      b.workflow_recommendations?.[0]?.workflow_subpillar?.toLowerCase().trim() ||
      "";
    const scoreA =
      subpillarScores[aSub] ??
      (Object.keys(subpillarScores).find((k) => aSub && k.includes(aSub.split(" ")[0]))
        ? subpillarScores[
            Object.keys(subpillarScores).find((k) =>
              aSub ? k.includes(aSub.split(" ")[0]) : false
            )
          ]
        : 999);
    const scoreB =
      subpillarScores[bSub] ??
      (Object.keys(subpillarScores).find((k) => bSub && k.includes(bSub.split(" ")[0]))
        ? subpillarScores[
            Object.keys(subpillarScores).find((k) =>
              bSub ? k.includes(bSub.split(" ")[0]) : false
            )
          ]
        : 999);
    return scoreA - scoreB; // lowest score first (bigger opportunity)
  });

  return (
    <div className="max-w-5xl mx-auto px-5 py-16 text-slate-100 font-[Poppins]">
      {/* HEADER */}
      <header className="relative text-center rounded-2xl overflow-hidden shadow-xl mb-10 w-full max-w-5xl mx-auto h-[180px] md:h-[200px]">
        <img
          src={require("../styles/AI-GRADIENT-02.png")}
          alt="AI Architechs Gradient"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-white leading-none">
          <WhiteLogo className="w-46 md:w-42 mb-0 drop-shadow-md" />
          <h1 className="text-base md:text-lg font-semibold mt-0.5 mb-0">
            AI Opportunity Report
          </h1>
          <h3 className="text-xs md:text-sm font-medium mt-0.5 mb-0">
            Prepared for: {report.client_name}
          </h3>
          {report.company_name && (
            <p className="text-xs md:text-sm text-white/80 mt-0.5">
              Company: {report.company_name}
            </p>
          )}
        </div>
      </header>

      {/* SUMMARY */}
      <section className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 mb-10 shadow-lg">
        <h2 className="text-2xl font-semibold text-brand mb-6">
          High-Level Summary
        </h2>
        <p className="text-slate-300 leading-relaxed">{report_summary}</p>
      </section>

      {/* EFFICIENCY GAPS (built from pillar_scores) */}
      <section className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 mb-10 shadow-lg">
        <h2 className="text-2xl font-semibold text-brand mb-6">
          Biggest Levers — Where AI Can Create the Biggest Impact
        </h2>

{efficiencyLike?.length > 0 ? (
  <div className="space-y-10">
    {efficiencyLike.map((pillarObj, index) => {
      const pillarData = Object.entries(pillarObj.subpillars || {}).map(
        ([sub, score]) => ({
          name: sub.replace(/_/g, " "),
          score,
          color:
            score <= 30
              ? "#ef4444" // 🔴 red (critical)
              : score <= 65
              ? "#facc15" // 🟡 yellow (moderate)
              : "#22c55e", // 🟢 green (healthy)
        })
      );


              return (
                <div key={index}>
                  <h3 className="text-xl font-medium mb-3 text-slate-200">
                    {pillarObj.pillar}
                  </h3>
                  <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
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
                              fill="#ffffff"
                              fontSize={13}
                              textAnchor="end"
                            >
                              {payload.value}
                            </text>
                          )}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#ffffff",
                            fontSize: 13,
                          }}
                          itemStyle={{ color: "#ffffff" }}
                          labelStyle={{ color: "#ffffff" }}
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
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400">No efficiency data found.</p>
        )}
      </section>

      {/* OPPORTUNITIES */}
      <section className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 mb-10 shadow-lg">
        <h2 className="text-2xl font-semibold text-brand mb-6">
          Biggest Opportunities
        </h2>

        {sortedOpportunities?.map((p, i) => {
          const firstWorkflow = p.workflow_recommendations?.[0];
          const subpillar =
            firstWorkflow?.workflow_subpillar?.toLowerCase().trim() || "";

          // score lookup (exact -> fuzzy -> null)
          let score = subpillarScores[subpillar];
          if (score === undefined) {
            const matchKey = Object.keys(subpillarScores).find((key) =>
              subpillar ? key.includes(subpillar.split(" ")[0]) : false
            );
            if (matchKey) score = subpillarScores[matchKey];
          }
          if (score === undefined) score = null;

          const color =
            score === null
              ? "#64748b"
              : score <= 30
              ? "#ef4444"
              : score <= 70
              ? "#facc15"
              : "#22c55e";

          const suffix = (n) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
          };
          const rankLabel =
            i === 0
              ? "Biggest Opportunity"
              : `${i + 1}${suffix(i + 1)} Biggest Opportunity`;

          return (
            <div
              key={i}
              className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 shadow-md hover:shadow-xl transition"
            >
              <h3 className="text-lg font-semibold mb-2 text-white">
                ⚠️ {rankLabel}: {p.opportunity_title}
              </h3>

              {p.original_quote && (
                <blockquote className="italic text-indigo-300 border-l-4 border-[#36d1ff] pl-4 my-3">
                  “{p.original_quote}”
                </blockquote>
              )}

              {score !== null && (
                <div className="my-2">
                  <div className="w-full h-2 bg-white/10 rounded">
                    <div
                      className="h-2 rounded"
                      style={{ width: `${score}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className="text-sm text-right text-white mt-1">
                    <strong>{firstWorkflow?.workflow_subpillar}</strong>:{" "}
                    {score}/100
                  </p>
                </div>
              )}

              {p.workflow_recommendations?.map((w, j) => (
                <div
                  key={j}
                  className="bg-white/5 border-l-4 border-[#36d1ff] rounded-lg p-4 mt-3"
                >
                  <h4 className="text-[#36d1ff] font-semibold">
                    {w.workflow_name}
                  </h4>

                  {(w.workflow_pillar || w.workflow_subpillar) && (
                    <p className="text-slate-400 text-xs mt-0.5">
                      {w.workflow_pillar && (
                        <strong>{w.workflow_pillar}</strong>
                      )}
                      {w.workflow_subpillar && ` — ${w.workflow_subpillar}`}
                    </p>
                  )}

                  <p className="text-slate-300 text-sm mt-1">
                    {w.workflow_description}
                  </p>

                  <ul className="mt-2 text-slate-200 text-sm space-y-1">
                    {w.benefits?.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded ${
                            idx % 2 === 0
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          } text-[12px] leading-none flex-shrink-0`}
                        >
                          {idx % 2 === 0 ? "✓" : "✕"}
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {w.roi_projection && (
                    <div className="mt-3 text-sm text-slate-200 space-y-1">
                      <p>
                        ⏱ <strong>Weekly Savings:</strong>{" "}
                        {w.roi_projection.weekly_savings_estimate}
                      </p>
                      <p>
                        📆 <strong>Annual Projection:</strong>{" "}
                        {w.roi_projection.weekly_savings_estimate
                          ? (() => {
                              const match =
                                w.roi_projection.weekly_savings_estimate.match(
                                  /[\d.]+/
                                );
                              if (!match) return "—";
                              const weeklyHours = parseFloat(match[0]);
                              const annual = weeklyHours * 52;
                              return `${annual} hrs/year`;
                            })()
                          : "—"}
                      </p>
                      <p>
                        ⚙️ <strong>Time to Build:</strong>{" "}
                        {w.roi_projection.timeline_days
                          ? `${w.roi_projection.timeline_days} days`
                          : "—"}
                      </p>
                      <p>
                        💸 <strong>Agency Estimate:</strong>{" "}
                        {w.roi_projection.agency_equivalent_cost || "—"}
                      </p>
                      {w.roi_projection.risk_of_inaction && (
                        <p>
                          ⚠️ <strong>Risk of Inaction:</strong>{" "}
                          {w.roi_projection.risk_of_inaction}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </section>

      {/* IMPLEMENTATION ROADMAP (new structure) */}
      <section className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 mb-10 shadow-lg">
        <h2 className="text-2xl font-semibold text-brand mb-6">
          Implementation Roadmap
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(implementation_roadmap || {}).map(
            ([week, info], i) =>
              week !== "total_weeks" ? (
                <div
                  key={i}
                  className="relative bg-slate-900/70 border border-white/10 rounded-xl p-4 shadow-md hover:shadow-[#36d1ff]/30 transition"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-[#36d1ff] via-[#7b61ff] to-[#ff6b01] rounded-full" />
                  <p className="font-semibold text-slate-100 mt-2 mb-2">
                    Week {i + 1}
                  </p>

                  <ul className="text-slate-300 text-sm space-y-1">
                    <li>
                      <strong>Workflow:</strong> {info?.workflow_name || "—"}
                    </li>
                    <li>
                      <strong>Focus:</strong> {info?.focus || "—"}
                    </li>
                    <li>
                      <strong>Expected Outcome:</strong>{" "}
                      {info?.expected_outcome || "—"}
                    </li>
                  </ul>
                </div>
              ) : null
          )}
        </div>
      </section>

      {/* COST BREAKDOWN */}
      <section className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 mb-10 shadow-lg text-center">
        <h2 className="text-2xl font-semibold text-brand mb-6"></h2>

        <div className="flex flex-col md:flex-row justify-center gap-6">
          {/* Agency Estimate */}
          <div className="flex-1 bg-slate-900/70 border border-white/10 rounded-xl p-6 shadow-md">
            <h3 className="font-semibold text-lg mb-3">Agency Estimate</h3>

            <div className="text-slate-200 mb-4">
              <p className="font-medium text-base">Agency Install Estimate:</p>
              <p className="text-3xl font-bold text-white mt-1">
                {agencyCostTotalStr}
              </p>
            </div>

            <div className="text-slate-300">
              <p className="font-medium text-base">+ Monthly Maintenance:</p>
              <p className="text-l font-semibold text-white mt-1">
                {monthlyMaintenanceTotalStr} (min)
              </p>
            </div>
          </div>

          {/* With AI Architechs */}
          <div className="flex-1 bg-white/10 border border-white/10 rounded-xl p-6 text-white shadow-md flex flex-col justify-center items-center">
            <h3 className="font-semibold text-lg mb-4">With AI Architechs</h3>

            {!revealPrice ? (
              <button
                onClick={() => setRevealPrice(true)}
                className="bg-gradient-to-tr from-[#36d1ff] to-[#7b61ff] hover:from-[#7b61ff] hover:to-[#36d1ff] text-white font-semibold px-6 py-2 rounded-lg transition shadow-md"
              >
                Click to Reveal
              </button>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-base font-medium mb-1">One-Time Fee:</p>
                <p className="text-3xl font-bold bg-green-500/90 text-white px-4 py-1 rounded-lg shadow-sm">
                  $5,000
                </p>
                <p className="text-sm mt-2 text-slate-200">
                  Have a fully trained AI Architech in your business for{" "}
                  <strong>$10+/hour</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 mb-10 shadow-lg text-center">
        <img
          src={replacementBadge}
          alt="Replacement Guarantee Badge"
          className="mx-auto w-56 h-auto mb-4 drop-shadow-lg"
        />

        <h2 className="text-2xl font-semibold text-brand mb-6">
          Backed by Our 90-Day Replacement Guarantee
        </h2>

        <p className="text-slate-300 max-w-2xl mx-auto">
          Replace your Architech for ANY reason in the first 90 days. If someone
          sticks for 90 days, generally they’ll stick for as long as you want
          them on team.
        </p>
      </section>

{/* NEXT STEPS (Two-column grid with subheadline layout) */}
<section className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10 mb-10 shadow-lg">
  <h2 className="text-3xl font-semibold text-white mb-4 text-center tracking-tight">
    Next Steps
  </h2>
  <p className="text-slate-300 text-center max-w-2xl mx-auto mb-10 leading-relaxed">
    A quick, guided path to get your in-house AI Architech placed and building inside your business.
  </p>

  <div className="grid sm:grid-cols-2 gap-6">
    {[
      {
        number: "01",
        title: "Complete Your Enrollment",
        sub: "",
        description: "Secure your spot and begin your AI Architech placement.",
      },
      {
        number: "02",
        title: "Sign Your Agreement",
        sub: "",
        description: "You’ll automatically receive your service agreement right after enrollment.",
      },
      {
        number: "03",
        title: "Meet Your Recruiting Concierge",
        sub: "(Within 24 Hours)",
        description: "We’ll schedule a 1:1 onboarding call to clarify your goals and ideal candidate profile.",
      },
      {
        number: "04",
        title: "AI Implementation Call",
        sub: "(Within 3 Days)",
        description: "Our team will walk you through your custom AI Workflow Blueprint and launch plan.",
      },
      {
        number: "05",
        title: "Interview Top Candidates",
        sub: "(Within 7 Days)",
        description: "You’ll meet three hand-selected AI-Architechs vetted for your business needs.",
      },
    ].map((step, idx) => (
      <div
        key={idx}
        className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition"
      >
        {/* Step number */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#36d1ff] to-[#ff6b01] text-white font-semibold text-lg shadow-md shrink-0">
          {step.number}
        </div>

        {/* Step content */}
        <div>
          <h3 className="font-semibold text-white text-base leading-tight">
            {step.title}
          </h3>
          {step.sub && (
            <p className="text-sm text-[#36d1ff] font-medium mb-1">
              {step.sub}
            </p>
          )}
          <p className="text-slate-400 text-sm leading-relaxed">
            {step.description}
          </p>
        </div>
      </div>
    ))}
  </div>
</section>


{/* RISK REVERSAL (Enhanced layout – "Without" first) */}
<section className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10 shadow-lg">
  <h2 className="text-3xl font-semibold text-white mb-8 text-center tracking-tight">
    Why This Can’t Wait…
  </h2>

  <div className="grid md:grid-cols-2 gap-8">
    {/* Without AI-Architechs */}
    <div className="relative bg-gradient-to-br from-[#ff6b01]/5 to-[#7b61ff]/5 border border-white/10 rounded-2xl p-6 shadow-inner hover:shadow-[#ff6b01]/20 transition">
      <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-3/5 h-[3px] bg-gradient-to-r from-[#ff6b01] via-[#7b61ff] to-[#36d1ff] rounded-full" />
      <h3 className="font-semibold text-white mb-4 text-lg">
        ❌ Without AI Architechs:
      </h3>
      <ul className="list-disc list-inside space-y-2 text-slate-300 leading-relaxed">
        {risk_reversal?.without_ai_architechs?.map((item, i) => (
          <li key={i} className="hover:text-white transition">
            {item}
          </li>
        ))}
      </ul>
    </div>

    {/* With AI-Architechs */}
    <div className="relative bg-gradient-to-br from-[#36d1ff]/10 to-[#7b61ff]/10 border border-white/10 rounded-2xl p-6 shadow-inner hover:shadow-[#36d1ff]/20 transition">
      <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-3/5 h-[3px] bg-gradient-to-r from-[#36d1ff] via-[#7b61ff] to-[#ff6b01] rounded-full" />
      <h3 className="font-semibold text-white mb-4 text-lg">
        ✅ With AI-Architechs you get:
      </h3>
      <ul className="list-disc list-inside space-y-2 text-slate-300 leading-relaxed">
        {risk_reversal?.with_ai_architechs?.map((item, i) => (
          <li key={i} className="hover:text-white transition">
            {item}
          </li>
        ))}
      </ul>
    </div>
  </div>
</section>


    </div>
  );
}
