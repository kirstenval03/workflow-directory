export default async function handler(req, res) {
  if (req.method === "POST") {
    const { meetingUrl } = req.body;

    try {
      const recallRes = await fetch("https://api.recall.ai/v1/recordings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RECALL_API_KEY}`, // stored in Vercel
        },
        body: JSON.stringify({
          meeting_url: meetingUrl,
          transcription: true,
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
