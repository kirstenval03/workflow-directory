export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query || {};
  if (!id) return res.status(400).json({ error: "bot id is required" });

  try {
    const region = process.env.RECALL_REGION || "us-west-2";
    const url = `https://${region}.recall.ai/api/v1/bot/${id}/transcript/`;

    const recallRes = await fetch(url, {
      headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
    });

    const text = await recallRes.text();
    if (!recallRes.ok) return res.status(recallRes.status).send(text);

    try { return res.status(200).json(JSON.parse(text)); }
    catch { return res.status(200).send(text); }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
