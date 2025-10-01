export default async function handler(req, res) {
  if (req.method === "DELETE") {
    const { id } = req.query; // bot instance id returned by /bot

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

      const data = await recallRes.json();
      res.status(recallRes.status).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
