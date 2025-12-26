/**
 * Stock Images Utility
 *
 * Fetches stock photos from Pexels API for use as blog post images.
 * Requires PEXELS_API_KEY environment variable.
 *
 * Get your free API key at: https://www.pexels.com/api/
 */

export interface StockImage {
  /** Full resolution image URL */
  url: string;
  /** Thumbnail/preview URL */
  thumbnailUrl: string;
  /** Photographer name */
  photographer: string;
  /** Link to photographer's page */
  photographerUrl: string;
  /** Source platform */
  source: "pexels" | "unsplash";
  /** Alt text/description */
  alt: string;
  /** Image ID from the source */
  id: string;
  /** Original dimensions */
  width: number;
  height: number;
  /** Average color of the image (hex) */
  avgColor?: string;
}

export interface StockImageSearchOptions {
  /** Maximum number of images to return (default: 5, max: 80) */
  limit?: number;
  /** Image orientation filter */
  orientation?: "landscape" | "portrait" | "square";
  /** Preferred image size */
  size?: "large" | "medium" | "small";
  /** Specific color to filter by (e.g., "red", "blue", "#ff0000") */
  color?: string;
  /** Locale for search (default: "en-US") */
  locale?: string;
  /** Page number for pagination (default: 1) */
  page?: number;
}

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

// Simple in-memory cache
const stockCache = new Map<string, StockImage[]>();
const cacheTimestamps = new Map<string, number>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function getCacheKey(
  query: string,
  orientation?: string,
  color?: string
): string {
  return `${query.toLowerCase().trim()}:${orientation || "all"}:${color || "any"}`;
}

function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Get the Pexels API key from environment
 */
function getPexelsApiKey(): string | null {
  // Check various environment variable sources
  if (typeof process !== "undefined" && process.env) {
    return process.env.PEXELS_API_KEY || null;
  }

  // For browser/Astro SSR environment
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.PEXELS_API_KEY || null;
  }

  return null;
}

/**
 * Transform Pexels photo to our StockImage format
 */
function transformPexelsPhoto(photo: PexelsPhoto, size: string): StockImage {
  // Choose the appropriate URL based on size preference
  let url: string;
  let thumbnailUrl: string;

  switch (size) {
    case "large":
      url = photo.src.large2x || photo.src.large;
      thumbnailUrl = photo.src.medium;
      break;
    case "small":
      url = photo.src.medium;
      thumbnailUrl = photo.src.small;
      break;
    case "medium":
    default:
      url = photo.src.large;
      thumbnailUrl = photo.src.medium;
  }

  return {
    url,
    thumbnailUrl,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    source: "pexels",
    alt: photo.alt || `Photo by ${photo.photographer}`,
    id: photo.id.toString(),
    width: photo.width,
    height: photo.height,
    avgColor: photo.avg_color,
  };
}

/**
 * Search for stock photos using Pexels API
 *
 * @param query - The search query
 * @param options - Search options
 * @returns Array of StockImage objects or empty array
 *
 * @example
 * ```typescript
 * const images = await searchStockImages("technology", {
 *   limit: 10,
 *   orientation: "landscape"
 * });
 * for (const img of images) {
 *   console.log(img.url, img.photographer);
 * }
 * ```
 */
