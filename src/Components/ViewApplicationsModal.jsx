import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  FiClock,
  FiExternalLink,
  FiDollarSign,
  FiUser,
  FiLink,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function ViewApplicationsModal({ job, onClose }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    if (job?.id) fetchApplications();
  }, [job]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("applications")
        .select("*, qualified_architechs(ai_profile_copy, headshot_url)")
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

  const handleGenerateProfile = (app) => {
    setSelectedApp(app);
    setConfirmModal(true);
  };

  const confirmGenerateProfile = async () => {
    if (!selectedApp) return;
    try {
      const base =
        process.env.REACT_APP_PUBLIC_SITE_URL || window.location.origin;
      const profileUrl = `${base.replace(/\/$/, "")}/client/profile/${selectedApp.id}`;

      const { error } = await supabase
        .from("applications")
        .update({ stage: "Top 5 selected", profile_url: profileUrl })
        .eq("id", selectedApp.id);

      if (error) throw error;

      toast.success("Profile generated and stage updated!");
      setConfirmModal(false);
      fetchApplications();
      window.open(profileUrl, "_blank");
    } catch (err) {
      console.error("Error generating profile:", err);
      toast.error("Failed to generate client profile");
    }
  };

  if (!job) return null;

  // Reusable button classnames
  const BTN_BASE =
    "h-9 min-w-[156px] px-4 inline-flex items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap leading-none align-middle";

  const BTN_PRIMARY = `${BTN_BASE} text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-105 focus:outline-none focus:ring-0 shadow-none transform-none transition-colors`;

  const BTN_OUTLINE_BLUE = `${BTN_BASE} text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition`;

  const BTN_OUTLINE_GRAY = `${BTN_BASE} text-gray-700 border border-gray-300 hover:border-gray-400 bg-white transition`;

  const BTN_DISABLED = `${BTN_BASE} text-gray-500 border border-gray-200 bg-gray-100 cursor-not-allowed`;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative overflow-y-auto max-h-[90vh]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-md hover:opacity-90 transition"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Applications for “{job.title}”
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              job.status === "active"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {job.status}
          </span>
          <span>
            {applications.length} application{applications.length !== 1 && "s"}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="text-gray-500 text-sm">No applications yet.</p>
        ) : (
          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {applications.map((app, idx) => (
              <div
                key={app.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 ${
                  idx % 2 === 0 ? "bg-gray-50/50" : "bg-white"
                }`}
              >
                {/* LEFT */}
<div className="flex items-center gap-3 w-full sm:w-2/3">
  {/* Avatar */}
  {app.qualified_architechs?.headshot_url ? (
    <img
      src={app.qualified_architechs.headshot_url}
      alt={`${app.first_name} ${app.last_name}`}
      className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-base flex-shrink-0">
      <FiUser />
    </div>
  )}

  {/* Name + Email */}
  <div className="flex flex-col">
    <span className="font-semibold text-gray-900 leading-tight">
      {app.first_name} {app.last_name}
    </span>
    <span className="text-gray-600 text-sm leading-tight">
      {app.email}
    </span>

    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <FiDollarSign className="text-gray-400" />
        <span>
          Bid Rate:{" "}
          <span className="font-medium text-blue-600">
            ${app.bid_rate || "N/A"}/hr
          </span>
        </span>
      </span>
      <span className="flex items-center gap-1">
        <FiClock className="text-gray-400" />
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

    {app.supporting_links && (
      <div className="mt-1 text-xs text-gray-600 flex items-start gap-1">
        <FiLink className="text-gray-400 mt-[2px]" />
        <span className="leading-snug break-words">
          {app.supporting_links}
        </span>
      </div>
    )}
  </div>
</div>


                {/* RIGHT (Buttons) */}
                <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                  {app.profile_url ? (
                    <a
                      href={app.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className={BTN_OUTLINE_BLUE}
                    >
                      <FiExternalLink className="w-4 h-4 mr-1" />
                      View Profile
                    </a>
                  ) : app.qualified_architechs?.ai_profile_copy ? (
                    <button
                      onClick={() => handleGenerateProfile(app)}
                      className={BTN_PRIMARY}
                    >
                      Generate Profile
                    </button>
                  ) : (
                    <button disabled className={BTN_DISABLED}>
                      Profile Not Ready
                    </button>
                  )}

                  <a
                    href={`/admin/candidates?email=${encodeURIComponent(
                      app.email
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className={BTN_OUTLINE_GRAY}
                  >
                    View Architech
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold text-sm shadow hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Generate Client Profile?
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              This will mark{" "}
              <strong>
                {selectedApp?.first_name} {selectedApp?.last_name}
              </strong>{" "}
              as{" "}
              <span className="text-blue-600 font-medium">Top 5 selected</span>{" "}
              and open their client-facing profile in a new tab.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmGenerateProfile}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
