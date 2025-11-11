import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import JobCard from '../Components/JobCard';
import { Briefcase, ShieldCheck, Globe } from 'lucide-react';
import ApplicationModal from '../Components/ApplicationModal';


export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .gt('closing_date', new Date().toISOString())
        .order('closing_date', { ascending: true });

      if (error) {
        console.error('Error fetching jobs:', error);
      } else {
        setJobs(data);
      }

      setLoading(false);
    };

    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white px-6 pb-20">
      {/* Hero */}
      <div className="max-w-5xl mx-auto pt-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Find Your Next AI Expert Opportunity</h1>
        <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
          As part of the AI-Architechs network, you get direct access to remote roles with US companies who are ready to integrate AI.
        </p>

        {/* Features */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mb-10">
          <Feature
            Icon={Briefcase}
            title="Premium Positions"
            desc="High-impact roles with US businesses ready to integrate AI."
          />
          <Feature
            Icon={ShieldCheck}
            title="Exclusive Access"
            desc="Only available to vetted AI Architechs."
          />
          <Feature
            Icon={Globe}
            title="100% Remote"
            desc="Work from anywhere in the world."
          />
        </div>
      </div>

      {/* Jobs Section */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Open Positions</h2>
          <span className="text-sm text-gray-400">All positions close at 11:59pm PT</span>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-400">No active positions right now.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
            ))}
            </div>
        )}
      </div>
    </div>
  );
}

// 🔹 Feature component for Hero Section
function Feature({ Icon, title, desc }) {
  return (
    <div className="bg-[#1e293b] p-5 rounded-lg shadow w-full max-w-xs text-center flex flex-col items-center gap-2">
      <Icon className="w-8 h-8 text-blue-400 mb-1" />
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}
