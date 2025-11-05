import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import AdminNavbar from "../Components/AdminNavbar";

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});

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

  useEffect(() => {
    fetchClients();
  }, []);

  // ===== Utility Functions =====
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

  async function handleGenerate(client) {
    try {
      toast.loading("Generating job draft...");
      const res = await fetch("https://YOUR_N8N_WEBHOOK_URL_HERE", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: client.client_name,
          implementation_transcript: client.implementation_transcript,
          implementation_blueprint: client.implementation_blueprint,
          recruiter_transcript: client.recruiter_transcript,
        }),
      });

      if (!res.ok) throw new Error("Workflow failed");
      const data = await res.json();

      const { error } = await supabase
        .from("client_directory")
        .update({
          job_draft: data.job_draft,
          job_draft_status: "generated",
        })
        .eq("id", client.id);

      if (error) throw error;
      toast.dismiss();
      toast.success("Job Draft generated!");
      fetchClients();
    } catch (err) {
      toast.dismiss();
      toast.error(err.message);
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
      {/* Navbar */}
      <AdminNavbar />

      {/* Page Content */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <h1 className="text-2xl font-semibold mb-1 text-gray-900">
          Client Directory
        </h1>
        <p className="text-gray-500 mb-6">
          View and manage all clients with their implementation and recruiter call data.
        </p>

        {/* Table */}
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
                          {c.job_draft_status === "generated" ? (
                            <button
                              className="w-full bg-gray-400 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-gray-500"
                              onClick={() =>
                                toast.info("Open modal to view job draft")
                              }
                            >
                              View Job Draft
                            </button>
                          ) : (
                            <button
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium"
                              onClick={() => handleGenerate(c)}
                            >
                              Generate Job Draft
                            </button>
                          )}
                          {/* Blue edit button */}
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
                              !c.recruiter_transcript &&
                                "Recruiter Transcript",
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
    </div>
  );
}
