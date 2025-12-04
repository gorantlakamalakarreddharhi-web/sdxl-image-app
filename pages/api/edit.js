import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt } = req.body;

  // Generate new image based on edit description
  const editPrompt = `${prompt}, high quality, detailed`;
  const encodedPrompt = encodeURIComponent(editPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Edit failed");
    
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(200).json({ image: buffer.toString("base64") });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
