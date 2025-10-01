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

  // recall.ai state
  const [botId, setBotId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const handleStart = async () => {
    try {
      const meetingUrl = prompt("Enter the meeting URL (Zoom/Meet/Teams):");
      if (!meetingUrl) return;

      const res = await fetch("/api/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingUrl }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to start recording");

      // store bot instance id
      setBotId(data.id);
      setIsRecording(true);
      setLiveTranscript("Bot is joining the meeting and recording...");
    } catch (err) {
      console.error(err);
      setError("Failed to start recording.");
    }
  };

  const handleStop = async () => {
  try {
    if (!botId) throw new Error("No bot id available");

    // Ask our API to remove bot from the call
    const stopRes = await fetch(`/api/recall-stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: botId }),
    });
    if (!stopRes.ok) {
      const t = await stopRes.text();
      throw new Error(t || "Failed to stop bot");
    }

    // Poll transcript until it's ready (or give up)
    const maxTries = 20;        // ~36s total if interval=3s
    const intervalMs = 4000;

    let finalText = "";
    for (let i = 0; i < maxTries; i++) {
      const resp = await fetch(`/api/recall-transcript?id=${botId}`);
      const bodyText = await resp.text();
      if (resp.ok) {
        let data;
        try { data = JSON.parse(bodyText); } catch { data = bodyText; }

        if (Array.isArray(data)) {
          const joined = data
            .map(s => (typeof s.text === "string" ? s.text : ""))
            .filter(Boolean)
            .join(" ");
          if (joined.length > 0) { finalText = joined; break; }
        } else if (data && typeof data.text === "string" && data.text.length) {
          finalText = data.text;
          break;
        }
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }

    if (!finalText) finalText = "Transcript not available yet. Try again in a moment.";

    setLiveTranscript(finalText);
    setTranscript(finalText);
  } catch (err) {
    console.error(err);
    setError("Failed to stop bot / fetch transcript.");
  } finally {
    setIsRecording(false);
    setBotId(null);
  }
};


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
          id: data.id,
          client_name: clientName,
          company_name: companyName,
          client_email: clientEmail,
          transcript_text: transcript,
        }),
      });

      // 3. Redirect to results page
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

          {/* ===== Recall.ai Recorder Section ===== */}
          <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
            <h3>Or Generate Transcript with Recall.ai</h3>
            {!isRecording ? (
              <button type="button" onClick={handleStart}>▶️ Start Recording</button>
            ) : (
              <button type="button" onClick={handleStop}>⏹ Stop Recording</button>
            )}

            {liveTranscript && (
              <div style={{ marginTop: "1rem" }}>
                <h4>Live Transcript</h4>
                <textarea
                  value={liveTranscript}
                  readOnly
                  rows="6"
                  style={{ width: "100%", fontSize: "0.9rem" }}
                />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
            {loading ? '⚡ Generating...' : 'Generate Report'}
          </button>

          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}
