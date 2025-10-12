import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import AdminNavbar from "../Components/AdminNavbar";
import { FiEye, FiMail, FiUser } from "react-icons/fi";
import { Dialog } from "@headlessui/react";

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [groupByJob, setGroupByJob] = useState(true); // default grouped view
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalJob, setModalJob] = useState(null);
  const [modalApps, setModalApps] = useState([]);

  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        first_name,
        last_name,
        email,
        supporting_links,
        applied_at,
        status,
        job_id,
        jobs (id, title, status)
      `)
      .order("applied_at", { ascending: false });

    if (error) console.error(error);
    else setApplications(data);
    setLoading(false);
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("id, title, status")
      .order("title");

    if (error) console.error(error);
    else setJobs(data);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const filteredJobs = showActiveOnly
    ? jobs.filter((job) => job.status === "active")
    : jobs;

  const filteredApplications = applications.filter((app) => {
    const isJobActive = app.jobs?.status === "active" || !showActiveOnly;
    const matchesJob =
      selectedJob === "all" || app.job_id === selectedJob;
    return isJobActive && matchesJob;
  });

  // Group by job title
  const groupedApplications = filteredApplications.reduce((acc, app) => {
    const title = app.jobs?.title || "Unknown Job";
    if (!acc[title]) acc[title] = [];
    acc[title].push(app);
    return acc;
  }, {});

  const openModal = (jobTitle, apps) => {
    setModalJob(jobTitle);
    setModalApps(apps);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Applications
          </h1>

          <div className="flex items-center space-x-4">
            {/* Filter by job */}
            <div className="flex items-center space-x-2">
              <label className="text-gray-600 text-sm">Filter by job:</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">All Jobs</option>
                {filteredJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Active only */}
            <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Active only</span>
            </label>

            {/* View toggle */}
            <button
              onClick={() => setGroupByJob(!groupByJob)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-md shadow-md hover:opacity-90 transition-all"
            >
              {groupByJob ? "List View" : "Group by Job"}
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading applications...</p>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              {filteredApplications.length} total application
              {filteredApplications.length !== 1 ? "s" : ""}
            </p>

            {/* Grouped View */}
            {groupByJob ? (
              Object.entries(groupedApplications).map(([jobTitle, apps]) => (
                <div key={jobTitle} className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <span>{jobTitle}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        {apps.length} application{apps.length > 1 ? "s" : ""}
                      </span>
                    </h2>

                    <button
                      onClick={() => openModal(jobTitle, apps)}
                      className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-md hover:opacity-90 transition-all"
                    >
                      <FiEye className="mr-2" />
                      View in Modal
                    </button>
                  </div>

                  <div className="space-y-3">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                      >
                        <h3 className="text-base font-semibold text-gray-800">
                          {app.first_name} {app.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{app.email}</p>
                        {app.supporting_links && (
                          <p className="mt-2 text-sm text-gray-700">
                            {app.supporting_links}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimeAgo(app.applied_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                  >
                    <h3 className="text-lg font-semibold text-gray-800">
                      {app.first_name} {app.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{app.email}</p>
                    <p className="mt-2 text-sm text-gray-700">
                      Applied for:{" "}
                      <span className="font-medium">
                        {app.jobs?.title || "Unknown Position"}
                      </span>
                    </p>
                    {app.supporting_links && (
                      <p className="mt-1 text-sm text-gray-500">
                        {app.supporting_links}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatTimeAgo(app.applied_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===========================
          MODAL VIEW
      =========================== */}
      <Dialog
        open={modalOpen}
        onClose={closeModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white max-w-2xl w-full rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-800">
                Applications for "{modalJob}"
              </Dialog.Title>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {modalApps.map((app) => (
                <div
                  key={app.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <FiUser className="text-gray-500" />
                    <h3 className="font-medium text-gray-800">
                      {app.first_name} {app.last_name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiMail className="text-gray-500" />
                    <span>{app.email}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Applied {formatTimeAgo(app.applied_at)} (
                    {new Date(app.applied_at).toLocaleString()})
                  </p>

                  {app.supporting_links && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Additional Notes & Resources:
                      </p>
                      <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded-md p-2 mt-1">
                        {app.supporting_links}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
