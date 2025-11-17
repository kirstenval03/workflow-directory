import { Dialog } from "@headlessui/react";
import {
  FiX,
  FiUpload,
  FiExternalLink,
  FiCopy,
  FiLink,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ArchitechDetailsModal({
  isOpen,
  onClose,
  architech,
}) {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(architech?.headshot_url || null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileGenerated, setProfileGenerated] = useState(
    !!architech?.ai_profile_copy
  );

  useEffect(() => {
    if (architech?.headshot_url) setPhotoUrl(architech.headshot_url);
    setProfileGenerated(!!architech?.ai_profile_copy);
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

  // -------------------------
  // Copy Email
  // -------------------------
  const copyEmail = () => {
    navigator.clipboard.writeText(architech.email);
  };

  // -------------------------
  // Upload Photo
  // -------------------------
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const filePath = `${architech.id}/${Date.now()}-${file.name}`;

      if (architech.headshot_url) {
        const parts = architech.headshot_url.split("/architech-headshots/");
        if (parts.length > 1) {
          const oldPath = parts[1];
          await supabase.storage
            .from("architech-headshots")
            .remove([oldPath]);
        }
      }

      const { error } = await supabase.storage
        .from("architech-headshots")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("architech-headshots")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

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

  // -------------------------
  // Generate AI Profile
  // -------------------------
  const handleGenerateProfile = async () => {
    try {
      setLoadingProfile(true);

      const payload = {
        architech_id: architech.id,
        full_name: architech.full_name,
        resume: architech.resume,
        interview_transcript: architech.interview_transcript,
        availability: architech.availability,
        programming_languages: architech.programming_languages,
        automation_platforms: architech.automation_platforms,
        database_technologies: architech.database_technologies,
      };

      const webhookUrl =
        "https://aiarchitech.app.n8n.cloud/webhook/20edebe2-327c-4213-b247-1da4cc046ec7";

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Webhook call failed");

      alert("Data sent to n8n!");

      const start = Date.now();
      const timeout = 60000; // 1 min

      while (Date.now() - start < timeout) {
        const { data } = await supabase
          .from("qualified_architechs")
          .select("ai_profile_copy")
          .eq("id", architech.id)
          .single();

        if (data?.ai_profile_copy) {
          setProfileGenerated(true);
          alert("AI Profile generated!");
          break;
        }

        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while generating the profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  // -------------------------
  // Little UI Helpers
  // -------------------------
  const InfoBlock = ({ title, children }) => (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">
        {title}
      </h3>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="py-1 flex justify-between text-sm border-b border-gray-100">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right">
        {value || "—"}
      </span>
    </div>
  );

  const LinkRow = ({ label, url }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex justify-between py-2 text-sm ${
        url
          ? "text-blue-600 hover:text-blue-800 border-b border-gray-100"
          : "text-gray-400 border-b border-gray-100"
      }`}
    >
      <span>{label}</span>
      {url ? <FiLink size={15} /> : <span>—</span>}
    </a>
  );

  const statusColor = {
    active: "bg-green-100 text-green-700",
    submitted: "bg-yellow-100 text-yellow-700",
    inactive: "bg-gray-100 text-gray-600",
    unavailable: "bg-red-100 text-red-600",
  }[architech.status] || "bg-gray-100 text-gray-700";

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white w-full max-w-3xl rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[90vh]">
          {/* HEADER */}
          <div className="flex justify-between mb-5">
            <Dialog.Title className="text-xl font-semibold text-gray-800">
              Architech Profile
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX size={22} />
            </button>
          </div>

          {/* TOP SECTION */}
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Photo */}
            <div className="relative w-28 h-28">
              <img
                src={previewUrl || photoUrl || "/placeholder-avatar.png"}
                className="w-28 h-28 rounded-full object-cover border"
              />
              {uploading && (
                <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {architech.full_name}
                </h2>

                {/* STATUS PILL */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}
                >
                  {architech.status}
                </span>
              </div>

              {/* Email w/ COPY */}
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-600">{architech.email}</p>
                <button
                  onClick={copyEmail}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiCopy size={15} />
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                Became an AI-Architech on{" "}
                <span className="font-medium">
                  {formatDate(architech.created_at)}
                </span>
              </p>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 mt-4 flex-wrap">
                <label className="inline-flex items-center bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium cursor-pointer hover:opacity-90">
                  <FiUpload size={14} />
                  <span className="ml-1">
                    {uploading ? "Uploading..." : "Upload New Photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>

                {!profileGenerated ? (
                  <button
                    onClick={handleGenerateProfile}
                    disabled={loadingProfile}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {loadingProfile ? "Generating..." : "Generate Profile Copy"}
                  </button>
                ) : (
                  <a
                    href={`/admin/profile/${architech.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium hover:text-blue-800"
                  >
                    <FiExternalLink size={14} />
                    View AIA Profile
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* GENERAL INFO */}
          <InfoBlock title="General Info">
            <InfoRow label="Current Location" value={architech.current_location} />
            <InfoRow label="Availability" value={architech.availability} />
          </InfoBlock>

          {/* TECHNICAL PROFILE */}
          <InfoBlock title="Technical Profile">
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
          </InfoBlock>

          {/* LINKS */}
          <InfoBlock title="Links & Media">
            <LinkRow
              label="Resume"
              url={architech.resume_link || architech.resume}
            />
            <LinkRow label="Loom Video" url={architech.loom_video_link} />
            <LinkRow label="GitHub Profile" url={architech.github_profile} />
          </InfoBlock>

          {/* NOTES */}
          <InfoBlock title="Recruiter Notes">
            {architech.recruiter_notes ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {architech.recruiter_notes}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No notes available.</p>
            )}
          </InfoBlock>

          {/* FOOTER */}
          <div className="text-right mt-4">
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
