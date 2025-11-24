import { FiShare2 } from "react-icons/fi";
import toast from "react-hot-toast";

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

  const isClosingSoon =
    typeof job.closing_in === "string"
      ? job.closing_in.includes("day") && parseInt(job.closing_in) <= 2
      : false;

  const formattedClosingDate = job.closing_date
    ? new Date(job.closing_date).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      })
    : "N/A";

  // NEW: Share Link Function
  const handleShare = () => {
    const shareUrl = `https://ai-architechs-6lbr.vercel.app/jobs?job=${job.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied!");
  };

  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-start transition hover:shadow-md ${
        isClosed ? "opacity-75" : ""
      }`}
    >


      {/* LEFT CONTENT */}
      <div className="flex-1 pr-6">
        <h3 className="font-semibold text-gray-900 text-lg mb-2 leading-tight">
          {job.title}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-xs px-2.5 py-1 rounded-full ${statusColor} font-medium`}
          >
            {job.status}
          </span>

          {job.status === "open" && isClosingSoon && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              Closing Soon
            </span>
          )}
        </div>

        {job.client && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-sm text-gray-600 font-medium">
              Client:
            </span>
            <span className="text-sm text-gray-800 font-semibold">
              {job.client.client_name}
            </span>
            <span className="text-sm text-gray-400">
              ({job.client.client_email})
            </span>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-3">
          Hourly Budget:{" "}
          <span className="font-medium text-gray-700">${job.pay}</span> •{" "}
          {isClosed ? "Closed on" : "Closes on"} {formattedClosingDate}
        </p>

        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {job.preview}
        </p>
{/* Buttons */}
<div className="flex flex-wrap gap-3">
  <button
    onClick={() => onEdit(job)}
    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition"
  >
    View Details
  </button>

  <button
    onClick={() => onViewApplications(job)}
    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition"
  >
    View Applicants
  </button>

  <button
    onClick={() => onStatusToggle(job)}
    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition"
  >
    {isClosed ? "Reopen Job" : "Close Early"}
  </button>

  {/* NEW — Share button */}
  <button
    onClick={handleShare}
    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium shadow hover:bg-blue-600 transition flex items-center gap-1"
    title="Copy Share Link"
  >
    <FiShare2 size={16} />
    Share
  </button>
</div>

      </div>

      <div className="flex flex-col items-end min-w-[90px]">
        <p className="text-sm text-gray-500">
          {job.applications} applicant{job.applications !== 1 && "s"}
        </p>
      </div>
    </div>
  );
}
