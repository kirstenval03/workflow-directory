export default function AdminJobCard({ job, onEdit, onStatusToggle }) {
  const isClosed = job.status === "closed";

  const statusColor =
    job.status === "active"
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-200 text-gray-600";

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex justify-between items-start">
      {/* Left side: job info */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-gray-800">{job.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
            {job.status}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-1">
         Pay Range {job.pay}  •  Closes in {job.closing_in}
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
          <button className="px-4 py-1.5 bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white rounded font-semibold text-sm shadow-md hover:opacity-90 transition">
            View Applications
          </button>

          {/* EXPORT CSV */}
          <button className="px-4 py-1.5 bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white rounded font-semibold text-sm shadow-md hover:opacity-90 transition">
            Export CSV
          </button>

          {/* CLOSE / REOPEN */}
          <button
            onClick={() => onStatusToggle(job)}
            className={`px-4 py-1.5 rounded font-semibold text-sm shadow-md transition ${
              isClosed
                ? "bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white hover:opacity-90"
                : "bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white hover:opacity-90"
            }`}
          >
            {isClosed ? "Reopen Job" : "Close Early"}
          </button>
        </div>
      </div>

      {/* Right side: application count */}
      <p className="text-sm text-gray-500 whitespace-nowrap">
        {job.applications} applications
      </p>
    </div>
  );
}
