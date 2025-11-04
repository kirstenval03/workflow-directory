import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FiMapPin } from "react-icons/fi";
import Logo from "../styles/Black-SVG-Landscape.svg";

export default function ClientProfilePage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [architech, setArchitech] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Step 1: Get application info
        const { data: appData, error: appError } = await supabase
          .from("applications")
          .select("id, bid_rate, qualified_architech_id")
          .eq("id", applicationId)
          .single();

        if (appError) throw appError;
        setApplication(appData);

        // Step 2: Get architech info
        const { data: archData, error: archError } = await supabase
          .from("qualified_architechs")
          .select(
            "full_name, headshot_url, loom_video_link, availability, current_location, ai_profile_copy"
          )
          .eq("id", appData.qualified_architech_id)
          .single();

        if (archError) throw archError;
        setArchitech(archData);
      } catch (err) {
        console.error("Error fetching client profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [applicationId]);

  if (loading)
    return (
      <div className="p-10 text-center text-[#36D1FF]">Loading profile...</div>
    );
  if (!architech)
    return (
      <div className="p-10 text-center text-red-400">Profile not found</div>
    );

  // Only show first name
  const firstName = architech.full_name?.split(" ")[0] || "AI Architect";
  const copy = architech.ai_profile_copy || {};

  return (
    <div className="min-h-screen bg-[#01014C] text-white flex justify-center py-10 px-4">
      <div className="w-full max-w-6xl bg-[#FFFDFB] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">

        {/* LEFT COLUMN */}
        <aside className="relative md:w-1/3 bg-gradient-to-b from-[#01014C] via-[#0A0A80] to-[#36D1FF] p-8 flex flex-col items-center text-center overflow-hidden">
          {/* Top overlay */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#36D1FF]/30 to-transparent"></div>

          {/* Avatar */}
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-[#36D1FF]/20 blur-2xl"></div>
            <img
              src={architech.headshot_url || "/placeholder-avatar.png"}
              alt={firstName}
              className="relative w-36 h-36 rounded-full object-cover border-4 border-[#36D1FF] shadow-lg"
            />
          </div>

          {/* Name */}
          <h1 className="text-2xl font-semibold mb-1 text-[#FFFDFB]">
            {firstName}
          </h1>

          {/* Location */}
          {architech.current_location && (
            <div className="flex items-center gap-2 text-[#E0F7FF] text-sm mb-6 opacity-90">
              <FiMapPin className="text-[#36D1FF]" />
              <span className="capitalize">{architech.current_location}</span>
            </div>
          )}

          {/* Hourly Rate */}
          <div className="bg-[#01014C] border border-[#36D1FF]/50 rounded-xl p-4 w-full text-left mb-4 shadow-[0_0_10px_#36D1FF20]">
            <p className="text-[#B3E9FF] text-sm font-semibold uppercase tracking-wide mb-1">
              Hourly Rate
            </p>
            <p className="text-[#36D1FF] text-lg font-bold">
              ${application?.bid_rate}{" "}
              <span className="text-sm text-[#B3E9FF]">USD/hr</span>
            </p>
          </div>

          {/* Availability */}
          {architech.availability && (
            <div className="bg-[#01014C] border border-[#36D1FF]/30 rounded-xl p-4 w-full text-left mb-6">
              <p className="text-[#E0F7FF] text-sm leading-relaxed">
                {architech.availability?.toLowerCase() === "immediately" ? (
                  <>
                    Ready to start{" "}
                    <span className="font-semibold text-[#36D1FF]">
                      immediately
                    </span>.
                  </>
                ) : (
                  <>
                    Ready to start with a{" "}
                    <span className="font-semibold text-[#36D1FF]">
                      {architech.availability}
                    </span>{" "}
                    notice.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Personality */}
          {copy.personality && (
            <div className="bg-[#36D1FF]/5 border border-[#36D1FF]/20 p-4 rounded-xl text-sm text-[#E0F7FF] mb-6 leading-relaxed">
              {copy.personality}
            </div>
          )}

          {/* Tech Stack */}
          {copy.tech_skills && (
            <div className="w-full mb-6 text-left">
              <h3 className="text-sm font-semibold mb-2 text-[#B3E9FF] uppercase tracking-wide">
                Tech Stack
              </h3>
              {copy.tech_skills.map((group, i) => (
                <div key={i} className="mb-3">
                  <p className="text-xs text-[#E0F7FF]/80 mb-1">
                    {group.category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.tools.map((tool, j) => (
                      <span
                        key={j}
                        className="bg-[#36D1FF]/10 text-[#36D1FF] text-xs px-2 py-1 rounded-full border border-[#36D1FF]/30"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Watch Video */}
          {architech.loom_video_link && (
            <div className="w-full mt-8">
              <a
                href={architech.loom_video_link}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center font-semibold py-3 rounded-lg
                           bg-[#36D1FF] text-[#01014C] 
                           hover:bg-[#5FE2FF] hover:shadow-[0_0_20px_#36D1FF80] 
                           transition-all duration-300 ease-out"
              >
                🎥 Watch a Video from {firstName}
              </a>
            </div>
          )}

          {/* Logo always visible */}
          <div className="w-full mt-8 flex justify-center">
            <img
              src={Logo}
              alt="AI-Architechs Logo"
              className="w-42 opacity-80 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        </aside>

        {/* RIGHT COLUMN */}
        <main className="flex-1 p-10 text-[#01014C] space-y-10">
          {/* About */}
          <section className="border-b border-[#36D1FF]/20 pb-8 mb-8">
            <h2 className="text-xl font-semibold mb-3 border-b border-[#36D1FF]/40 pb-1">
              About this AI Architech
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {copy.about_architech}
            </p>
          </section>

          {/* Skills & AI Knowledge */}
          {copy.skills_ai_knowledge && (
            <section className="border-b border-[#36D1FF]/20 pb-8 mb-8">
              <h2 className="text-xl font-semibold mb-3 border-b border-[#36D1FF]/40 pb-1">
                Skills & AI Knowledge
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {copy.skills_ai_knowledge.map((skill, i) => (
                  <div
                    key={i}
                    className="bg-[#FFFDFB] border border-[#36D1FF]/30 rounded-xl p-5 hover:border-[#36D1FF]/60 hover:shadow-[0_0_10px_#36D1FF40] transition-all"
                  >
                    <p className="font-semibold text-[#01014C] mb-1">
                      {skill.headline}
                    </p>
                    <p className="text-gray-700 text-sm">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Previous Experience */}
          {copy.previous_experience && (
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-[#36D1FF]/40 pb-1">
                Previous Experience
              </h2>
              <div className="space-y-6">
                {copy.previous_experience.map((exp, i) => (
                  <div
                    key={i}
                    className="bg-[#FFFDFB] border border-[#36D1FF]/30 rounded-xl p-5 hover:border-[#36D1FF]/60 hover:shadow-[0_0_10px_#36D1FF40] transition-all"
                  >
                    <p className="font-semibold text-[#EB5D2A] mb-2">
                      {exp.headline}
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                      {exp.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
