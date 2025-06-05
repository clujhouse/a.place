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
 * @param options.relevanceThreshold - Minimum relevance score to include an item (default: 0.5)
 * @returns Promise<T[]> - Array of reranked items in order of relevance
 */
export async function rerankWithVoyage<T>(
  client: VoyageAIClient,
  query: string,
  items: RerankableItem<T>[],
  options: RerankOptions = {},
): Promise<T[]> {
  const { model = "rerank-2", topK = 5, relevanceThreshold = 0.3 } = options;

  const itemsWithText = items.filter(
    (item) => item.text !== null && item.text.trim().length > 0,
  );

  if (itemsWithText.length === 0) {
    return [];
  }

  const documents = itemsWithText.map((item) => item.text!);

  try {
    // Use Voyage AI rerank API with a more precise model
    const rerankedResult = await client.rerank({
      query,
      documents,
      model,
      topK: Math.min(topK, documents.length),
    });

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
        .map((item) => {
          const relevantItem = itemsWithText[item.index!];
          return relevantItem?.data;
        })
        .filter((item): item is T => item !== undefined)
        .slice(0, topK); // Take only the top K items

      console.log("Final reranked items count:", rerankedItems.length);

      if (rerankedItems.length > 0) {
        return rerankedItems;
      }
    }
    console.log(rerankedResult);
    console.log(
      "No suitable reranked items found, using top items from vector search",
    );
    // If no items meet our threshold, return top items from initial vector search
    return itemsWithText.slice(0, topK).map((item) => item.data);
  } catch (error) {
    console.error("Reranking failed, using original order:", error);
    // Fallback to original items if reranking fails
    return itemsWithText.slice(0, topK).map((item) => item.data);
  }
}
