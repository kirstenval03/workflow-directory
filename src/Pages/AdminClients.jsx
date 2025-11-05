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

    // Sort: ready-to-generate first
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

    // 🔔 Realtime listener for job draft updates
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
          console.log("🔄 Job draft updated:", payload.new);
          toast.success(`Job Draft generated for ${payload.new.client_name}!`);
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ===== Utility =====
  const hasAllFields = (c) =>
    c.implementation_transcript &&
    c.implementation_blueprint &&
    c.recruiter_transcript;

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

      console.log("📤 Sending data to n8n:", payload);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Failed with status ${response.status}`);

      console.log("✅ Successfully sent to n8n!");
      toast.dismiss();
      toast.success(`Job Draft started for ${client.client_name}!`);

      // Immediately set to "processing"
      await supabase
        .from("client_directory")
        .update({ job_draft_status: "processing" })
        .eq("id", client.id);

      fetchClients();
    } catch (err) {
      console.error("❌ Error sending data to n8n:", err);
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

  // ===== UI =====
  return (
    <div className="bg-gray-50 min-h-screen">
      <AdminNavbar />

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <h1 className="text-2xl font-semibold mb-1 text-gray-900">
          Client Directory
        </h1>
        <p className="text-gray-500 mb-6">
          View and manage all clients with their implementation and recruiter
          call data.
        </p>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium w-[18%]">
                  Client
                </th>
                <th className="px-6 py-3 text-left font-medium w-[25%]">
                  Implementation Transcript
                </th>
                <th className="px-6 py-3 text-left font-medium w-[12%]">
                  Blueprint
                </th>
                <th className="px-6 py-3 text-left font-medium w-[25%]">
                  Recruiter Transcript
                </th>
                <th className="px-6 py-3 text-center font-medium w-[20%]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {clients.map((c) => {
                const isEditing = editing === c.id;
                const isGenerating = generatingId === c.id;

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
                          {c.job_draft_status?.trim().toLowerCase() ===
                          "generated" ? (
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
                          ) : (
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
                          )}
                          <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium"
                            onClick={() => setEditing(c.id)}
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <span className="text-gray-500 text-xs leading-snug break-words">
                            Missing{" "}
                            {[
                              !c.implementation_transcript &&
                                "Implementation Transcript",
                              !c.implementation_blueprint && "Blueprint",
                              !c.recruiter_transcript && "Recruiter Transcript",
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
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
