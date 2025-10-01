export default async function handler(req, res) {
  if (req.method === "DELETE") {
    const { id } = req.query;

    try {
      const recallRes = await fetch(`https://api.recall.ai/v1/recordings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.RECALL_API_KEY}`,
        },
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
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
