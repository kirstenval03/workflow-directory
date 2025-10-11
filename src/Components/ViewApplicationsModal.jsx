import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FiMail, FiClock, FiLink } from "react-icons/fi";

export default function ViewApplicationsModal({ job, onClose }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (job?.id) {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", job.id)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("Error fetching applications:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 relative overflow-y-auto max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white px-3 py-1 rounded-md hover:opacity-90 transition"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Applications for “{job.title}”
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              job.status === "active"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {job.status}
          </span>
          <span>{applications.length} application{applications.length !== 1 && "s"}</span>
        </div>

        {/* Loading */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="text-gray-500 text-sm">No applications yet.</p>
        ) : (
          <div className="space-y-4">
            {applications.map((app, idx) => (
              <div
                key={app.id}
                className={`rounded-xl border border-gray-200 p-5 transition transform hover:scale-[1.01] hover:shadow-md ${
                  idx % 2 === 0 ? "bg-gray-50/60" : "bg-white"
                }`}
              >
                {/* Name + Email */}
                <div className="mb-2">
                  <p className="text-lg font-semibold text-gray-900">
                    {app.first_name} {app.last_name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiMail className="text-gray-500" />
                    <a
                      href={`mailto:${app.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {app.email}
                    </a>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <FiClock className="text-gray-400" />
                  <span>
                    Applied on{" "}
                    {app.applied_at
                      ? new Date(app.applied_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>

                {/* Supporting Notes */}
                {app.supporting_links && (
                  <div className="mt-2 border-t border-gray-200 pt-3">
                    <p className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-2">
                      <FiLink className="text-gray-500" />
                      Additional Notes or Links Added by Applicant:
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed break-words">
                      {app.supporting_links}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white rounded-lg font-semibold text-sm shadow hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
