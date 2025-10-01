export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "bot id is required" });

  try {
    const recallRes = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${process.env.RECALL_API_KEY}`,
      },
    });

    if (recallRes.status === 204) {
      return res.status(200).json({ success: true });
    }

    const text = await recallRes.text();
    return res.status(recallRes.status).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
