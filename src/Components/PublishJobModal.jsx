import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

/* ===================== Helpers ===================== */

function buildFullDescription(data) {
  if (!data || typeof data !== "object") return "";
  const parts = [];

  if (data.business_summary) parts.push(`${data.business_summary}\n`);

  if (Array.isArray(data.ai_initiatives) && data.ai_initiatives.length > 0) {
    parts.push("=== AI Initiatives ===");
    data.ai_initiatives.forEach((i, idx) => {
      parts.push(
        `\n${idx + 1}. ${i.name || "Unnamed Initiative"}\n` +
          (i.goal ? `Goal: ${i.goal}\n` : "") +
          (i.description ? `${i.description}\n` : "")
      );
    });
  }

  if (data.time_requirement)
    parts.push(`\nTime Requirement: ${data.time_requirement}`);

  if (data.technical_requirements) {
    const tr = data.technical_requirements;
    parts.push("\n=== Technical Requirements ===");
    if (tr.notes) parts.push(`Notes: ${tr.notes}`);
    if (tr.core_tools?.length)
      parts.push(`Core Tools: ${tr.core_tools.join(", ")}`);
    if (tr.automations_or_systems?.length)
      parts.push(
        `Automations & Systems: ${tr.automations_or_systems.join(", ")}`
      );
  }

  if (data.team_fit_and_working_style?.length) {
    parts.push("\n=== Team Fit & Working Style ===");
    data.team_fit_and_working_style.forEach((t) => parts.push(`- ${t}`));
  }

  return parts.join("\n\n");
}

// Utility: format date as yyyy-mm-dd for <input type="date">
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ===================== Component ===================== */

export default function PublishJobModal({ client, draft, onClose }) {
  const twoDaysLater = new Date();
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  const [form, setForm] = useState({
    title: "",
    preview_description: "",
    detailed_description: "",
    hourly_pay_range: "",
    interview_date: "",
    interview_time: "",
    closing_date: formatDate(twoDaysLater),
  });

  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");

  const [loading, setLoading] = useState(false);

  // Prefill from draft JSON
  useEffect(() => {
    if (!draft) return;

    try {
      const parsed = typeof draft === "string" ? JSON.parse(draft) : draft;
      const details = buildFullDescription(parsed?.detailed_description);

      setForm((prev) => ({
        ...prev,
        title: parsed?.job_title || "",
        preview_description: parsed?.preview_description || "",
        detailed_description: details || "",
        hourly_pay_range:
          parsed?.high_level_details?.budget ||
          parsed?.detailed_description?.budget ||
          prev.hourly_pay_range,
      }));
    } catch (err) {
      console.error("Error parsing draft JSON:", err);
      toast.error("Could not load draft data.");
    }
  }, [draft]);

  // Combine hour + minute into HH:mm
  useEffect(() => {
    if (hour && minute) {
      setForm((prev) => ({
        ...prev,
        interview_time: `${hour}:${minute}`,
      }));
    }
  }, [hour, minute]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePublish() {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.preview_description.trim()) {
      toast.error("Preview description is required.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("jobs").insert([
        {
          title: form.title,
          preview_description: form.preview_description,
          detailed_description: form.detailed_description,
          hourly_pay_range: form.hourly_pay_range,
          interview_date: form.interview_date || null,
          interview_time: form.interview_time || null, // HH:mm
          closing_date: form.closing_date || null,
          client_id: client.id,
          status: "open",
          posted_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      await supabase
        .from("client_directory")
        .update({ job_draft_status: "published" })
        .eq("id", client.id);

      toast.success("✅ Job published successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish job.");
    } finally {
      setLoading(false);
    }
  }

  /* ===================== UI ===================== */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Job Draft Preview
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-lg shadow-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-5rem)]">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client
            </label>
            <input
              type="text"
              value={client?.client_name || client?.name || ""}
              disabled
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-700"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. AI Workflow Strategist"
            />
          </div>

          {/* Preview Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Preview Description
            </label>
            <textarea
              name="preview_description"
              value={form.preview_description}
              onChange={handleChange}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="Short summary shown on listings"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Detailed Description
            </label>
            <textarea
              name="detailed_description"
              value={form.detailed_description}
              onChange={handleChange}
              rows={10}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 whitespace-pre-wrap focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hourly Pay Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hourly Pay Range
            </label>
            <input
              name="hourly_pay_range"
              value={form.hourly_pay_range}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              placeholder="$100–150/hr"
            />
          </div>

          {/* Interview Date + Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Interview Date
              </label>
              <input
                type="date"
                name="interview_date"
                value={form.interview_date}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 24-Hour Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Interview Time (Central Time)
              </label>

              <div className="flex gap-3 mt-1">
                {/* Hours */}
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">HH</option>
                  {Array.from({ length: 24 }).map((_, i) => {
                    const val = String(i).padStart(2, "0");
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>

                {/* Minutes */}
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">MM</option>
                  {Array.from({ length: 60 }).map((_, i) => {
                    const val = String(i).padStart(2, "0");
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Closing Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Closing Date
            </label>
            <input
              type="date"
              name="closing_date"
              value={form.closing_date}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              onClick={handlePublish}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white transition ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Publishing..." : "Publish Job"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
