export default async function handler(req, res) {
  if (req.method === "POST") {
    const { meetingUrl } = req.body;

    try {
      const recallRes = await fetch("https://us-west-2.recall.ai/api/v1/bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.RECALL_API_KEY}`, // NOTE: Token, not Bearer
        },
        body: JSON.stringify({
          meeting_url: meetingUrl,
          recording_config: {
            transcript: { provider: "assemblyai" } // You can pick "assemblyai", "deepgram", etc.
          },
          recallai_streaming: {
            mode: "prioritize_low_latency",
            language_code: "en"
          }
        }),
      });

      const data = await recallRes.json();

      if (!recallRes.ok) {
        return res.status(recallRes.status).json({ error: data });
      }

      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
