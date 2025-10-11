export default function AdminJobCard({ job, onEdit, onStatusToggle, onViewApplications }) {
  const isClosed = job.status === "closed";

  const statusColor =
    job.status === "active"
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-200 text-gray-600";

  // 🔹 Detect if the job is closing soon (<= 2 days)
  const isClosingSoon =
    typeof job.closing_in === "string"
      ? job.closing_in.includes("day") && parseInt(job.closing_in) <= 2
      : false;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex justify-between items-start">
      {/* Left side: job info */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-gray-800">{job.title}</h3>

          {/* Status pill */}
          <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
            {job.status}
          </span>

          {/* 🕒 Closing Soon pill */}
          {job.status === "active" && isClosingSoon && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              Closing Soon
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-1">
          Pay Range {job.pay} • Closes in {job.closing_in}
        </p>

        <p className="text-gray-600 text-sm mb-3">{job.preview}</p>

        <div className="flex gap-2">
          {/* EDIT */}
          <button
            onClick={() => onEdit(job)}
            className="px-4 py-1.5 bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white rounded font-semibold text-sm shadow-md hover:opacity-90 transition"
          >
            Edit
          </button>

          {/* VIEW APPLICATIONS */}
          <button
            onClick={() => onViewApplications(job)}
            className="px-4 py-1.5 bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white rounded font-semibold text-sm shadow-md hover:opacity-90 transition"
          >
            View Applications
          </button>

          {/* EXPORT CSV */}
          <button
            className="px-4 py-1.5 bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white rounded font-semibold text-sm shadow-md hover:opacity-90 transition"
            onClick={() => alert(`Exporting CSV for "${job.title}" (coming soon)`)}
          >
            Export CSV
          </button>

          {/* CLOSE / REOPEN */}
          <button
            onClick={() => onStatusToggle(job)}
            className={`px-4 py-1.5 rounded font-semibold text-sm shadow-md transition 
              bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white hover:opacity-90`}
          >
            {isClosed ? "Reopen Job" : "Close Early"}
          </button>
        </div>
      </div>

      {/* Right side: application count */}
      <p className="text-sm text-gray-500 whitespace-nowrap">
        {job.applications} application{job.applications !== 1 && "s"}
      </p>
    </div>
  );
}
