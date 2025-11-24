import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import AdminNavbar from "../Components/AdminNavbar";
import PublishJobModal from "../Components/PublishJobModal";

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [generatingId, setGeneratingId] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [filter, setFilter] = useState("all");

  // NEW: search bar
  const [searchTerm, setSearchTerm] = useState("");

  // ===== Utility =====
  const hasAllFields = (c) =>
    c.implementation_transcript &&
    c.implementation_blueprint &&
    c.recruiter_transcript;

  // ===== Fetch Clients =====
  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_directory")
      .select(
        `id, client_name, client_email, implementation_transcript,
         implementation_blueprint, recruiter_transcript,
         job_draft_status, job_draft`
      );

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const sorted = [...data].sort((a, b) => {
      const aReady = hasAllFields(a);
      const bReady = hasAllFields(b);
      if (aReady && !bReady) return -1;
      if (!aReady && bReady) return 1;
      return 0;
    });

    setClients(sorted);
    setLoading(false);
  }

  // ===== On Mount =====
  useEffect(() => {
    fetchClients();

    const channel = supabase
      .channel("job-draft-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "client_directory",
          filter: "job_draft_status=eq.generated",
        },
        (payload) => {
          toast.success(`Job Draft generated for ${payload.new.client_name}!`);
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function handleChange(id, field, value) {
    setFormData((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  }

  async function handleSave(id) {
    const updates = formData[id];
    if (!updates) return;
    const { error } = await supabase
      .from("client_directory")
      .update(updates)
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Client updated!");
      setEditing(null);
      fetchClients();
    }
  }

  // ===== Generate Job Draft =====
  async function handleGenerate(client) {
    try {
      setGeneratingId(client.id);
      toast.loading(`Sending data for ${client.client_name}...`);

      const webhookUrl =
        "https://aiarchitech.app.n8n.cloud/webhook/ae2c1351-391e-44eb-9b13-356ce4769f2c";

      const payload = {
        id: client.id,
        client_name: client.client_name,
        implementation_transcript: client.implementation_transcript,
        implementation_blueprint: client.implementation_blueprint,
        recruiter_transcript: client.recruiter_transcript,
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Failed with status ${response.status}`);

      toast.dismiss();
      toast.success(`Job Draft started for ${client.client_name}!`);

      await supabase
        .from("client_directory")
        .update({ job_draft_status: "processing" })
        .eq("id", client.id);

      fetchClients();
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to send data to n8n");
    } finally {
      setGeneratingId(null);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center mt-20 text-gray-600">
        Loading clients...
      </div>
    );

  // ===== Filter + Search Logic =====
  const filteredClients = clients
    .filter((c) => {
      const isReady = hasAllFields(c);
      const isPublished =
        c.job_draft_status?.trim().toLowerCase() === "published";

      if (filter === "ready") return isReady && !isPublished;
      if (filter === "not-ready") return !isReady;
      if (filter === "posted") return isPublished;
      return true;
    })
    .filter((c) => {
      if (!searchTerm) return true;
      return (
        c.client_name.toLowerCase().includes(searchTerm) ||
        c.client_email.toLowerCase().includes(searchTerm)
      );
    });

  // ===== UI =====
  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        {/* Title + Search + Filter */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1 text-gray-900">
              Client Directory
            </h1>
            <p className="text-gray-500">
              View and manage all clients with their implementation and recruiter
              call data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name or email..."
              className="border border-gray-300 bg-white text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />

            {/* Filter */}
            <select
              className="border border-gray-300 bg-white text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="ready">Ready to Post</option>
              <option value="not-ready">Not Yet Ready</option>
              <option value="posted">Job Posted</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium w-[10%]">
                  Client
                </th>
                <th className="px-6 py-3 text-left font-medium w-[20%]">
                  Implementation Transcript
                </th>
                <th className="px-6 py-3 text-left font-medium w-[10%]">
                  Blueprint
                </th>
                <th className="px-6 py-3 text-left font-medium w-[20%]">
                  Recruiter Transcript
                </th>
                <th className="px-6 py-3 text-left font-medium w-[25%]">
                  Assets
                </th>
                <th className="px-6 py-3 text-center font-medium w-[25%]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.map((c) => {
                const isEditing = editing === c.id;
                const isGenerating = generatingId === c.id;

                const check = (condition) =>
                  condition ? (
                    <span className="text-green-600 font-semibold">✔</span>
                  ) : (
                    <span className="text-red-500 font-semibold">✖</span>
                  );

                return (
                  <tr
                    key={c.id}
                    className={`border-b last:border-none ${
                      isEditing ? "bg-blue-50/40" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Client */}
                    <td className="px-6 py-4 align-top break-words">
                      <div className="font-semibold text-gray-900">
                        {c.client_name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {c.client_email}
                      </div>
                    </td>

                    {/* Implementation Transcript */}
                    <td className="px-6 py-4 align-top max-w-[250px] truncate">
                      {isEditing ? (
                        <textarea
                          className="w-full p-2 border rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 min-h-[60px] resize-y"
                          value={
                            formData[c.id]?.implementation_transcript ??
                            c.implementation_transcript ??
                            ""
                          }
                          onChange={(e) =>
                            handleChange(
                              c.id,
                              "implementation_transcript",
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p
                          className="text-gray-700 truncate"
                          title={c.implementation_transcript || ""}
                        >
                          {c.implementation_transcript
                            ? c.implementation_transcript.substring(0, 80) +
                              "..."
                            : "—"}
                        </p>
                      )}
                    </td>

                    {/* Blueprint */}
                    <td className="px-6 py-4 align-top text-blue-600 hover:underline whitespace-nowrap">
                      {isEditing ? (
                        <input
                          className="w-full p-2 border rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                          value={
                            formData[c.id]?.implementation_blueprint ??
                            c.implementation_blueprint ??
                            ""
                          }
                          onChange={(e) =>
                            handleChange(
                              c.id,
                              "implementation_blueprint",
                              e.target.value
                            )
                          }
                        />
                      ) : c.implementation_blueprint ? (
                        <a
                          href={c.implementation_blueprint}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View PDF
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Recruiter Transcript */}
                    <td className="px-6 py-4 align-top max-w-[250px] truncate">
                      {isEditing ? (
                        <textarea
                          className="w-full p-2 border rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 min-h-[60px] resize-y"
                          value={
                            formData[c.id]?.recruiter_transcript ??
                            c.recruiter_transcript ??
                            ""
                          }
                          onChange={(e) =>
                            handleChange(
                              c.id,
                              "recruiter_transcript",
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p
                          className="text-gray-700 truncate"
                          title={c.recruiter_transcript || ""}
                        >
                          {c.recruiter_transcript
                            ? c.recruiter_transcript.substring(0, 80) + "..."
                            : "—"}
                        </p>
                      )}
                    </td>

                    {/* Assets */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col text-xs space-y-1">
                        <div>
                          {check(c.implementation_transcript)} Implementation
                          Transcript
                        </div>
                        <div>
                          {check(c.recruiter_transcript)} Recruiter Transcript
                        </div>
                        <div>
                          {check(c.implementation_blueprint)} Implementation
                          Blueprint
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center align-top w-[200px] whitespace-normal">
                      {isEditing ? (
                        <div className="flex flex-col gap-2 items-center">
                          <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium"
                            onClick={() => handleSave(c.id)}
                          >
                            Save
                          </button>
                          <button
                            className="w-full border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-1.5 rounded-md text-xs font-medium"
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : hasAllFields(c) ? (
                        <div className="flex flex-col gap-2 items-center">
                          {(() => {
                            const status =
                              c.job_draft_status?.trim().toLowerCase();

                            if (status === "published") {
                              return (
                                <a
                                  href="/admin"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-xs font-medium text-center block"
                                >
                                  Job Posted — See Job
                                </a>
                              );
                            }

                            if (status === "generated") {
                              return (
                                <button
                                  className="w-full bg-gray-400 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-500"
                                  onClick={() =>
                                    setSelectedDraft({
                                      client: c,
                                      draft: c.job_draft,
                                    })
                                  }
                                >
                                  View Job Draft
                                </button>
                              );
                            }

                            return (
                              <button
                                disabled={isGenerating}
                                className={`w-full text-white px-4 py-1.5 rounded-md text-xs font-medium ${
                                  isGenerating
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                } flex items-center justify-center gap-2`}
                                onClick={() => handleGenerate(c)}
                              >
                                {isGenerating ? (
                                  <>
                                    <svg
                                      className="animate-spin h-4 w-4 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                      ></path>
                                    </svg>
                                    Generating...
                                  </>
                                ) : (
                                  "Generate Job Draft"
                                )}
                              </button>
                            );
                          })()}
                          <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium"
                            onClick={() => setEditing(c.id)}
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium"
                            onClick={() => setEditing(c.id)}
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Publish Modal ===== */}
      {selectedDraft && (
        <PublishJobModal
          client={selectedDraft.client}
          draft={selectedDraft.draft}
          onClose={() => setSelectedDraft(null)}
        />
      )}
    </div>
  );
}
