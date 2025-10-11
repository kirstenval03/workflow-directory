export default function AdminJobCard({ job, onEdit }) {
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
          {job.pay} • {job.location} • Closes in {job.closing_in}
        </p>

        <p className="text-gray-600 text-sm mb-3">{job.preview}</p>

        <div className="flex gap-2">
          {/* EDIT */}
          <button
            onClick={() => onEdit(job)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition"
          >
            Edit
          </button>

          {/* VIEW APPLICATIONS */}
          <button className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">
            View Applications
          </button>

          {/* EXPORT CSV */}
          <button className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">
            Export CSV
          </button>

          {/* CLOSE EARLY */}
          <button className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">
            Close Early
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
