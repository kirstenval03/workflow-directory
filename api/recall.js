// api/recall.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { meetingUrl } = req.body;
  if (!meetingUrl) {
    return res.status(400).json({ error: "meetingUrl is required" });
  }

  try {
    const region = process.env.RECALL_REGION || "us-west-2";
    const url = `https://${region}.recall.ai/api/v1/bot/`;

    const recallRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.RECALL_API_KEY}`,
      },
      body: JSON.stringify({
        meeting_url: meetingUrl,
        bot_name: "AI-Architechs Bot",
        recording_config: {
          transcript: {
            // 👇 provider required, "meeting_captions" is fine for Zoom
            provider: { meeting_captions: {} }
          }
        }
      }),
    });

    const data = await recallRes.json();
    if (!recallRes.ok) {
      return res.status(recallRes.status).json(data);
    }

    // Return parsed JSON instead of raw text
    return res.status(200).json(data); 
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
