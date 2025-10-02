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
  const log = (...args) => console.log("[Recall]", ...args);

  try {
    if (!botId) throw new Error("No bot id available");
    log("Stopping bot:", botId);

    // 1) Leave call
    const stopRes = await fetch(`/api/recall-stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: botId }),
    });
    const stopBody = await stopRes.text();
    log("leave_call -> status:", stopRes.status, "body:", stopBody);
    if (!stopRes.ok) throw new Error(`leave_call failed: ${stopBody}`);

    // 2) Poll bot status until 'done'
    const maxTries = 20;   // ~60s
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    let transcriptId = null;

    for (let i = 0; i < maxTries; i++) {
      const statusRes = await fetch(`/api/recall-status?id=${botId}`);
      const statusText = await statusRes.text();
      log("bot status raw:", statusRes.status, statusText);

      let bot;
      try { bot = JSON.parse(statusText); } catch { bot = {}; }

      // show full bot JSON once to inspect structure in console
      if (i === 0) log("bot json example:", bot);

      const status = bot?.status;
      log(`poll ${i + 1}/${maxTries} -> status:`, status);

      if (status === "done") {
        // Try the expected media_shortcuts path(s)
        const recs = Array.isArray(bot.recordings) ? bot.recordings : [];
        const first = recs[0] || {};
        const ms = first.media_shortcuts || {};

        transcriptId =
          ms?.transcript?.data?.id ||
          ms?.meeting_captions?.data?.id ||
          ms?.recallai_streaming?.data?.id ||
          null;

        log("transcriptId found:", transcriptId);
        break;
      }

      await wait(3000);
    }

    if (!transcriptId) {
      log("No transcriptId available yet after polling.");
      setLiveTranscript("Transcript not available yet.");
      setTranscript("");
      return;
    }

    // 3) Fetch transcript by id
    log("Fetching transcript by id:", transcriptId);
    const tRes = await fetch(`/api/recall-transcript-by-id?tid=${transcriptId}`);
    const tText = await tRes.text();
    log("transcript fetch -> status:", tRes.status, "body:", tText);

    if (!tRes.ok) throw new Error(`transcript fetch failed: ${tText}`);

    let tData;
    try { tData = JSON.parse(tText); } catch { tData = tText; }

    // 4) Build text and display
    let text = "";
    if (Array.isArray(tData)) {
      text = tData
        .map(s => (typeof s.text === "string" ? s.text : ""))
        .filter(Boolean)
        .join(" ");
    } else if (typeof tData?.text === "string") {
      text = tData.text;
    } else if (typeof tData === "string") {
      // sometimes API returns plain text
      text = tData;
    } else {
      text = "Transcript not available.";
    }

    log("final transcript length:", text.length);
    setLiveTranscript(text);
    setTranscript(text);

  } catch (err) {
    console.error("[Recall] ERROR:", err);
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
