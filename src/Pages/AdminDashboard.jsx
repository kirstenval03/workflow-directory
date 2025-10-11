import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import AdminNavbar from "../Components/AdminNavbar";
import StatCard from "../Components/StatCard";
import AdminJobCard from "../Components/AdminJobCard";
import CreateJobModal from "../Components/CreateJobModal";
import EditJobModal from "../Components/EditJobModal";
import ViewApplicationsModal from "../Components/ViewApplicationsModal";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchApplicationsCount();
  }, []);

  // ────────────────────────────────────────────────
  // FETCH JOBS + APPLICATION COUNTS
  const fetchJobs = async () => {
    try {
      setLoading(true);

      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .order("posted_at", { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch all applications
      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("id, job_id");

      if (appsError) throw appsError;

      // Count applications per job
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
  // FETCH TOTAL APPLICATIONS
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
  // ⚡ TOGGLE JOB STATUS FUNCTION (close or reopen)
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
        // 🟢 Reopen the job for 3 days
        const newClosingDate = new Date();
        newClosingDate.setDate(newClosingDate.getDate() + 3);

        updateData = {
          status: "active",
          closing_date: newClosingDate.toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
        };
      } else {
        // 🔴 Close the job early
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
  // DERIVED STATS
  const activeJobs = jobs.filter((j) => j.status === "active");

  // 🕒 Only jobs closing in 48 hours or less
  const closingSoon = activeJobs.filter((j) => {
    if (!j.closing_date) return false;
    const diffHours =
      (new Date(j.closing_date) - new Date()) / (1000 * 60 * 60);
    return diffHours <= 48 && diffHours >= 0;
  });

  // ────────────────────────────────────────────────
  // LOADING STATE
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );

  // ────────────────────────────────────────────────
  // RENDER
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard title="Active Jobs" value={activeJobs.length} />
          <StatCard title="Total Applications" value={applicationsCount} />
          <StatCard title="Closing Soon" value={closingSoon.length} />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Job Positions</h2>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Job
          </button>
        </div>

        {/* Job List */}
        {jobs.length === 0 ? (
          <p className="text-gray-500 text-sm">No jobs found.</p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
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
                onViewApplications={() => setViewingJob(job)} // 👈 open modal
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateJobModal
          onClose={() => setShowCreateModal(false)}
          onJobCreated={fetchJobs}
        />
      )}

      {selectedJob && (
        <EditJobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onJobUpdated={fetchJobs}
        />
      )}

      {viewingJob && (
        <ViewApplicationsModal
          job={viewingJob}
          onClose={() => setViewingJob(null)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// HELPER FUNCTION
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
