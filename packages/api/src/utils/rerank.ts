import type { VoyageAIClient } from "voyageai";

interface RerankableItem<T> {
  text: string | null;
  data: T;
}

interface RerankOptions {
  model?: string;
  topK?: number;
  relevanceThreshold?: number;
}

/**
 * Reranks items using Voyage AI based on relevance to a query
 * @param client - VoyageAI client instance
 * @param query - The search query to rank against
 * @param items - Array of items with text content to rank
 * @param options - Optional configuration for the reranking
 * @param options.model - The rerank model to use (default: "rerank-2-lite")
 * @param options.topK - Maximum number of items to return (default: 5)
 * @param options.relevanceThreshold - Minimum relevance score to include an item (default: 0)
 * @returns Promise<T[]> - Array of reranked items in order of relevance
 */
export async function rerankWithVoyage<T>(
  client: VoyageAIClient,
  query: string,
  items: RerankableItem<T>[],
  options: RerankOptions = {},
): Promise<T[]> {
  const { model = "rerank-2-lite", topK = 5, relevanceThreshold = 0 } = options;

  // Filter out items with null text
  const itemsWithText = items.filter((item) => item.text !== null);

  if (itemsWithText.length === 0) {
    return [];
  }

  const documents = itemsWithText.map((item) => item.text!);

  try {
    // Use Voyage AI rerank API
    const rerankedResult = await client.rerank({
      query,
      documents,
      model,
      topK: Math.min(topK, documents.length),
    });

    console.log(rerankedResult);
    // Reorder items based on rerank scores
    if (rerankedResult.data && rerankedResult.data.length > 0) {
      const rerankedItems = rerankedResult.data
        .filter(
          (item) =>
            item.relevanceScore !== undefined &&
            item.index !== undefined &&
            item.index < itemsWithText.length &&
            (item.relevanceScore ?? 0) >= relevanceThreshold,
        )
        .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
        .map((item) => itemsWithText[item.index!]?.data)
        .filter((item): item is T => item !== undefined);

      return rerankedItems;
    }

    // Fallback to original order if reranking data is empty
    return itemsWithText.slice(0, topK).map((item) => item.data);
  } catch (error) {
    console.error("Reranking failed, using original order:", error);
    // Fallback to original items if reranking fails
    return itemsWithText.slice(0, topK).map((item) => item.data);
  }
}
