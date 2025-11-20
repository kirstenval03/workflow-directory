import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export default function JobDetailsModal({ job, onClose, onJobUpdated }) {
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [hourlyPayRange, setHourlyPayRange] = useState("");
  const [closingDate, setClosingDate] = useState("");

  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");

  // NEW — hour/min dropdown state
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");

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

      setInterviewDate(job.interview_date ? job.interview_date.split("T")[0] : "");
      setInterviewTime(job.interview_time || "");

      // Pre-fill hour/min if time exists
      if (job.interview_time && job.interview_time.includes(":")) {
        const [h, m] = job.interview_time.split(":");
        setHour(h);
        setMinute(m);
      }
    }
  }, [job]);

  // Combine hour+minute into HH:mm
  useEffect(() => {
    if (hour && minute) {
      setInterviewTime(`${hour}:${minute}`);
    }
  }, [hour, minute]);

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
          interview_date: interviewDate,
          interview_time: interviewTime, // ALWAYS "HH:mm"
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) throw error;

      toast.success("Job updated successfully!");

      await onJobUpdated(job.id);
      setIsEditing(false);
    } catch (err) {
      toast.error("❌ Error updating job");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 text-white flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Edit Job" : "Job Details"}
          </h2>

          <div className="flex items-center gap-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition"
              >
                Edit Job
              </button>
            )}

            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white text-lg transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">

          {/* VIEW MODE */}
          {!isEditing && (
            <div className="space-y-8">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                <Detail label="Client" value={clientName} />
                <Detail label="Title" value={job.title} />
                <Detail label="Preview Description" value={job.preview_description} />
                <Detail label="Hourly Pay Range" value={job.hourly_pay_range} />
                <Detail label="Interview Date" value={job.interview_date?.split("T")[0] || ""} />
                <Detail label="Interview Time (Central Time)" value={job.interview_time || ""} />
                <Detail label="Closing Date" value={job.closing_date?.split("T")[0] || ""} />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
                <Detail label="Detailed Description" value={job.detailed_description} />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* EDIT MODE */}
          {isEditing && (
            <form onSubmit={handleUpdate} className="space-y-8">

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">

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
                <Input label="Preview Description" value={previewDescription} setValue={setPreviewDescription} />
                <Input label="Hourly Pay Range" value={hourlyPayRange} setValue={setHourlyPayRange} />

                {/* Interview Date */}
                <Input label="Interview Date" type="date" value={interviewDate} setValue={setInterviewDate} />

                {/* Interview Time 24-hour selector */}
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
                          <option key={val} value={val}>{val}</option>
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
                          <option key={val} value={val}>{val}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <Input label="Closing Date" type="date" value={closingDate} setValue={setClosingDate} />
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <Textarea
                  label="Detailed Description"
                  value={detailedDescription}
                  setValue={setDetailedDescription}
                />
              </div>

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

/* DETAIL DISPLAY */
function Detail({ label, value }) {
  return (
    <div>
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
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        rows="14"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
      ></textarea>
    </div>
  );
}
