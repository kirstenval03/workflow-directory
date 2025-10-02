export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { tid } = req.query;
  if (!tid) return res.status(400).json({ error: "transcript id is required" });

  try {
    const region = process.env.RECALL_REGION || "us-west-2";
    const url = `https://${region}.recall.ai/api/v1/transcript/${tid}/`;

    const recallRes = await fetch(url, {
      headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
    });

    const text = await recallRes.text();
    res.status(recallRes.status).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
