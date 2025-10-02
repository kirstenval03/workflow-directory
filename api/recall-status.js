// api/recall-status.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "bot id is required" });

  try {
    const region = process.env.RECALL_REGION || "us-west-2";
    const url = `https://${region}.recall.ai/api/v1/bot/${id}/`;

    const recallRes = await fetch(url, {
      headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
    });

    if (!recallRes.ok) {
      const text = await recallRes.text();
      return res.status(recallRes.status).send(text);
    }

    const data = await recallRes.json();

    // Look for transcript download URL
    const transcriptObj =
      data.recordings?.[0]?.media_shortcuts?.transcript;

    if (!transcriptObj) {
      return res.status(200).json({ ready: false });
    }

    // Fetch the actual transcript JSON
    const transcriptRes = await fetch(transcriptObj.data.download_url);
    const transcript = await transcriptRes.json();

    return res.status(200).json({ ready: true, transcript });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