export async function searchStockImages(
  query: string,
  options?: StockImageSearchOptions
): Promise<StockImage[]> {
  const apiKey = getPexelsApiKey();

  if (!apiKey) {
    console.warn(
      "[stockImages] PEXELS_API_KEY not found in environment. Stock image search disabled."
    );
    return [];
  }

  if (!query || query.trim().length === 0) {
    return [];
  }

  const limit = Math.min(options?.limit ?? 5, 80);
  const orientation = options?.orientation;
  const size = options?.size ?? "medium";
  const color = options?.color;
  const locale = options?.locale ?? "en-US";
  const page = options?.page ?? 1;

  // Check cache
  const cacheKey = getCacheKey(query, orientation, color);
  if (isCacheValid(cacheKey)) {
    const cached = stockCache.get(cacheKey);
    if (cached) {
      return cached.slice(0, limit);
    }
  }

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", limit.toString());
    url.searchParams.set("page", page.toString());
    url.searchParams.set("locale", locale);

    if (orientation) {
      url.searchParams.set("orientation", orientation);
    }

    if (color) {
      url.searchParams.set("color", color);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("[stockImages] Invalid Pexels API key");
      } else if (response.status === 429) {
        console.warn("[stockImages] Pexels API rate limit exceeded");
      } else {
        console.warn(
          `[stockImages] Pexels API error: ${response.status} ${response.statusText}`
        );
      }
      return [];
    }

    const data: PexelsSearchResponse = await response.json();

    if (!data.photos || !Array.isArray(data.photos)) {
      return [];
    }

    const images = data.photos.map(photo => transformPexelsPhoto(photo, size));

    // Cache results
    stockCache.set(cacheKey, images);
    cacheTimestamps.set(cacheKey, Date.now());

    return images;
  } catch (error) {
    console.warn(
      `[stockImages] Error searching for "${query}":`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * Get a single stock photo by ID from Pexels
 *
 * @param id - The Pexels photo ID
 * @returns StockImage or null
 */
export async function getStockImageById(id: string): Promise<StockImage | null> {
  const apiKey = getPexelsApiKey();

  if (!apiKey) {
    console.warn("[stockImages] PEXELS_API_KEY not found");
    return null;
  }

  try {
    const response = await fetch(`https://api.pexels.com/v1/photos/${id}`, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    const photo: PexelsPhoto = await response.json();
    return transformPexelsPhoto(photo, "medium");
  } catch {
    return null;
  }
}

/**
 * Get curated photos from Pexels (trending/featured photos)
 *
 * @param options - Search options
 * @returns Array of StockImage objects
 */
export async function getCuratedPhotos(
  options?: Pick<StockImageSearchOptions, "limit" | "page">
): Promise<StockImage[]> {
  const apiKey = getPexelsApiKey();

  if (!apiKey) {
    console.warn("[stockImages] PEXELS_API_KEY not found");
    return [];
  }

  const limit = Math.min(options?.limit ?? 5, 80);
  const page = options?.page ?? 1;

  try {
    const url = new URL("https://api.pexels.com/v1/curated");
    url.searchParams.set("per_page", limit.toString());
    url.searchParams.set("page", page.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data: PexelsSearchResponse = await response.json();

    if (!data.photos || !Array.isArray(data.photos)) {
      return [];
    }

    return data.photos.map(photo => transformPexelsPhoto(photo, "medium"));
  } catch {
    return [];
  }
}

/**
 * Search for the first matching stock photo
 *
 * @param query - The search query
 * @param orientation - Optional orientation filter
 * @returns Single StockImage or null
 */
export async function searchFirstStockImage(
  query: string,
  orientation?: "landscape" | "portrait" | "square"
): Promise<StockImage | null> {
  const results = await searchStockImages(query, { limit: 1, orientation });
  return results[0] ?? null;
}

/**
 * Generate attribution text for a stock image
 *
 * @param image - The StockImage object
 * @returns Attribution string
 */
export function generateStockAttribution(image: StockImage): string {
  const platformName = image.source === "pexels" ? "Pexels" : "Unsplash";
  return `Photo by ${image.photographer} on ${platformName}`;
}

/**
 * Generate HTML attribution link for a stock image
 *
 * @param image - The StockImage object
 * @returns HTML attribution string with links
 */
export function generateStockAttributionHtml(image: StockImage): string {
  const platformName = image.source === "pexels" ? "Pexels" : "Unsplash";
  const platformUrl =
    image.source === "pexels" ? "https://www.pexels.com" : "https://unsplash.com";

  return `Photo by <a href="${image.photographerUrl}" target="_blank" rel="noopener noreferrer">${image.photographer}</a> on <a href="${platformUrl}" target="_blank" rel="noopener noreferrer">${platformName}</a>`;
}

/**
 * Check if stock image search is available (API key configured)
 */
export function isStockSearchAvailable(): boolean {
  return Boolean(getPexelsApiKey());
}

/**
 * Clear the stock image cache
 */
export function clearStockCache(): void {
  stockCache.clear();
  cacheTimestamps.clear();
}

/**
 * Get cache statistics
 */
export function getStockCacheStats(): { size: number; keys: string[] } {
  return {
    size: stockCache.size,
    keys: Array.from(stockCache.keys()),
  };
}
