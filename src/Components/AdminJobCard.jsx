export default function AdminJobCard({
  job,
  onEdit,
  onStatusToggle,
  onViewApplications,
}) {
  const isClosed = job.status === "closed";

  const statusColor =
    job.status === "open"
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-200 text-gray-600";

  // 🔹 Detect if the job is closing soon (<= 2 days)
  const isClosingSoon =
    typeof job.closing_in === "string"
      ? job.closing_in.includes("day") && parseInt(job.closing_in) <= 2
      : false;

  // 🔹 Format closing date
  const formattedClosingDate = job.closing_date
    ? new Date(job.closing_date).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      })
    : "N/A";

  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex justify-between items-start ${
        isClosed ? "opacity-80" : ""
      }`}
    >
      {/* Left side: job info */}
      <div className="flex-1">
        {/* Title */}
        <h3 className="font-semibold text-gray-800 leading-snug mb-1">
          {job.title}
        </h3>

        {/* Pills BELOW the title */}
        <div className="flex items-center gap-2 mb-2">
          {/* Status pill */}
          <span
            className={`text-xs px-2 py-1 rounded-full ${statusColor} whitespace-nowrap`}
          >
            {job.status}
          </span>

          {/* 🕒 Closing Soon pill */}
          {job.status === "open" && isClosingSoon && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium whitespace-nowrap">
              Closing Soon
            </span>
          )}
        </div>

        {/* Hourly budget + closing info */}
        <p className="text-sm text-gray-500 mb-1">
          Hourly Budget: ${job.pay} •{" "}
          {isClosed ? "Closed on" : "Closes on"} {formattedClosingDate}
        </p>

        <p className="text-gray-600 text-sm mb-3">{job.preview}</p>

        {/* Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onEdit(job)}
            className="px-4 py-1.5 bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white rounded font-semibold text-sm shadow-md hover:opacity-90 transition"
          >
           View Details
          </button>

          <button
            onClick={() => onViewApplications(job)}
            className="px-4 py-1.5 bg-gradient-to-r from-[#007BFF] to-[#0062E6] text-white rounded font-semibold text-sm shadow-md hover:opacity-90 transition"
          >
            View Applicants
          </button>

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
      <p className="text-sm text-gray-500 whitespace-nowrap ml-4">
        {job.applications} applicant{job.applications !== 1 && "s"}
      </p>
    </div>
  );
}
