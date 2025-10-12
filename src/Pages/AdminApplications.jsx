import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import AdminNavbar from "../Components/AdminNavbar";

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [loading, setLoading] = useState(true);

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

  // Filter logic
  const filteredJobs = showActiveOnly
    ? jobs.filter((job) => job.status === "active")
    : jobs;

  const filteredApplications = applications.filter((app) => {
    const isJobActive = app.jobs?.status === "active" || !showActiveOnly;
    const matchesJob =
      selectedJob === "all" || app.job_id === selectedJob;
    return isJobActive && matchesJob;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Applications
          </h1>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            {/* Job Filter */}
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

            {/* Active Only Toggle */}
            <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show only active jobs</span>
            </label>
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
                    </span>{" "}
                    <span className="text-xs text-gray-400">
                      ({app.jobs?.status || "unknown"})
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
          </div>
        )}
      </div>
    </div>
  );
}
