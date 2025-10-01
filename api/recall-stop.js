export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "bot id is required" });

  try {
    const region = process.env.RECALL_REGION || "us-west-2";
    const url = `https://${region}.recall.ai/api/v1/bot/${id}/leave_call/`; // <- POST leave_call

    const recallRes = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
    });

    // Some versions return 204 No Content
    if (recallRes.status === 204) return res.status(200).json({ success: true });

    const text = await recallRes.text();
    if (!recallRes.ok) return res.status(recallRes.status).send(text);

    // If Recall returns JSON body, pass it through
    try { return res.status(200).json(JSON.parse(text)); }
    catch { return res.status(200).send(text); }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
