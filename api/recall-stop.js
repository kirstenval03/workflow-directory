// api/recall-stop.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "bot id is required" });

  try {
    const region = process.env.RECALL_REGION || "us-west-2";
    const url = `https://${region}.recall.ai/api/v1/bot/${id}/leave_call/`;

    const recallRes = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Token ${process.env.RECALL_API_KEY}` 
      }
    });

    if (!recallRes.ok) {
      const text = await recallRes.text();
      return res.status(recallRes.status).send(text);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
