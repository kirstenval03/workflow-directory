import { Dialog } from '@headlessui/react';
import { FiX, FiClock, FiMapPin, FiDollarSign } from 'react-icons/fi';
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ApplicationModal({ isOpen, onClose, job }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bidRate, setBidRate] = useState('');
  const [supportingLinks, setSupportingLinks] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1️⃣ Look up the qualified architech by email
    const { data: architech, error: lookupError } = await supabase
      .from('qualified_architechs')
      .select('id, full_name')
      .eq('email', email)
      .single();

    if (lookupError || !architech) {
      setLoading(false);
      alert(
        'This email is not recognized. Please use the same email you used to apply to be an AI Architech, if you have questions please contact us at talents@aiarchitech.com'
      );
      return;
    }

    // 2️⃣ If found, insert the application with their ID
    const { error: insertError } = await supabase.from('applications').insert([
      {
        job_id: job.id,
        email,
        first_name: firstName,
        last_name: lastName,
        bid_rate: bidRate,
        supporting_links: supportingLinks,
        applied_at: new Date().toISOString(),
        status: 'new',
        qualified_architech_id: architech.id, // ✅ new link field
      },
    ]);

    if (insertError) throw insertError;

    // 3️⃣ Success state
    setSubmitted(true);
  } catch (err) {
    console.error('Application error:', err);
    alert('Error submitting your application. Please try again.');
  } finally {
    setLoading(false);
  }
};

  if (!job) return null;

  const closingDate = new Date(job.closing_date);
  const daysLeft = Math.max(
    Math.ceil((closingDate - new Date()) / (1000 * 60 * 60 * 24)),
    0
  );

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <Dialog.Panel className="relative bg-[#0f172a] max-w-3xl w-full p-8 rounded-xl shadow-xl border border-gray-700 text-white">
          
          {/* Clean, aligned Close Button */}
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            aria-label="Close"
          >
            <FiX size={22} />
          </button>

          {/* Job Info */}
          <div className="mb-8 mt-2">
            <h2 className="text-2xl font-semibold mb-2 pr-10">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
              <span className="flex items-center gap-1"><FiDollarSign /> {job.hourly_pay_range}</span>
              <span className="flex items-center gap-1"><FiMapPin /> Remote</span>
              <span className="flex items-center gap-1"><FiClock /> Closes in {daysLeft} days</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
              {job.detailed_description}
            </p>
            <div className="text-sm text-gray-500 border border-gray-700 rounded px-4 py-2 inline-block">
              <strong className="text-white">Application Deadline:</strong>{' '}
              {closingDate.toLocaleDateString('en-US')} at 11:59pm PT
            </div>
          </div>

          {/* Application Form */}
          <div className="border-t border-gray-700 pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Apply for this Position</h3>

            {submitted ? (
              <div className="text-green-400 font-medium text-center">
                Application submitted successfully!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 text-white"
                  />
                </div>

                {/* Bid Rate */}
                <div>
                  <label className="block text-sm mb-1">
                    Your Bid Rate (USD/hr) *
                    <span className="text-gray-400 ml-2">
                      (Suggested Range: {job.hourly_pay_range})
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bidRate}
                    onChange={(e) => setBidRate(e.target.value)}
                    required
                    min={parseInt(job.hourly_pay_range?.split('-')[0]) || 0}
                    max={parseInt(job.hourly_pay_range?.split('-')[1]) || undefined}
                    className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 text-white"
                    placeholder="Enter your desired hourly rate"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">
                    Additional Notes or Resources (Optional)
                  </label>
                  <textarea
                    value={supportingLinks}
                    onChange={(e) => setSupportingLinks(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Links, context, portfolio info, etc."
                    className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 text-white"
                  />
                </div>

                <div className="text-center mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-48 bg-gradient-to-r from-sky-500 to-blue-600 py-2 rounded-md text-white font-medium hover:opacity-90 transition"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
