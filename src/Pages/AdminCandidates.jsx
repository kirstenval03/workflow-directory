import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import AdminNavbar from "../Components/AdminNavbar";
import { Dialog } from "@headlessui/react";
import { FiEye } from "react-icons/fi";

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCandidate, setModalCandidate] = useState(null);
  const [candidateApplications, setCandidateApplications] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch all applicants
    const { data: applicantsData, error: applicantsError } = await supabase
      .from("applicants")
      .select("id, first_name, last_name, email");

    // Fetch all applications
    const { data: applicationsData, error: appsError } = await supabase
      .from("applications")
      .select("id, email");

    if (applicantsError || appsError) {
      console.error(applicantsError || appsError);
      setLoading(false);
      return;
    }

    // Count applications per email
    const appCount = applicationsData.reduce((acc, app) => {
      acc[app.email] = (acc[app.email] || 0) + 1;
      return acc;
    }, {});

    // Merge applicant info
    const merged = applicantsData.map((a) => ({
      id: a.id,
      name: `${a.first_name || ""} ${a.last_name || ""}`.trim(),
      email: a.email,
      applicationsCount: appCount[a.email] || 0,
    }));

    setCandidates(merged);
    setApplications(applicationsData);
    setLoading(false);
  };

  const openModal = async (candidate) => {
    setModalCandidate(candidate);
    setModalOpen(true);
    setLoadingModal(true);

    // Fetch that candidate's applications + job titles
    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        applied_at,
        supporting_links,
        jobs (title)
      `)
      .eq("email", candidate.email)
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

  const filteredCandidates = candidates.filter((cand) =>
    `${cand.name} ${cand.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Candidate History
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          All candidates who have applied to positions ({candidates.length} total)
        </p>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading candidates...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-600">Applications</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-800 font-medium">{cand.name || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">{cand.email}</td>
                    <td className="px-6 py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                        {cand.applicationsCount}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => openModal(cand)}
                        className="flex items-center justify-center ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm hover:opacity-90 transition-all"
                      >
                        <FiEye className="mr-1" />
                        View in Modal
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCandidates.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      No candidates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

     {/* =====================
    MODAL
====================== */}
<Dialog open={modalOpen} onClose={closeModal} className="relative z-50">
  <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <Dialog.Panel className="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
        <Dialog.Title className="text-lg font-semibold text-gray-800">
          Applications for <span className="text-blue-600">{modalCandidate?.name}</span>
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
        <p className="text-gray-500 text-sm">No applications found for this candidate.</p>
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
                      {new Date(app.applied_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>{" "}
                    at{" "}
                    {new Date(app.applied_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Job status badge */}
                {app.jobs?.status && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      app.jobs.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {app.jobs.status}
                  </span>
                )}
              </div>

              {/* Notes / Resources */}
              <div className="mt-3">
                <p className="text-xs uppercase font-semibold text-gray-500 mb-1 tracking-wide">
                  Candidate’s notes or attachments:
                </p>
                <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                  {app.supporting_links ? (
                    <p>{app.supporting_links}</p>
                  ) : (
                    <p className="italic text-gray-400">No notes provided.</p>
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

    </div>
  );
}
