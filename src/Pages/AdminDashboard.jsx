import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import AdminNavbar from "../Components/AdminNavbar";
import AdminJobCard from "../Components/AdminJobCard";
import CreateJobModal from "../Components/CreateJobModal";
import EditJobModal from "../Components/EditJobModal";
import ViewApplicationsModal from "../Components/ViewApplicationsModal";
import PublishJobModal from "../Components/PublishJobModal";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [filter, setFilter] = useState("all");

  // NEW → for opening PublishJobModal from JobDraftsPanel
  const [selectedDraft, setSelectedDraft] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchApplicationsCount();
  }, []);

  // ────────────────────────────────────────────────
  // FETCH JOBS + APPLICATION COUNTS
  const fetchJobs = async () => {
    try {
      setLoading(true);

      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .order("posted_at", { ascending: false });

      if (jobsError) throw jobsError;

      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("id, job_id");

      if (appsError) throw appsError;

      const jobsWithCounts = jobsData.map((job) => {
        const appCount = appsData.filter((app) => app.job_id === job.id).length;
        return { ...job, applications: appCount };
      });

      setJobs(jobsWithCounts);
    } catch (err) {
      console.error("Error fetching jobs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  const fetchApplicationsCount = async () => {
    try {
      const { count, error } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      setApplicationsCount(count || 0);
    } catch (err) {
      console.error("Error fetching applications count:", err.message);
    }
  };

  // ────────────────────────────────────────────────
  const handleJobUpdated = async (updatedJobId) => {
    const { data: freshJob, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", updatedJobId)
      .single();

    if (error) {
      console.error("Error fetching updated job:", error);
      return;
    }

    setSelectedJob(freshJob);
    await fetchJobs();
  };

  // ────────────────────────────────────────────────
  const handleStatusToggle = async (job) => {
    const isClosed = job.status === "closed";

    const confirm = window.confirm(
      isClosed
        ? `Reopen "${job.title}" for 3 more days?`
        : `Are you sure you want to close "${job.title}" early?`
    );
    if (!confirm) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      let updateData;

      if (isClosed) {
        const newClosingDate = new Date();
        newClosingDate.setDate(newClosingDate.getDate() + 3);

        updateData = {
          status: "open",
          closing_date: newClosingDate.toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
        };
      } else {
        updateData = {
          status: "closed",
          closing_date: today,
          updated_at: new Date().toISOString(),
        };
      }

      const { error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", job.id);

      if (error) throw error;

      toast.success(
        isClosed
          ? `✅ "${job.title}" reopened for 3 more days!`
          : `✅ "${job.title}" closed successfully!`
      );

      await fetchJobs();
    } catch (err) {
      console.error("Error toggling job status:", err.message);
      toast.error("❌ Failed to update job status");
    }
  };

  // ────────────────────────────────────────────────
  const filteredJobs =
    filter === "all"
      ? jobs
      : jobs.filter((j) => j.status === filter.toLowerCase());

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );

  // ────────────────────────────────────────────────
  // JOB DRAFTS PANEL — WITH COLLAPSE + CONDITIONAL RENDER
  function JobDraftsPanel() {
    const [drafts, setDrafts] = useState([]);
    const [loadingDrafts, setLoadingDrafts] = useState(true);
    const [open, setOpen] = useState(true); // collapse toggle

    useEffect(() => {
      fetchDrafts();
    }, []);

    async function fetchDrafts() {
      setLoadingDrafts(true);

      const { data, error } = await supabase
        .from("client_directory")
        .select("id, client_name, client_email, job_draft_status, job_draft")
        .eq("job_draft_status", "generated");

      if (!error) setDrafts(data || []);
      setLoadingDrafts(false);
    }

    // No drafts? Don't show panel at all.
    if (!loadingDrafts && drafts.length === 0) return null;

    return (
      <div className="mb-8 bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Job Drafts Ready for Review
            </h3>
            <p className="text-sm text-gray-500">
              These drafts were generated from client transcripts and are waiting to be published.
            </p>
          </div>

<button
  onClick={() => setOpen(!open)}
  className="px-2 py-1 rounded-md text-gray-600 text-xs border border-gray-200 bg-white hover:bg-gray-100 transition"
>
  {open ? "Hide ▲" : "Show ▼"}
</button>


        </div>

        {/* Loading */}
        {loadingDrafts && (
          <div className="p-4 text-gray-600">Loading job drafts...</div>
        )}

        {/* Collapsible section */}
        {open && drafts.length > 0 && !loadingDrafts && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700">
                  Client
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">
                  Job Title
                </th>
                <th className="px-6 py-3 text-center font-medium text-gray-700">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {drafts.map((c) => {
                let parsed;
                try {
                  parsed =
                    typeof c.job_draft === "string"
                      ? JSON.parse(c.job_draft)
                      : c.job_draft;
                } catch {
                  parsed = {};
                }

                return (
                  <tr
                    key={c.id}
                    className="border-b last:border-none hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {c.client_name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">{c.client_email}</td>

                    <td className="px-6 py-4 text-gray-700">
                      {parsed?.job_title || "—"}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs"
                        onClick={() =>
                          setSelectedDraft({ client: c, draft: c.job_draft })
                        }
                      >
                        View Job Draft
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // RENDER
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* DRAFT PANEL */}
        <JobDraftsPanel />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Job Positions</h2>

          <div className="flex items-center gap-3">
            <select
              className="border border-gray-300 bg-white text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Job
            </button>
          </div>
        </div>

        {/* Job List */}
        {filteredJobs.length === 0 ? (
          <p className="text-gray-500 text-sm">No jobs found.</p>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <AdminJobCard
                key={job.id}
                job={{
                  ...job,
                  pay: job.hourly_pay_range,
                  preview: job.preview_description,
                  location: "Remote",
                  closing_in: getDaysUntil(job.closing_date),
                  applications: job.applications || 0,
                }}
                onEdit={() => setSelectedJob(job)}
                onStatusToggle={handleStatusToggle}
                onViewApplications={() => setViewingJob(job)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal
          onClose={() => setShowCreateModal(false)}
          onJobCreated={fetchJobs}
        />
      )}

      {/* Edit Job Modal */}
      {selectedJob && (
        <EditJobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onJobUpdated={(id) => handleJobUpdated(id)}
        />
      )}

      {/* Applications Modal */}
      {viewingJob && (
        <ViewApplicationsModal
          job={viewingJob}
          onClose={() => setViewingJob(null)}
        />
      )}

      {/* Publish Job Modal coming from Draft Panel */}
      {selectedDraft && (
        <PublishJobModal
          client={selectedDraft.client}
          draft={selectedDraft.draft}
          onClose={() => setSelectedDraft(null)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// HELPER
function getDaysUntil(dateStr) {
  if (!dateStr) return "N/A";
  const now = new Date();
  const closing = new Date(dateStr);
  const diff = closing - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days > 1) return `${days} days`;
  if (days === 1) return "1 day";
  if (days === 0) return "today";
  return `${Math.abs(days)} days ago`;
}
