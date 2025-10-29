import { Dialog } from "@headlessui/react";
import { FiX, FiLink, FiUpload } from "react-icons/fi";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ArchitechDetailsModal({ isOpen, onClose, architech }) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(architech?.headshot_url || null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
  if (architech?.headshot_url) {
    setPhotoUrl(architech.headshot_url);
  }
}, [architech]);
 
  if (!architech) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // =======================
  // Handle Upload + Preview
  // =======================
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // ✅ Show local preview instantly
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const filePath = `${architech.id}/${Date.now()}-${file.name}`;

      // 🗑️ Delete previous photo if it exists
      if (architech.headshot_url) {
        const parts = architech.headshot_url.split("/architech-headshots/");
        if (parts.length > 1) {
          const oldPath = parts[1];
          await supabase.storage.from("architech-headshots").remove([oldPath]);
        }
      }

      // 📤 Upload new file
      const { error } = await supabase.storage
        .from("architech-headshots")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("architech-headshots")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // ✅ Update DB
      await supabase
        .from("qualified_architechs")
        .update({ headshot_url: publicUrl })
        .eq("id", architech.id);

      setPhotoUrl(publicUrl);
      setPreviewUrl(null);
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Upload failed:", error.message);
      alert("Something went wrong while uploading.");
    } finally {
      setUploading(false);
    }
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 py-2">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-800 text-sm font-medium text-right break-words">
        {value || "—"}
      </span>
    </div>
  );

  const LinkRow = ({ label, url }) =>
    url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between border-b border-gray-100 py-2 text-blue-600 hover:text-blue-800 transition"
      >
        <span className="text-sm">{label}</span>
        <FiLink size={16} />
      </a>
    ) : (
      <div className="flex justify-between items-center border-b border-gray-100 py-2 text-gray-400 text-sm">
        <span>{label}</span>
        <span>—</span>
      </div>
    );

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white max-w-3xl w-full rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <Dialog.Title className="text-xl font-semibold text-gray-800">
              Architech Profile
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <FiX size={22} />
            </button>
          </div>

          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:gap-6 mb-6">
            {/* Avatar */}
            <div className="relative w-28 h-28 mb-3 sm:mb-0">
              <img
                src={previewUrl || photoUrl || "/placeholder-avatar.png"}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border border-gray-300"
              />

              {/* Spinner overlay while uploading */}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Upload button + details */}
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-semibold text-gray-900">
                {architech.full_name || "Unnamed"}
              </h2>
              <p className="text-sm text-gray-600">{architech.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Became an AI Architech on{" "}
                <span className="font-medium">
                  {formatDate(architech.created_at)}
                </span>
              </p>

              <label className="inline-flex items-center gap-2 mt-3 cursor-pointer bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition">
                <FiUpload size={14} />
                {uploading ? "Uploading..." : "Upload New Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section 1 — General Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              General Info
            </h3>
            <InfoRow label="Current Location" value={architech.current_location} />
            <InfoRow label="Availability" value={architech.availability} />
          </div>

          {/* Section 2 — Technical Profile */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Technical Profile
            </h3>
            <InfoRow
              label="Programming Languages"
              value={architech.programming_languages}
            />
            <InfoRow
              label="Database Technologies"
              value={architech.database_technologies}
            />
            <InfoRow
              label="Database Experience"
              value={architech.database_experience}
            />
            <InfoRow
              label="Automation Platforms"
              value={architech.automation_platforms}
            />
          </div>

          {/* Section 3 — Links & Media */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Links & Media
            </h3>
            <LinkRow label="Resume" url={architech.resume_link || architech.resume} />
            <LinkRow label="Loom Video" url={architech.loom_video_link} />
            <LinkRow label="GitHub Profile" url={architech.github_profile} />
          </div>

          {/* Section 4 — Recruiter Notes */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Recruiter Notes
            </h3>
            {architech.recruiter_notes ? (
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {architech.recruiter_notes}
              </p>
            ) : (
              <p className="text-gray-400 text-sm italic">No notes available.</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-all"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
