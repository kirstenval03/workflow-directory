import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FileUser } from "lucide-react";

export default function AIReportForm() {
  const navigate = useNavigate();

  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Insert row into Supabase
      const { data, error } = await supabase
        .from('ai_reports')
        .insert([
          {
            client_name: clientName,
            company_name: companyName,
            client_email: clientEmail,
            transcript_text: transcript,
            status: 'generating',
            report_json: null,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // 2. Trigger n8n workflow via webhook
      await fetch("https://aiarchitech.app.n8n.cloud/webhook/4eb2881a-08ec-4d1f-a4ee-a5da3b03d677", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.id, // pass the row id so n8n updates the right row
          client_name: clientName,
          company_name: companyName,
          client_email: clientEmail,
          transcript_text: transcript,
        }),
      });

      // 3. Redirect user to results page
      navigate(`/AI-report-results/${data.id}`);

    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h1 className="form-title">
          <FileUser size={56} style={{ marginRight: "8px" }} />
        </h1>
        <h2 className="form-title"> Generate AI Report </h2>
        <form onSubmit={handleSubmit} className="form-content">
          <label>
            Client Name
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </label>

          <label>
            Company Name
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </label>

          <label>
            Client Email
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Transcript
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows="8"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? '⚡ Generating...' : 'Generate Report'}
          </button>

          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}
