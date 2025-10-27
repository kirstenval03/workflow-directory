// src/Pages/WorkflowDirectory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import WorkflowTableComponent from "../Components/WorkflowTableComponent";
import MultiSelectDropdown from "../Components/MultiSelectDropdown";

const PAGE_SIZE = 25;

const FUNCTION_OPTIONS = [
  "Admin",
  "Agriculture",
  "Content Creation",
  "Creativity and Entertainment",
  "Customer/Client Service",
  "Ecommerce",
  "Education",
  "Finance",
  "HR",
  "Health and Wellness",
  "Hospitality and Food Services",
  "IT",
  "Knowledge Management and Internal Communications",
  "Legal",
  "Logistics",
  "Manufacturing",
  "Marketing",
  "Online Service or Education",
  "Operations",
  "Procurement",
  "Product/Service Development",
  "Professional and Business Services",
  "Quality Control",
  "Research",
  "Retail and Ecommerce",
  "SaaS",
  "Sales",
  "Secops",
  "Security",
  "Support",
];

const FUNCTION_ALIAS = {
  "Product/Service Development": [
    "Product Service Development",
    "Product/Service Development",
  ],
};

const INDUSTRY_OPTIONS = [
  "Agriculture",
  "Business and Personal Transportation",
  "Consulting",
  "Creativity and Entertainment",
  "Crop Management",
  "Crop Science",
  "Education",
  "Farming Technology",
  "Finance",
  "Financial Products and Wealth Management",
  "Food Production",
  "Food and Beverage",
  "Health and Wellness",
  "Healthcare",
  "Healthcare and Wellness",
  "Home Services and Trades",
  "Hospitality and Food Services",
  "Human Resources",
  "IT",
  "IT Services",
  "Investment",
  "Legal",
  "Logistics",
  "Manufacturing",
  "Marketing",
  "Media and Publishing",
  "Online Service",
  "Online Service or Education",
  "Other",
  "Procurement",
  "Product/Service Development",
  "Professional and Business Services",
  "Property Management",
  "Real Estate",
  "Research",
  "Retail and Ecommerce",
  "SaaS",
  "Sustainability Consulting",
  "Technology",
  "Travel and Hospitality",
  "Travel and Tourism",
];

export default function WorkflowDirectory() {
  const [workflows, setWorkflows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFunctions, setSelectedFunctions] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let req = supabase.from("workflow_directory").select("*", { count: "exact" });

      if (query) {
        const like = `%${query}%`;
        req = req.or(
          [
            `workflow_name.ilike.${like}`,
            `executive_summary.ilike.${like}`,
            `business_results.ilike.${like}`,
            `business_use_cases.ilike.${like}`,
            `step_by_step.ilike.${like}`,
            `integrations_used.ilike.${like}`,
            `primary_objective.ilike.${like}`,
            `core_ai_capabilities.ilike.${like}`,
            `notification_channels.ilike.${like}`,
          ].join(",")
        );
      }

      if (selectedFunctions.length > 0) {
        const expandedFunctionFilters = selectedFunctions.flatMap((f) =>
          FUNCTION_ALIAS[f] ? FUNCTION_ALIAS[f] : [f]
        );
        req = req.overlaps("business_functions", expandedFunctionFilters);
      }

      if (selectedIndustries.length > 0) {
        req = req.overlaps("industry_relevance", selectedIndustries);
      }

      const { data, error, count } = await req
        .order("id", { ascending: true })
        .range(from, to);

      if (error) {
        console.error("Supabase error:", error);
        setWorkflows([]);
        setTotal(0);
      } else {
        setWorkflows(data || []);
        setTotal(typeof count === "number" ? count : 0);
      }
      setLoading(false);
    })();
  }, [page, query, selectedFunctions, selectedIndustries]);

  const goTo = (p) => setPage(Math.min(Math.max(1, p), totalPages));
  const rangeLabel = (page, pageSize, total) => {
    if (!total) return "0";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}–${to}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-10">
      {/* --- HEADER --- */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2 text-white">
          The <span className="gradient-text">AI Architechs</span> Workflow Directory
        </h1>
        <h2 className="text-slate-300 mb-1">
          2000 AI automations & integrations your business could run today.
        </h2>
        <p className="text-slate-400 text-sm">Search your workflow library.</p>
      </div>

      {/* --- SEARCH --- */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 justify-center">
        <input
          className="w-full sm:w-1/2 px-4 py-2 bg-white/5 text-slate-200 border border-white/10 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
          type="text"
          placeholder="Search (e.g., customer, marketing, Slack)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            className="px-4 py-2 text-sm bg-white/10 text-slate-300 rounded-lg hover:bg-white/20"
            onClick={() => setQ("")}
          >
            Clear
          </button>
        )}
      </div>

      {/* --- FILTERS --- */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <MultiSelectDropdown
          label="Function"
          options={FUNCTION_OPTIONS}
          selected={selectedFunctions}
          onChange={(vals) => {
            setSelectedFunctions(vals);
            setPage(1);
          }}
          placeholder="Select function(s)…"
        />
        <MultiSelectDropdown
          label="Industry"
          options={INDUSTRY_OPTIONS}
          selected={selectedIndustries}
          onChange={(vals) => {
            setSelectedIndustries(vals);
            setPage(1);
          }}
          placeholder="Select industry(ies)…"
        />
        {(selectedFunctions.length || selectedIndustries.length) > 0 && (
          <button
            className="px-3 py-2 text-sm bg-white/10 text-slate-300 rounded-lg hover:bg-white/20"
            onClick={() => {
              setSelectedFunctions([]);
              setSelectedIndustries([]);
              setPage(1);
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* --- RESULTS COUNT --- */}
      <div className="text-slate-300 text-sm mb-3 px-2 sm:px-0 text-center sm:text-left">
        {total > 0 ? (
          <>
            Showing <strong>{rangeLabel(page, PAGE_SIZE, total)}</strong> of{" "}
            <strong>{total}</strong>
            {query ? (
              <>
                {" "}
                results for “<em>{query}</em>”
              </>
            ) : (
              " total workflows"
            )}
            {(selectedFunctions.length || selectedIndustries.length) > 0 && <> with filters</>}
          </>
        ) : (
          <>No results{query ? <> for “<em>{query}</em>”</> : ""}.</>
        )}
      </div>

      {/* --- TABLE OR LOADER --- */}
      {loading ? (
        <div className="text-center text-slate-400 py-8">Loading…</div>
      ) : (
        <>
          <WorkflowTableComponent workflows={workflows} />
          <Pagination page={page} totalPages={totalPages} goTo={goTo} />
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
    <div className="flex justify-center items-center gap-2 mt-8 flex-wrap text-slate-300">
      <button
        className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40"
        onClick={() => goTo(1)}
        disabled={page === 1}
      >
        ⟪ First
      </button>
      <button
        className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40"
        onClick={() => goTo(page - 1)}
        disabled={page === 1}
      >
        ‹ Prev
      </button>

      {start > 1 && <span>…</span>}
      {pages.map((p) => (
        <button
          key={p}
          className={`px-3 py-1 rounded-md ${
            p === page
              ? "bg-blue-500/30 border border-blue-400 text-white"
              : "bg-white/10 hover:bg-white/20"
          }`}
          onClick={() => goTo(p)}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span>…</span>}

      <button
        className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40"
        onClick={() => goTo(page + 1)}
        disabled={page === totalPages}
      >
        Next ›
      </button>
      <button
        className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40"
        onClick={() => goTo(totalPages)}
        disabled={page === totalPages}
      >
        Last ⟫
      </button>

      <span className="ml-4 text-slate-400 text-sm">
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
