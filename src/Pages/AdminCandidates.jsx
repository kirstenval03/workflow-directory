import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import AdminNavbar from "../Components/AdminNavbar";
import { Dialog } from "@headlessui/react";
import { FiEye } from "react-icons/fi";
import ArchitechDetailsModal from "../Components/ArchitechDetailsModal";

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // NEW FILTERS
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterNoProfile, setFilterNoProfile] = useState(false);
  const [filterNoHeadshot, setFilterNoHeadshot] = useState(false);

  // NEW: STATUS COUNTS
  const [statusCounts, setStatusCounts] = useState({});

  // Applications modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCandidate, setModalCandidate] = useState(null);
  const [candidateApplications, setCandidateApplications] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedArchitech, setSelectedArchitech] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // ======================================================
  // FETCH ARCHITECHS + APPLICATIONS
  // ======================================================
  const fetchData = async () => {
    setLoading(true);

    const { data: architechsData, error: archError } = await supabase
      .from("qualified_architechs")
      .select(
        `
        id,
        full_name,
        email,
        current_location,
        availability,
        created_at,
        headshot_url,
        status,
        resume,
        interview_transcript,
        ai_profile_copy,
        slug
      `
      );

    const { data: applicationsData, error: appsError } = await supabase
      .from("applications")
      .select("id, qualified_architech_id, applied_at");

    if (archError || appsError) {
      console.error(archError || appsError);
      setLoading(false);
      return;
    }

    const appStats = applicationsData.reduce((acc, app) => {
      const id = app.qualified_architech_id;
      if (!id) return acc;
      if (!acc[id]) acc[id] = { count: 0, lastApplied: null };
      acc[id].count += 1;

      const appliedDate = new Date(app.applied_at);
      if (!acc[id].lastApplied || appliedDate > acc[id].lastApplied) {
        acc[id].lastApplied = appliedDate;
      }
      return acc;
    }, {});

    const merged = architechsData.map((a) => ({
      id: a.id,
      name: a.full_name,
      email: a.email,
      location: a.current_location,
      availability: a.availability,
      created_at: a.created_at,
      headshot_url: a.headshot_url,
      status: a.status,
      resume: a.resume,
      interview_transcript: a.interview_transcript,
      ai_profile_copy: a.ai_profile_copy,
      slug: a.slug,
      applicationsCount: appStats[a.id]?.count || 0,
      lastApplied: appStats[a.id]?.lastApplied || null,
    }));

    const sorted = merged.sort((a, b) => a.name.localeCompare(b.name));

    setCandidates(sorted);
    setLoading(false);
  };

  // ======================================================
  // AUTO-SCROLL TO ?email=
  // ======================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetEmail = params.get("email");
    if (!targetEmail || candidates.length === 0) return;

    setTimeout(() => {
      const el = document.querySelector(
        `[data-email="${targetEmail.toLowerCase()}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add(
          "ring-2",
          "ring-blue-400",
          "rounded-md",
          "bg-blue-50",
          "transition"
        );
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-blue-400", "bg-blue-50");
        }, 4000);
      }
    }, 600);
  }, [candidates]);

  // ======================================================
  // AUTO-OPEN DETAILS MODAL ?open=email
  // ======================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openEmail = params.get("open");
    if (!openEmail || candidates.length === 0) return;

    const cand = candidates.find(
      (c) => c.email.toLowerCase() === openEmail.toLowerCase()
    );

    if (cand) {
      openDetailsModal(cand);
    }
  }, [candidates]);

  // ======================================================
  // UPDATE STATUS COUNTS ANY TIME CANDIDATES CHANGE
  // ======================================================
  useEffect(() => {
    if (!candidates || candidates.length === 0) {
      setStatusCounts({});
      return;
    }

    const counts = candidates.reduce((acc, c) => {
      const s = c.status || "unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    setStatusCounts(counts);
  }, [candidates]);

  // ======================================================
  // STATUS PILL
  // ======================================================
  const renderStatusPill = (status) => {
    if (!status) return "—";

    const styles = {
      active: "bg-green-100 text-green-800 border border-green-200",
      submitted: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      placed: "bg-blue-100 text-blue-800 border border-blue-200",
      inactive: "bg-gray-200 text-gray-700 border border-gray-300",
      disqualified: "bg-red-100 text-red-800 border border-red-200",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${styles[status]}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  // ======================================================
  // APPLICATIONS MODAL
  // ======================================================
  const openModal = async (candidate) => {
    setModalCandidate(candidate);
    setModalOpen(true);
    setLoadingModal(true);

    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        applied_at,
        supporting_links,
        bid_rate,
        jobs (title, status)
      `)
      .eq("qualified_architech_id", candidate.id)
      .order("applied_at", { ascending: false });

    if (error) console.error(error);
    else setCandidateApplications(data || []);

    setLoadingModal(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCandidateApplications([]);
    setModalCandidate(null);
  };

  // ======================================================
  // DETAILS MODAL
  // ======================================================
  const openDetailsModal = async (candidate) => {
    setDetailsOpen(true);
    setLoadingDetails(true);

    try {
      const { data, error } = await supabase
        .from("qualified_architechs")
        .select(`
        id,
        full_name,
        email,
        created_at,
        headshot_url,
        current_location,
        availability,
        programming_languages,
        automation_platforms,
        database_technologies,
        database_experience,
        resume,
        interview_transcript,
        recruiter_notes,
        github_profile,
        loom_video_link,
        resume_link,
        ai_profile_copy
        `)
        .eq("id", candidate.id)
        .single();

      if (error) throw error;

      setSelectedArchitech(data);
    } catch (error) {
      console.error("Error fetching architech details:", error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ======================================================
  // FILTERING LOGIC
  // ======================================================
  let filteredCandidates = [...candidates];

  filteredCandidates = filteredCandidates.filter((cand) =>
    `${cand.name} ${cand.email}`.toLowerCase().includes(search.toLowerCase())
  );

  if (statusFilter !== "all") {
    filteredCandidates = filteredCandidates.filter(
      (cand) => cand.status === statusFilter
    );
  }

  if (filterNoProfile) {
    filteredCandidates = filteredCandidates.filter(
      (cand) => !cand.ai_profile_copy
    );
  }

  if (filterNoHeadshot) {
    filteredCandidates = filteredCandidates.filter(
      (cand) => !cand.headshot_url
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

const selectedStatusLabel =
  statusFilter === "all"
    ? "All"
    : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);

const selectedCount =
  statusFilter === "all"
    ? candidates.length
    : statusCounts[statusFilter] || 0;

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Qualified AI-Architechs
        </h1>


        {/* 🔍 Search + Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/2 border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          

          <div className="flex flex-wrap items-center gap-3">

            {/* UPDATED STATUS DROPDOWN WITH COUNTS */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">
                All Statuses ({candidates.length})
              </option>
              <option value="active">
                Active ({statusCounts.active || 0})
              </option>
              <option value="submitted">
                Submitted ({statusCounts.submitted || 0})
              </option>
              <option value="placed">
                Placed ({statusCounts.placed || 0})
              </option>
              <option value="inactive">
                Inactive ({statusCounts.inactive || 0})
              </option>
              <option value="disqualified">
                Disqualified ({statusCounts.disqualified || 0})
              </option>
            </select>

            {/* WITHOUT PROFILE */}
            <button
              onClick={() => setFilterNoProfile((prev) => !prev)}
              className={`px-4 py-2 rounded-md text-sm font-medium border shadow-sm transition-all ${
                filterNoProfile
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {filterNoProfile ? "📄 All" : "📄 Without Profile"}
            </button>

            {/* WITHOUT HEADSHOT */}
            <button
              onClick={() => setFilterNoHeadshot((prev) => !prev)}
              className={`px-4 py-2 rounded-md text-sm font-medium border shadow-sm transition-all ${
                filterNoHeadshot
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {filterNoHeadshot ? "👤 All" : "👤 Without Headshot"}
            </button>

          </div>
        </div>

<div className="mb-6">
  <div
    className="inline-flex items-center justify-center bg-white border border-gray-200 shadow-sm px-4 rounded-lg"
    style={{ height: "32px" }}
  >
    <p className="text-sm font-medium text-gray-700 leading-tight m-0">
      {selectedStatusLabel} AI-Architechs ={" "}
      <span className="font-semibold text-blue-600">{selectedCount}</span>
    </p>
  </div>
</div>



        {/* TABLE */}
        {loading ? (
          <p>Loading candidates...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Architech</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Applications</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Profile Generated</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-600">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.map((cand) => (
                  <tr
                    key={cand.id}
                    data-email={cand.email.toLowerCase()}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* AVATAR */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {cand.headshot_url ? (
                          <img
                            src={cand.headshot_url}
                            alt={cand.name}
                            onError={(e) =>
                              (e.target.src = "/placeholder-avatar.png")
                            }
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                            {cand.name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}

                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">
                            {cand.name || "—"}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {cand.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-3">
                      {renderStatusPill(cand.status)}
                    </td>

                    {/* APPLICATION COUNT */}
                    <td className="px-6 py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                        {cand.applicationsCount}
                      </span>
                    </td>

                    {/* PROFILE GENERATED */}
                    <td className="px-6 py-3 text-gray-700">
                      {cand.ai_profile_copy ? (
                        <a
                          href={`/admin/profile/${cand.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-medium underline hover:text-blue-800"
                        >
                          View Profile
                        </a>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <span>{cand.resume ? "✔️" : "❌"}</span>
                            <span>Resume</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{cand.interview_transcript ? "✔️" : "❌"}</span>
                            <span>Interview Transcript</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{cand.availability ? "✔️" : "❌"}</span>
                            <span>Availability</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-3 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => openModal(cand)}
                        className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm hover:opacity-90 transition-all"
                      >
                        <FiEye className="mr-1" />
                        View Applications
                      </button>

                      <button
                        onClick={() => openDetailsModal(cand)}
                        className="flex items-center justify-center bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-all"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredCandidates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      No candidates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPLICATIONS MODAL */}
      <Dialog open={modalOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
              <Dialog.Title className="text-lg font-semibold text-gray-800">
                Applications for{" "}
                <span className="text-blue-600">{modalCandidate?.name}</span>
              </Dialog.Title>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {loadingModal ? (
              <p>Loading applications...</p>
            ) : candidateApplications.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No applications found for this candidate.
              </p>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {candidateApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-base">
                          {app.jobs?.title || "Unknown Job"}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Applied on{" "}
                          <span className="font-medium text-gray-700">
                            {formatDate(app.applied_at)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs uppercase font-semibold text-gray-500 mb-1 tracking-wide">
                        Candidate’s notes or attachments:
                      </p>
                      <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                        {app.supporting_links ? (
                          <p>{app.supporting_links}</p>
                        ) : (
                          <p className="italic text-gray-400">
                            No notes provided.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-right">
              <button
                onClick={closeModal}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-1.5 rounded-lg font-medium shadow-sm hover:opacity-90 transition-all"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* DETAILS MODAL */}
      <ArchitechDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        architech={selectedArchitech}
      />
    </div>
  );
}
