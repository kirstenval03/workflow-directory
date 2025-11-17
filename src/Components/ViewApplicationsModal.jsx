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

  // ===========================================================
  // FETCH APPLICATIONS
  // ===========================================================
  const fetchApplications = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          qualified_architechs (
            ai_profile_copy,
            headshot_url,
            status
          )
        `)
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

  // ===========================================================
  // GENERATE PROFILE
  // ===========================================================
  const confirmGenerateProfile = async () => {
    if (!selectedApp) return;

    try {
      const base =
        process.env.REACT_APP_PUBLIC_SITE_URL || window.location.origin;
      const profileUrl = `${base.replace(/\/$/, "")}/client/profile/${selectedApp.id}`;

      const { error } = await supabase
        .from("applications")
        .update({
          application_stage: "submitted_to_client",
          profile_url: profileUrl,
        })
        .eq("id", selectedApp.id);

      if (error) throw error;

      toast.success("Profile generated and application updated!");
      setConfirmModal(false);
      fetchApplications();
      window.open(profileUrl, "_blank");
    } catch (err) {
      console.error("Error generating profile:", err);
      toast.error("Failed to generate client profile");
    }
  };

  if (!job) return null;

  // ===========================================================
  // PILL RENDERERS
  // ===========================================================
  const renderArchitechStatusPill = (status) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-medium capitalize";

    const colors = {
      active: "bg-green-100 text-green-700",
      submitted: "bg-yellow-100 text-yellow-700",
      placed: "bg-blue-100 text-blue-700",
      inactive: "bg-gray-200 text-gray-700",
      disqualified: "bg-red-100 text-red-700",
    };

    return (
      <span className={`${base} ${colors[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  const renderApplicationStagePill = (stage) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-medium capitalize";

    const labels = {
      applied: "applied",
      submitted_to_client: "submitted",
      not_selected: "not selected",
      hired: "hired",
    };

    const colors = {
      applied: "bg-gray-200 text-gray-700",
      submitted_to_client: "bg-yellow-100 text-yellow-700",
      not_selected: "bg-red-100 text-red-700",
      hired: "bg-green-100 text-green-700",
    };

    return (
      <span className={`${base} ${colors[stage] || "bg-gray-100 text-gray-600"}`}>
        {labels[stage] || stage}
      </span>
    );
  };

  // ===========================================================
  // BUTTON STYLES
  // ===========================================================
  const BTN_BASE =
    "h-9 px-4 inline-flex items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap";

  const BTN_PRIMARY = `${BTN_BASE} text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-105`;

  const BTN_OUTLINE_BLUE = `${BTN_BASE} text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100`;

  const BTN_OUTLINE_GRAY = `${BTN_BASE} text-gray-700 border border-gray-300 hover:border-gray-400 bg-white`;

  const BTN_DISABLED = `${BTN_BASE} text-gray-500 border border-gray-200 bg-gray-100 cursor-not-allowed`;

  // ===========================================================
  // RENDER
  // ===========================================================
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 relative overflow-y-auto max-h-[90vh]">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-md hover:opacity-90"
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
            {applications.length} applicant
            {applications.length !== 1 && "s"}
          </span>
        </div>

        {/* TABLE */}
        {!loading && applications.length > 0 && (
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Architech</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Application Stage</th>
                <th className="px-6 py-3 text-center font-medium text-gray-700">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id} className="bg-white">
                  {/* ARCHITECH INFO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {app.qualified_architechs?.headshot_url ? (
                        <img
                          src={app.qualified_architechs.headshot_url}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <FiUser className="text-gray-500" />
                        </div>
                      )}

                      <div>
                        <div className="font-semibold text-gray-900">
                          {app.first_name} {app.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{app.email}</div>

                        <div className="flex flex-col text-xs text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <FiDollarSign className="text-gray-400" /> Bid:{" "}
                            <span className="font-medium text-blue-600">
                              ${app.bid_rate}/hr
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiClock className="text-gray-400" />
                            Applied on{" "}
                            {new Date(app.applied_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>

                        {app.supporting_links && (
                          <div className="mt-1 text-xs text-gray-600 flex items-start gap-1">
                            <FiLink className="text-gray-400 mt-[2px]" />
                            {app.supporting_links}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

{/* ARCHITECH STATUS (with "submitted for another client" rule) */}
<td className="px-6 py-4">
  {/* Submitted for ANOTHER client */}
  {app.qualified_architechs?.status === "submitted" &&
   app.application_stage === "applied" ? (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
      Submitted for another client
    </span>

  /* Submitted for THIS client */
  ) : app.qualified_architechs?.status === "submitted" &&
    app.application_stage === "submitted_to_client" ? (
<span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white whitespace-nowrap">
  Submitted for this client
</span>


  /* Default behavior */
  ) : (
    renderArchitechStatusPill(app.qualified_architechs?.status)
  )}
</td>

{/* APPLICATION STAGE (always normal pill) */}
<td className="px-6 py-4">
  {renderApplicationStagePill(app.application_stage)}
</td>


                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    {app.profile_url ? (
                      <a
                        href={app.profile_url}
                        target="_blank"
                        rel="noreferrer"
                        className={BTN_OUTLINE_BLUE}
                      >
                        <FiExternalLink className="mr-1" /> Profile
                      </a>
                    ) : app.qualified_architechs?.ai_profile_copy ? (
                      <button
                        onClick={() => handleGenerateProfile(app)}
                        className={BTN_PRIMARY}
                      >
                        Generate
                      </button>
                    ) : (
                      <button disabled className={BTN_DISABLED}>
                        Not Ready
                      </button>
                    )}

<a
  href={`/admin/candidates?open=${app.email}`}
  target="_blank"
  rel="noreferrer"
  className={BTN_OUTLINE_GRAY}
>
  View
</a>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* EMPTY STATE */}
        {!loading && applications.length === 0 && (
          <p className="text-gray-500 text-sm">No applications found.</p>
        )}

        {/* FOOTER */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>

      {/* CONFIRM MODAL */}
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
              as <span className="text-blue-600 font-medium">submitted to client</span>{" "}
              and open their client-facing profile.
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
