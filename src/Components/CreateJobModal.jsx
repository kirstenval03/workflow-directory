import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function CreateJobModal({ onClose, onJobCreated }) {
  const [title, setTitle] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [hourlyPayRange, setHourlyPayRange] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // NEW: Client selection
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch clients
  useEffect(() => {
    async function loadClients() {
      const { data, error } = await supabase
        .from("client_directory")
        .select("id, client_name");

      if (!error) setClients(data);
    }
    loadClients();
  }, []);

  const filteredClients = clients.filter((c) =>
    c.client_name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientId) {
      alert("Please select a client for this job.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("jobs").insert([
        {
          title,
          preview_description: previewDescription,
          detailed_description: detailedDescription,
          hourly_pay_range: hourlyPayRange,
          closing_date: closingDate,
          status: "open",
          posted_at: new Date().toISOString(),
          created_by: user?.id || null,
          client_id: clientId, // 👈 VERY IMPORTANT
        },
      ]);

      if (error) throw error;

      setSuccessMessage("✅ Job created successfully!");
      await onJobCreated();
      setTimeout(() => onClose(), 800);
    } catch (err) {
      alert("Error creating job: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Create New Job
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* CLIENT DROPDOWN */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              Select Client
            </label>
<div
  className="mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer text-gray-900"
  onClick={() => setDropdownOpen(!dropdownOpen)}
>
  {clientId
    ? clients.find((c) => c.id === clientId)?.client_name
    : "Search client..."}
</div>


            {dropdownOpen && (
              <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl w-full mt-1 max-h-60 overflow-y-auto">
<input
  type="text"
  placeholder="Search clients..."
  className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none 
             text-gray-900 placeholder-gray-500 bg-white"
  value={clientSearch}
  onChange={(e) => setClientSearch(e.target.value)}
/>


                {filteredClients.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No clients found
                  </div>
                )}

                {filteredClients.map((c) => (
<div
  key={c.id}
  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
  onClick={() => {
    setClientId(c.id);
    setDropdownOpen(false);
  }}
>
  {c.client_name}
</div>

                ))}
              </div>
            )}
          </div>

          {/* Inputs */}
          <Input
            label="Title"
            type="text"
            value={title}
            setValue={setTitle}
            placeholder="e.g. AI Workflow Strategist"
          />
          <Input
            label="Preview Description"
            type="text"
            value={previewDescription}
            setValue={setPreviewDescription}
            placeholder="Short summary shown on listings"
          />
          <Textarea
            label="Detailed Description"
            value={detailedDescription}
            setValue={setDetailedDescription}
            placeholder="Full job description and responsibilities"
          />
          <Input
            label="Hourly Pay Range"
            type="text"
            value={hourlyPayRange}
            setValue={setHourlyPayRange}
            placeholder="$100–150/hr"
          />
          <Input
            label="Closing Date"
            type="date"
            value={closingDate}
            setValue={setClosingDate}
          />

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Job"}
            </button>
          </div>

          {successMessage && (
            <p className="text-green-600 text-sm mt-3">{successMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, type, value, setValue, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/* TEXTAREA COMPONENT */
function Textarea({ label, value, setValue, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows="6"
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500"
      ></textarea>
    </div>
  );
}
