export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { meetingUrl } = req.body;
  if (!meetingUrl) return res.status(400).json({ error: "meetingUrl is required" });

  try {
    const recallRes = await fetch("https://us-west-2.recall.ai/api/v1/bot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // NOTE: must be "Token"
        Authorization: `Token ${process.env.RECALL_API_KEY}`,
      },
      body: JSON.stringify({
        meeting_url: meetingUrl,
        bot_name: "AI-Architechs Bot",
        recording_config: {
          transcript: {
            provider: { meeting_captions: {} } // 👈 transcript provider
          }
        }
      }),
    });

    const text = await recallRes.text();
    if (!recallRes.ok) {
      return res.status(recallRes.status).send(text);
    }

    return res.status(200).send(text); // JSON string with { id, meeting_url, status }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
