import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt, imageBase64, editType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  try {
    console.log("Edit type:", editType);
    console.log("Prompt:", prompt);
    
    let result;

    if (editType === "remove-background") {
      result = await fal.subscribe("fal-ai/birefnet", {
        input: { 
          image_url: imageBase64 
        },
      });
      console.log("Remove BG result:", result);
    } else {
      // Use FLUX schnell for editing
      result = await fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt: prompt,
          image_url: imageBase64,
          num_inference_steps: 4,
        },
      });
      console.log("Edit result:", result);
    }

    // Handle different response structures
    let imageUrl;
    if (result.image?.url) {
      imageUrl = result.image.url;
    } else if (result.images?.[0]?.url) {
      imageUrl = result.images[0].url;
    } else if (result.data?.image?.url) {
      imageUrl = result.data.image.url;
    } else if (result.data?.images?.[0]?.url) {
      imageUrl = result.data.images[0].url;
    } else {
      console.error("Full result:", JSON.stringify(result, null, 2));
      throw new Error("No image URL in response");
    }

    console.log("Image URL:", imageUrl);

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch result image");
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    res.status(200).json({ image: buffer.toString("base64") });
    
  } catch (error) {
    console.error("Edit error:", error);
    res.status(500).json({ error: error.message || "Edit failed" });
  }
}
