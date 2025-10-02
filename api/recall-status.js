export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "bot id is required" });

  try {
    const url = `https://us-west-2.recall.ai/api/v1/bot/${id}/`;
    const recallRes = await fetch(url, {
      headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
    });

    const data = await recallRes.json();
    return res.status(recallRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
