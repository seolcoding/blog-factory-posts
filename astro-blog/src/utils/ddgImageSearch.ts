/**
 * DuckDuckGo Image Search Utility
 *
 * Searches for images using the unofficial DuckDuckGo image search API.
 * Note: This uses an unofficial API endpoint and may break if DDG changes their API.
 */

export interface DDGImage {
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  width: number;
  height: number;
}

export interface DDGSearchOptions {
  /** Maximum number of images to return (default: 5) */
  limit?: number;
  /** Enable safe search filtering (default: true) */
  safeSearch?: boolean;
}

interface DDGImageResult {
  image: string;
  thumbnail: string;
  title: string;
  source: string;
  width: number;
  height: number;
}

interface DDGImageResponse {
  results?: DDGImageResult[];
}

// Simple in-memory cache
const searchCache = new Map<string, DDGImage[]>();
const cacheTimestamps = new Map<string, number>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

function getCacheKey(query: string, safeSearch: boolean): string {
  return `${safeSearch ? "safe" : "unsafe"}:${query.toLowerCase().trim()}`;
}

function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Extract the vqd token from DuckDuckGo search page
 * This token is required for subsequent image search requests
 */
async function getVqdToken(query: string): Promise<string | null> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://duckduckgo.com/?q=${encodedQuery}&iar=images&iax=images&ia=images`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Try multiple patterns to extract vqd token
    const patterns = [
      /vqd=["']?([^"'&]+)/,
      /vqd%3D([^&"']+)/,
      /vqd=(\d+-\d+-\d+)/,
      /"vqd":"([^"]+)"/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Search for images using DuckDuckGo
 *
 * @param query - The search query
 * @param options - Search options
 * @returns Array of DDGImage objects or empty array on failure
 *
 * @example
 * ```typescript
 * const images = await searchImages("cute cats", { limit: 10 });
 * for (const img of images) {
 *   console.log(img.url, img.title);
 * }
 * ```
 */
export async function searchImages(
  query: string,
  options?: DDGSearchOptions
): Promise<DDGImage[]> {
  const limit = options?.limit ?? 5;
  const safeSearch = options?.safeSearch ?? true;

  if (!query || query.trim().length === 0) {
    return [];
  }

  // Check cache
  const cacheKey = getCacheKey(query, safeSearch);
  if (isCacheValid(cacheKey)) {
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return cached.slice(0, limit);
    }
  }

  try {
    // Step 1: Get the vqd token
    const vqdToken = await getVqdToken(query);
    if (!vqdToken) {
      console.warn(`[ddgImageSearch] Failed to get vqd token for query: ${query}`);
      return [];
    }

    // Step 2: Fetch images using the token
    const encodedQuery = encodeURIComponent(query);
    const safeSearchParam = safeSearch ? "1" : "-1";

    const imageUrl = new URL("https://duckduckgo.com/i.js");
    imageUrl.searchParams.set("l", "us-en");
    imageUrl.searchParams.set("o", "json");
    imageUrl.searchParams.set("q", query);
    imageUrl.searchParams.set("vqd", vqdToken);
    imageUrl.searchParams.set("f", ",,,,,");
    imageUrl.searchParams.set("p", safeSearchParam);

    const response = await fetch(imageUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: `https://duckduckgo.com/?q=${encodedQuery}&iar=images&iax=images&ia=images`,
      },
    });

    if (!response.ok) {
      console.warn(
        `[ddgImageSearch] Failed to fetch images: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data: DDGImageResponse = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // Transform results to our format
    const images: DDGImage[] = data.results
      .filter(
        (result): result is DDGImageResult =>
          Boolean(result.image) && Boolean(result.thumbnail)
      )
      .map(result => ({
        url: result.image,
        thumbnailUrl: result.thumbnail,
        title: result.title || "",
        source: result.source || "",
        width: result.width || 0,
        height: result.height || 0,
      }));

    // Cache all results (not just limited)
    searchCache.set(cacheKey, images);
    cacheTimestamps.set(cacheKey, Date.now());

    return images.slice(0, limit);
  } catch (error) {
    console.warn(
      `[ddgImageSearch] Error searching for "${query}":`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * Search for images and return only the first result
 *
 * @param query - The search query
 * @param safeSearch - Enable safe search (default: true)
 * @returns Single DDGImage or null
 */
export async function searchFirstImage(
  query: string,
  safeSearch = true
): Promise<DDGImage | null> {
  const results = await searchImages(query, { limit: 1, safeSearch });
  return results[0] ?? null;
}

/**
 * Clear the search cache
 */
export function clearDDGCache(): void {
  searchCache.clear();
  cacheTimestamps.clear();
}

/**
 * Get cache statistics
 */
export function getDDGCacheStats(): { size: number; keys: string[] } {
  return {
    size: searchCache.size,
    keys: Array.from(searchCache.keys()),
  };
}
