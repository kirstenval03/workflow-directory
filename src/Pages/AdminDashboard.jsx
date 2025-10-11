import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import AdminNavbar from "../Components/AdminNavbar";
import StatCard from "../Components/StatCard";
import AdminJobCard from "../Components/AdminJobCard";
import CreateJobModal from "../Components/CreateJobModal";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // 🔹 Fetch jobs + applications on mount
  useEffect(() => {
    fetchJobs();
    fetchApplicationsCount();
  }, []);

  // Fetch all jobs
  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("posted_at", { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error("Error fetching jobs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch total applications count
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

  const activeJobs = jobs.filter((j) => j.status === "active");
  const closingSoon = activeJobs.filter((j) => {
    if (!j.closing_date) return false;
    const diffDays =
      (new Date(j.closing_date) - new Date()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays >= 0;
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );

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
            onClick={() => setShowModal(true)}
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
                  id: job.id,
                  title: job.title,
                  pay: job.hourly_pay_range,
                  location: "Remote",
                  closing_in: getDaysUntil(job.closing_date),
                  status: job.status,
                  preview: job.preview_description,
                  applications: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CreateJobModal
          onClose={() => setShowModal(false)}
          onJobCreated={fetchJobs}
        />
      )}
    </div>
  );
}

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
