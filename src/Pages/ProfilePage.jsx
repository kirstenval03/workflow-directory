import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ProfilePage() {
  const { id } = useParams();
  const [architech, setArchitech] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from("qualified_architechs")
        .select("full_name, headshot_url, ai_profile_copy, hourly_rate, country, video_url")
        .eq("id", id)
        .single();

      if (error) console.error("Error fetching profile:", error);
      else setArchitech(data);
    }
    fetchProfile();
  }, [id]);

  if (!architech) return <div className="p-10 text-center text-gray-400">Loading profile...</div>;

  const copy = architech.ai_profile_copy || {};

  return (
    <div className="min-h-screen bg-[#01014C] text-white flex justify-center py-10">
      <div className="w-full max-w-6xl bg-[#FFFDFB] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* LEFT COLUMN */}
        <aside className="md:w-1/3 bg-gradient-to-b from-[#01014C] via-[#0B0B8C] to-[#36D1FF] p-8 flex flex-col items-center text-center">
          <img
            src={architech.headshot_url || "/placeholder-avatar.png"}
            alt={architech.full_name}
            className="w-36 h-36 rounded-full object-cover border-4 border-[#36D1FF] shadow-lg mb-4"
          />
          <h1 className="text-2xl font-semibold mb-1 text-[#FFFDFB]">{architech.full_name}</h1>
          <p className="text-[#B3E9FF] mb-4">AI Architect</p>

          {architech.hourly_rate && (
            <div className="text-sm bg-[#36D1FF]/10 border border-[#36D1FF]/50 text-[#36D1FF] px-4 py-2 rounded-lg mb-4">
              ${architech.hourly_rate} / hr
            </div>
          )}

          <div className="bg-[#36D1FF]/5 border border-[#36D1FF]/20 p-4 rounded-xl text-sm text-[#E0F7FF] mb-6 leading-relaxed">
            {copy.personality ||
              "Methodical and innovative problem-solver focused on practical AI automation design."}
          </div>

          {/* TECH SKILLS */}
          {copy.tech_skills && (
            <div className="w-full mb-6 text-left">
              <h3 className="text-sm font-semibold mb-2 text-[#B3E9FF] uppercase tracking-wide">
                Tech Stack
              </h3>
              {copy.tech_skills.map((group, i) => (
                <div key={i} className="mb-3">
                  <p className="text-xs text-[#E0F7FF]/80 mb-1">{group.category}</p>
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

          {/* CTA BUTTONS */}
          <div className="flex flex-col gap-3 w-full mt-auto">
            {architech.video_url && (
              <a
                href={architech.video_url}
                target="_blank"
                rel="noreferrer"
                className="w-full text-center bg-[#36D1FF] text-[#01014C] font-semibold py-2 rounded-lg hover:bg-[#5FE2FF] transition-all"
              >
                🎥 Watch Intro Video
              </a>
            )}

          </div>
        </aside>

        {/* RIGHT COLUMN */}
        <main className="flex-1 p-10 text-[#01014C] space-y-10">
          {/* About Section */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-[#36D1FF]/40 pb-1">
              About the AI Architech
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {copy.about_architech}
            </p>
          </section>

          {/* Skills & AI Knowledge */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-[#36D1FF]/40 pb-1">
              Skills & AI Knowledge
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {copy.skills_ai_knowledge?.map((skill, i) => (
                <div
                  key={i}
                  className="bg-[#FFFDFB] border border-[#36D1FF]/30 rounded-xl p-5 hover:border-[#36D1FF]/60 hover:shadow-[0_0_10px_#36D1FF40] transition-all"
                >
                  <p className="font-semibold text-[#01014C] mb-1">{skill.headline}</p>
                  <p className="text-gray-700 text-sm">{skill.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Experience */}
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-[#36D1FF]/40 pb-1">
              Previous Experience
            </h2>
            <div className="space-y-6">
              {copy.previous_experience?.map((exp, i) => (
                <div
                  key={i}
                  className="bg-[#FFFDFB] border border-[#36D1FF]/30 rounded-xl p-5 hover:border-[#36D1FF]/60 hover:shadow-[0_0_10px_#36D1FF40] transition-all"
                >
                  <p className="font-semibold text-[#EB5D2A] mb-2">{exp.headline}</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    {exp.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
