import { VoyageAIClient } from "voyageai";

export async function createProfileEmbedding(profileText: string) {
  const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  const embedding = await client.embed({
    input: [profileText],
    model: "voyage-3-large",
  });

  const embeddingData = embedding.data?.[0]?.embedding;
  if (!embeddingData) {
    throw new Error("Failed to embed profile text");
  }

  return Buffer.from(new Float32Array(embeddingData).buffer);
}
