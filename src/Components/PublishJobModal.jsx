import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

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

// Utility: format date as yyyy-mm-dd
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function PublishJobModal({ client, draft, onClose }) {
  const twoDaysLater = new Date();
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  const [form, setForm] = useState({
    title: "",
    preview_description: "",
    detailed_description: "",
    hourly_pay_range: "",
    closing_date: formatDate(twoDaysLater), // ✅ default 2 days from now
  });

  const [loading, setLoading] = useState(false);

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
          "",
        // ✅ keep the pre-filled default closing date
      }));
    } catch (err) {
      console.error("Error parsing draft JSON:", err);
      toast.error("Could not load draft data.");
    }
  }, [draft]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePublish() {
    try {
      setLoading(true);

      const { error } = await supabase.from("jobs").insert([
        {
          title: form.title,
          preview_description: form.preview_description,
          detailed_description: form.detailed_description,
          hourly_pay_range: form.hourly_pay_range,
          closing_date: form.closing_date
            ? new Date(form.closing_date)
            : new Date(twoDaysLater),
          client_id: client.id,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Publish Job</h2>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. AI Systems Builder"
            className="border p-2 rounded text-gray-900 placeholder:text-gray-400"
          />

          <label className="text-sm font-medium text-gray-700">
            Preview Description
          </label>
          <textarea
            name="preview_description"
            value={form.preview_description}
            onChange={handleChange}
            placeholder="Short summary shown on listings"
            className="border p-2 rounded min-h-[60px] text-gray-900 placeholder:text-gray-400"
          />

          <label className="text-sm font-medium text-gray-700">
            Detailed Description
          </label>
          <textarea
            name="detailed_description"
            value={form.detailed_description}
            onChange={handleChange}
            placeholder="Full job description and responsibilities"
            className="border p-2 rounded min-h-[240px] text-gray-900 whitespace-pre-wrap placeholder:text-gray-400"
          />

          <label className="text-sm font-medium text-gray-700">
            Hourly Pay Range
          </label>
          <input
            name="hourly_pay_range"
            value={form.hourly_pay_range}
            onChange={handleChange}
            placeholder="$100–150/hr"
            className="border p-2 rounded text-gray-900 placeholder:text-gray-400"
          />

          <label className="text-sm font-medium text-gray-700">
            Closing Date
          </label>
          <input
            type="date"
            name="closing_date"
            value={form.closing_date}
            onChange={handleChange}
            className="border p-2 rounded text-gray-900"
          />
        </div>

        <div className="flex justify-end mt-5 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md text-sm font-medium text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-md text-sm font-medium ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Publishing..." : "Publish Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
