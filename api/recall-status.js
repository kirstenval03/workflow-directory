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

    const text = await recallRes.text();
    // Surface exact response so we can see what's happening
    res.status(recallRes.status).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
