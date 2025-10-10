import { useState } from 'react';
import { FiClock, FiMapPin, FiDollarSign } from 'react-icons/fi';
import ApplicationModal from './ApplicationModal';

export default function JobCard({ job }) {
  const [isOpen, setIsOpen] = useState(false);
  const closingDate = new Date(job.closing_date);
  const today = new Date();
  const daysLeft = Math.max(Math.ceil((closingDate - today) / (1000 * 60 * 60 * 24)), 0);

  return (
    <>
      <div className="bg-[#111827] rounded-xl p-5 shadow hover:shadow-lg transition border border-[#1f2937]">
        <h2 className="text-lg font-semibold text-white mb-1">{job.title}</h2>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
          <span className="flex items-center gap-1">
            <FiDollarSign />
            {job.hourly_pay_range || 'Rate not listed'}
          </span>
          <span className="flex items-center gap-1">
            <FiMapPin />
            Remote
          </span>
        </div>

        <p className="text-sm text-gray-300 mb-3">{job.preview_description}</p>

        <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
          <FiClock />
          Closes in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
        </div>
        <p className="text-xs text-gray-500">
          Closes {closingDate.toLocaleDateString('en-US')} 11:59pm PT
        </p>

        <button
          onClick={() => setIsOpen(true)}
          className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
        >
          Review Details
        </button>
      </div>

      {/* Application Modal */}
      <ApplicationModal isOpen={isOpen} onClose={() => setIsOpen(false)} job={job} />
    </>
  );
}
