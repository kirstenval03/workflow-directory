import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  FiClock,
  FiExternalLink,
  FiDollarSign,
  FiUser,
  FiLink,
  FiCopy,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function ViewApplicationsModal({ job, onClose }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);

  // NEW: edit/deselect state
  const [editingSelection, setEditingSelection] = useState(false);
  const [deselectionIds, setDeselectionIds] = useState([]);
  const [showDeselectConfirm, setShowDeselectConfirm] = useState(false);

  // NEW: client info
  const [clientInfo, setClientInfo] = useState(null);

  // === HIRE FEATURE ===
  const [hiredSelection, setHiredSelection] = useState("");
  const [isHiring, setIsHiring] = useState(false);

  // 🔗 MAKE WEBHOOK URL
  const MAKE_WEBHOOK_URL =
    "https://hook.us2.make.com/2zt14fudnri74kc2cj8ytqnhasme7whd";

  useEffect(() => {
    if (job?.id) fetchApplications();
  }, [job]);

  useEffect(() => {
    if (job?.client_id) fetchClientInfo();
  }, [job]);

  const fetchClientInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("client_directory")
        .select("client_name, client_email")
        .eq("id", job.client_id)
        .single();

      if (error) throw error;

      setClientInfo(data);
    } catch (err) {
      console.error("Error fetching client info:", err);
    }
  };

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

  const confirmGenerateProfile = async () => {
    if (!selectedApp) return;

    try {
      const base =
        process.env.REACT_APP_PUBLIC_SITE_URL || window.location.origin;
      const profileUrl = `${base.replace(
        /\/$/,
        ""
      )}/client/profile/${selectedApp.id}`;

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

  const BTN_BASE =
    "h-9 px-4 inline-flex items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap";

  const BTN_PRIMARY = `${BTN_BASE} text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-105`;
  const BTN_OUTLINE_BLUE = `${BTN_BASE} text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100`;
  const BTN_OUTLINE_GRAY = `${BTN_BASE} text-gray-700 border border-gray-300 hover:border-gray-400 bg-white`;
  const BTN_DISABLED = `${BTN_BASE} text-gray-500 border border-gray-200 bg-gray-100 cursor-not-allowed`;

  const selectedForClient = applications.filter(
    (app) =>
      app.qualified_architechs?.status === "submitted" &&
      app.application_stage === "submitted_to_client"
  );

  const handleCopySelected = () => {
    if (selectedForClient.length === 0) return;

    const base =
      process.env.REACT_APP_PUBLIC_SITE_URL || window.location.origin;

    const lines = selectedForClient.map((app) => {
      const first = app.first_name?.trim() || "";
      const lastInitial = app.last_name?.trim()?.[0]?.toUpperCase() || "";
      const shortName = lastInitial ? `${first} ${lastInitial}.` : first;

      const url =
        app.profile_url ||
        `${base.replace(/\/$/, "")}/client/profile/${app.id}`;

      return `${shortName}: ${url}`;
    });

    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Copied selected candidates!");
  };

  const handleSendInterviewInvites = async () => {
    if (selectedForClient.length === 0) {
      toast.error("No selected candidates to send invites.");
      return;
    }

    if (!job.interview_date || !job.interview_time) {
      toast.error("Interview date or time missing in job settings.");
      return;
    }

    const payload = {
      job_id: job.id,
      job_title: job.title,
      interview_date: job.interview_date,
      interview_time: job.interview_time,
      client_name: clientInfo?.client_name || "",
      client_email: clientInfo?.client_email || "",
      candidates: selectedForClient.map((app) => ({
        name: `${app.first_name} ${app.last_name}`,
        email: app.email,
      })),
    };

    try {
      const res = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Webhook request failed");

      toast.success("Interview invites sent!");
    } catch (err) {
      console.error("Webhook error:", err);
      toast.error("Failed to send invites");
    }
  };

  // === HIRE FEATURE: CONFIRM HIRE ===
  const handleConfirmHire = async () => {
    if (!hiredSelection) {
      toast.error("Select a hired candidate first");
      return;
    }

    try {
      setIsHiring(true);

      const selectedApp = selectedForClient.find(
        (app) => app.id === hiredSelection
      );

      if (!selectedApp) return;

      const otherApps = selectedForClient.filter(
        (app) => app.id !== hiredSelection
      );

      // 1) Update hired candidate
      await supabase
        .from("qualified_architechs")
        .update({ status: "placed" })
        .eq("id", selectedApp.architech_id);

      await supabase
        .from("applications")
        .update({ application_stage: "hired" })
        .eq("id", selectedApp.id);

      // 2) Update remaining submitted → active / not_selected
      if (otherApps.length > 0) {
        const otherArchitechIds = otherApps.map((a) => a.architech_id);
        const otherApplicationIds = otherApps.map((a) => a.id);

        await supabase
          .from("qualified_architechs")
          .update({ status: "active" })
          .in("id", otherArchitechIds);

        await supabase
          .from("applications")
          .update({ application_stage: "not_selected" })
          .in("id", otherApplicationIds);
      }

      toast.success("Hire confirmed!");

      setHiredSelection("");
      fetchApplications();
    } catch (err) {
      console.error("Confirm Hire Error:", err);
      toast.error("Could not confirm hire");
    } finally {
      setIsHiring(false);
    }
  };

  const toggleDeselection = (id) => {
    setDeselectionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleEditSelection = () => {
    if (editingSelection) {
      setEditingSelection(false);
      setDeselectionIds([]);
    } else {
      setEditingSelection(true);
    }
  };

  const handleOpenDeselectConfirm = () => {
    if (deselectionIds.length === 0) {
      toast.error("Select at least one candidate to deselect.");
      return;
    }
    setShowDeselectConfirm(true);
  };

  const handleConfirmDeselect = async () => {
    try {
      if (deselectionIds.length === 0) return;

      const { error } = await supabase
        .from("applications")
        .update({ application_stage: "applied" })
        .in("id", deselectionIds);

      if (error) throw error;

      toast.success("Candidate(s) deselected and moved back to applied.");
      setShowDeselectConfirm(false);
      setEditingSelection(false);
      setDeselectionIds([]);
      fetchApplications();
    } catch (err) {
      console.error("Error deselecting candidates:", err);
      toast.error("Failed to deselect candidates");
    }
  };

  return (
    <>
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

          {/* Selected Candidates */}
          {selectedForClient.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-4">

              {/* Header + Buttons */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold text-blue-800">
                  Selected Candidates ({selectedForClient.length})
                </h3>

                <div className="flex items-center gap-2">

                  {/* === HIRE DROPDOWN === */}
<select
  className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 
             focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
             shadow-sm hover:border-gray-400 transition"
  value={hiredSelection}
  onChange={(e) => setHiredSelection(e.target.value)}
>

                    <option value="">Select hired candidate...</option>
                    {selectedForClient.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.first_name} {app.last_name}
                      </option>
                    ))}
                  </select>

                  {/* === CONFIRM HIRE BUTTON === */}
<button
  onClick={handleConfirmHire}
  disabled={!hiredSelection || isHiring}
  className={`
    h-9 px-4 rounded-lg text-sm font-medium flex items-center justify-center
    transition-all
    ${hiredSelection
      ? "bg-green-600 text-white hover:bg-green-700 active:scale-[.98]"
      : "bg-gray-200 text-gray-500 cursor-not-allowed"
    }`}
>
  {isHiring ? "Saving..." : "Confirm Hire"}
</button>


                  <button
                    onClick={handleCopySelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                               bg-blue-600 text-white rounded-md shadow-sm 
                               hover:bg-blue-700 active:scale-[.98] transition-all"
                  >
                    <FiCopy className="text-white text-sm" />
                    Copy
                  </button>

                  <button
                    onClick={handleSendInterviewInvites}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                               bg-green-600 text-white rounded-md shadow-sm 
                               hover:bg-green-700 active:scale-[.98] transition-all"
                  >
                    📩 Send Interview Invites
                  </button>

                  <button
                    onClick={handleToggleEditSelection}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                               bg-white text-blue-700 border border-blue-200 rounded-md 
                               hover:bg-blue-50 active:scale-[.98] transition-all"
                  >
                    {editingSelection ? "Done" : "Edit Selection"}
                  </button>

                  {editingSelection && (
                    <button
                      onClick={handleOpenDeselectConfirm}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                                 bg-red-600 text-white rounded-md shadow-sm 
                                 hover:bg-red-700 active:scale-[.98] transition-all"
                    >
                      Deselect Candidate
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Table */}
              <table className="w-full text-sm border border-blue-200 rounded-lg overflow-hidden">
                <thead className="bg-blue-100 border-b border-blue-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-blue-900">
                      Architech
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-blue-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-blue-900">
                      Application Stage
                    </th>
                    <th className="px-6 py-3 text-center font-medium text-blue-900">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-blue-200">
                  {selectedForClient.map((app) => (
                    <tr key={app.id} className="bg-blue-50/80">

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {editingSelection && (
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                              checked={deselectionIds.includes(app.id)}
                              onChange={() => toggleDeselection(app.id)}
                            />
                          )}

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
                            <div className="text-sm text-gray-600">
                              {app.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white whitespace-nowrap">
                          Submitted for this client
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {renderApplicationStagePill(app.application_stage)}
                      </td>

                      <td className="px-6 py-4 text-center flex justify-center gap-2">
                        <a
                          href={`/admin/candidates?open=${app.email}`}
                          target="_blank"
                          rel="noreferrer"
                          className={BTN_OUTLINE_GRAY}
                        >
                          View
                        </a>

                        {app.profile_url ? (
                          <a
                            href={app.profile_url}
                            target="_blank"
                            rel="noreferrer"
                            className={BTN_OUTLINE_BLUE}
                          >
                            <FiExternalLink className="mr-1" /> Profile
                          </a>
                        ) : (
                          <button disabled className={BTN_DISABLED}>
                            Not Ready
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* FULL TABLE */}
          {!loading && applications.length > 0 && (
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">
                    Architech
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">
                    Application Stage
                  </th>
                  <th className="px-6 py-3 text-center font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="bg-white">
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
                          <div className="text-sm text-gray-600">
                            {app.email}
                          </div>

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
                              {new Date(app.applied_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
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

                    <td className="px-6 py-4">
                      {app.qualified_architechs?.status === "submitted" &&
                      app.application_stage === "applied" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
                          Submitted for another client
                        </span>
                      ) : app.qualified_architechs?.status === "submitted" &&
                        app.application_stage === "submitted_to_client" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white whitespace-nowrap">
                          Submitted for this client
                        </span>
                      ) : (
                        renderArchitechStatusPill(app.qualified_architechs?.status)
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {renderApplicationStagePill(app.application_stage)}
                    </td>

                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      <a
                        href={`/admin/candidates?open=${app.email}`}
                        target="_blank"
                        rel="noreferrer"
                        className={BTN_OUTLINE_GRAY}
                      >
                        View
                      </a>

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
                          Select
                        </button>
                      ) : (
                        <button disabled className={BTN_DISABLED}>
                          Not Ready
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && applications.length === 0 && (
            <p className="text-gray-500 text-sm">No applications found.</p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>

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
              <span className="text-blue-600 font-medium">
                submitted to client
              </span>{" "}
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

      {showDeselectConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Deselect Candidate(s)?
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              This will remove{" "}
              <span className="font-semibold">{deselectionIds.length}</span>{" "}
              candidate
              {deselectionIds.length !== 1 && "s"} from the selected list
              for this client and move them back to{" "}
              <span className="font-medium text-gray-800">
                applied
              </span>{" "}
              stage.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeselectConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeselect}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Yes, Deselect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
