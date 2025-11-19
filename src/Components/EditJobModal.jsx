import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

// MAIN COMPONENT
export default function JobDetailsModal({ job, onClose, onJobUpdated }) {
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [hourlyPayRange, setHourlyPayRange] = useState("");
  const [closingDate, setClosingDate] = useState("");

  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);

  // Prefill
  useEffect(() => {
    if (job) {
      setTitle(job.title || "");
      setPreviewDescription(job.preview_description || "");
      setDetailedDescription(job.detailed_description || "");
      setHourlyPayRange(job.hourly_pay_range || "");
      setClosingDate(job.closing_date ? job.closing_date.split("T")[0] : "");
    }
  }, [job]);

  // Fetch client name
  useEffect(() => {
    async function fetchClient() {
      if (!job?.client_id) return;

      const { data } = await supabase
        .from("client_directory")
        .select("client_name")
        .eq("id", job.client_id)
        .single();

      if (data) setClientName(data.client_name);
    }

    fetchClient();
  }, [job]);

  // UPDATE JOB
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          title,
          preview_description: previewDescription,
          detailed_description: detailedDescription,
          hourly_pay_range: hourlyPayRange,
          closing_date: closingDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) throw error;

      toast.success("Job updated successfully!");
      await onJobUpdated();

      setIsEditing(false);
    } catch (err) {
      toast.error("❌ Error updating job");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Edit Job" : "Job Details"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">

          {/* VIEW MODE */}
{/* VIEW MODE */}
{!isEditing && (
  <div className="space-y-8">

    {/* CARD */}
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
      <Detail label="Client" value={clientName} />
      <Detail label="Title" value={job.title} />
      <Detail label="Preview Description" value={job.preview_description} />
      <Detail label="Hourly Pay Range" value={job.hourly_pay_range} />
      <Detail label="Closing Date" value={job.closing_date?.split("T")[0] || ""} />
    </div>

    {/* DESCRIPTION CARD */}
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
      <Detail
        label="Detailed Description"
        value={job.detailed_description}
      />
    </div>

    {/* ACTIONS */}
    <div className="flex justify-end space-x-3">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition"
      >
        Close
      </button>
      <button
        onClick={() => setIsEditing(true)}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Edit Job
      </button>
    </div>
  </div>
)}


          {/* EDIT MODE */}
{/* EDIT MODE */}
{isEditing && (
  <form onSubmit={handleUpdate} className="space-y-8">

    {/* CARD */}
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">

      {/* LOCKED CLIENT */}
      <div>
        <label className="block text-sm font-medium text-gray-600">Client</label>
        <input
          type="text"
          disabled
          value={clientName}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-500"
        />
      </div>

      <Input label="Title" value={title} setValue={setTitle} />
      <Input
        label="Preview Description"
        value={previewDescription}
        setValue={setPreviewDescription}
      />
      <Input
        label="Hourly Pay Range"
        value={hourlyPayRange}
        setValue={setHourlyPayRange}
      />
      <Input
        label="Closing Date"
        type="date"
        value={closingDate}
        setValue={setClosingDate}
      />
    </div>

    {/* DESCRIPTION CARD */}
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <Textarea
        label="Detailed Description"
        value={detailedDescription}
        setValue={setDetailedDescription}
      />
    </div>

    {/* ACTIONS */}
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  </form>
)}

        </div>
      </div>
    </div>
  );
}

/* REUSABLE DETAIL DISPLAY */
function Detail({ label, value, full }) {
  return (
    <div className={`${full ? "col-span-2" : ""}`}>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-gray-900 whitespace-pre-line leading-relaxed">{value}</p>
    </div>
  );
}

/* INPUT */
function Input({ label, value, setValue, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
<input
  type={type}
  required
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
/>

    </div>
  );
}

/* TEXTAREA */
function Textarea({ label, value, setValue }) {
  return (
    <div className="col-span-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
  <textarea
  rows="14"
  required
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 
             placeholder-gray-400 focus:ring-2 focus:ring-blue-500 
             resize-none leading-relaxed"
></textarea>

    </div>
  );
}
