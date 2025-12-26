/**
 * Unified Image Fetcher
 *
 * Smart image fetcher that combines multiple sources:
 * - Wikipedia/Wikidata (for known entities like people, companies, countries)
 * - Open Graph parsing (for article thumbnails)
 * - DuckDuckGo Image Search (for general images)
 * - Pexels Stock Photos (for high-quality fallback images)
 */

import {
  getEntityImage,
  type EntityImage,
  generatePlainAttribution,
} from "./entityImage";
import { searchImages as ddgSearch, type DDGImage } from "./ddgImageSearch";
import { parseOG, type OGData } from "./ogParser";
import {
  searchStockImages,
  generateStockAttribution,
  type StockImage,
} from "./stockImages";

export type ImageSource = "wikipedia" | "ddg" | "og" | "pexels" | "auto";

export interface UnifiedImage {
  /** Full resolution image URL */
  url: string;
  /** Thumbnail/preview URL */
  thumbnailUrl: string;
  /** Attribution text (photographer, license, etc.) */
  attribution: string;
  /** Which source the image came from */
  source: ImageSource;
  /** Image title or description */
  title?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Original width (if known) */
  width?: number;
  /** Original height (if known) */
  height?: number;
}

export interface UnifiedImageOptions {
  /** Which sources to try, in order (default: ['wikipedia', 'ddg', 'pexels']) */
  sources?: ImageSource[];
  /** Preferred source to try first (takes precedence over sources order) */
  preferredSource?: ImageSource;
  /** Article URL for OG parsing (if provided, OG is tried first) */
  articleUrl?: string;
  /** Thumbnail size in pixels (default: 400) */
  thumbSize?: number;
  /** Preferred language for Wikipedia (default: 'en') */
  preferredLanguage?: "en" | "ko";
  /** Enable safe search for DDG (default: true) */
  safeSearch?: boolean;
  /** Image orientation preference for stock photos */
  orientation?: "landscape" | "portrait" | "square";
}

// Entity type detection patterns
const ENTITY_PATTERNS = {
  // Common name patterns (capitalized words)
  person: /^[A-Z][a-z]+ [A-Z][a-z]+$/,
  // Company suffixes
  company: /\b(Inc\.?|Corp\.?|Ltd\.?|LLC|GmbH|Co\.?|Company|Corporation|Group)$/i,
  // Country names are typically just capitalized words
  country: /^[A-Z][a-z]+$/,
  // Known tech companies
  techCompany: /^(Apple|Google|Microsoft|Amazon|Meta|Facebook|Netflix|Tesla|Samsung|Sony|Intel|AMD|NVIDIA|IBM)$/i,
  // Known people patterns (CEO of, founder of, etc.)
  knownPerson: /(Elon Musk|Tim Cook|Satya Nadella|Mark Zuckerberg|Jeff Bezos|Bill Gates|Steve Jobs)/i,
};

/**
 * Detect if a query is likely a known entity (person, company, country)
 * that would have a Wikipedia page
 */
function isLikelyEntity(query: string): boolean {
  const trimmed = query.trim();

  // Check against known patterns
  if (ENTITY_PATTERNS.knownPerson.test(trimmed)) return true;
  if (ENTITY_PATTERNS.techCompany.test(trimmed)) return true;
  if (ENTITY_PATTERNS.company.test(trimmed)) return true;
  if (ENTITY_PATTERNS.person.test(trimmed)) return true;

  // If it's 2-3 capitalized words, likely an entity
  const words = trimmed.split(/\s+/);
  if (words.length >= 2 && words.length <= 4) {
    const allCapitalized = words.every(
      word => /^[A-Z][a-z]*$/.test(word) || /^[A-Z]+$/.test(word)
    );
    if (allCapitalized) return true;
  }

  return false;
}

/**
 * Transform EntityImage to UnifiedImage
 */
function fromEntityImage(entity: EntityImage): UnifiedImage {
  return {
    url: entity.imageUrl || entity.thumbnailUrl || "",
    thumbnailUrl: entity.thumbnailUrl || entity.imageUrl || "",
    attribution: generatePlainAttribution(entity),
    source: "wikipedia",
    title: entity.entityName,
    alt: entity.imageDescription || entity.entityName,
  };
}

/**
 * Transform DDGImage to UnifiedImage
 */
function fromDDGImage(ddg: DDGImage): UnifiedImage {
  return {
    url: ddg.url,
    thumbnailUrl: ddg.thumbnailUrl,
    attribution: `Image from ${ddg.source || "DuckDuckGo"}`,
    source: "ddg",
    title: ddg.title,
    alt: ddg.title || "Image",
    width: ddg.width,
    height: ddg.height,
  };
}

/**
 * Transform OGData to UnifiedImage
 */
function fromOGData(og: OGData): UnifiedImage | null {
  if (!og.image) return null;

  return {
    url: og.image,
    thumbnailUrl: og.image,
    attribution: og.siteName ? `Image from ${og.siteName}` : "Article image",
    source: "og",
    title: og.title || undefined,
    alt: og.imageAlt || og.title || "Article image",
  };
}

/**
 * Transform StockImage to UnifiedImage
 */
function fromStockImage(stock: StockImage): UnifiedImage {
  return {
    url: stock.url,
    thumbnailUrl: stock.thumbnailUrl,
    attribution: generateStockAttribution(stock),
    source: "pexels",
    title: stock.alt,
    alt: stock.alt,
    width: stock.width,
    height: stock.height,
  };
}

/**
 * Fetch image from a specific source
 */
async function fetchFromSource(
  source: ImageSource,
  query: string,
  options: UnifiedImageOptions
): Promise<UnifiedImage | null> {
  try {
    switch (source) {
      case "og": {
        if (!options.articleUrl) return null;
        const og = await parseOG(options.articleUrl);
        return og ? fromOGData(og) : null;
      }

      case "wikipedia": {
        const entity = await getEntityImage(query, {
          thumbSize: options.thumbSize ?? 400,
          preferredLanguage: options.preferredLanguage ?? "en",
        });
        return entity && entity.thumbnailUrl ? fromEntityImage(entity) : null;
      }

      case "ddg": {
        const ddgResults = await ddgSearch(query, {
          limit: 1,
          safeSearch: options.safeSearch ?? true,
        });
        return ddgResults[0] ? fromDDGImage(ddgResults[0]) : null;
      }

      case "pexels": {
        const stockResults = await searchStockImages(query, {
          limit: 1,
          orientation: options.orientation,
        });
        return stockResults[0] ? fromStockImage(stockResults[0]) : null;
      }

      case "auto":
        // Auto mode is handled in the main function
        return null;

      default:
        return null;
    }
  } catch (error) {
    console.warn(
      `[unifiedImageFetcher] Error fetching from ${source}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Smart image fetcher that tries multiple sources intelligently
 *
 * @param query - Search query or entity name
 * @param options - Fetch options
 * @returns UnifiedImage or null if no image found
 *
 * @example
 * ```typescript
 * // Simple entity lookup
 * const img = await fetchImage("Elon Musk");
 *
 * // With article URL for OG parsing
 * const img = await fetchImage("AI News", {
 *   articleUrl: "https://example.com/article"
 * });
 *
 * // Custom source order
 * const img = await fetchImage("technology", {
 *   sources: ['pexels', 'ddg'],
 *   orientation: 'landscape'
 * });
 * ```
 */
export async function fetchImage(
  query: string,
  options?: UnifiedImageOptions
): Promise<UnifiedImage | null> {
  if (!query || query.trim().length === 0) {
    return null;
  }

  const opts: UnifiedImageOptions = {
    sources: ["wikipedia", "ddg", "pexels"],
    thumbSize: 400,
    preferredLanguage: "en",
    safeSearch: true,
    ...options,
  };

  // Build the source order
  let sourceOrder: ImageSource[] = [];

  // If articleUrl is provided, try OG first
  if (opts.articleUrl) {
    sourceOrder.push("og");
  }

  // If preferred source is specified, add it first
  if (opts.preferredSource && opts.preferredSource !== "auto") {
    if (!sourceOrder.includes(opts.preferredSource)) {
      sourceOrder.push(opts.preferredSource);
    }
  }

  // Add remaining sources from the sources array
  const remainingSources = opts.sources || ["wikipedia", "ddg", "pexels"];
  for (const source of remainingSources) {
    if (source !== "auto" && !sourceOrder.includes(source)) {
      // For Wikipedia, only add if the query looks like an entity
      if (source === "wikipedia") {
        if (isLikelyEntity(query)) {
          sourceOrder.push(source);
        }
      } else {
        sourceOrder.push(source);
      }
    }
  }

  // Ensure we have at least one source
  if (sourceOrder.length === 0) {
    sourceOrder = ["ddg", "pexels"];
  }

  // Try each source in order
  for (const source of sourceOrder) {
    const result = await fetchFromSource(source, query, opts);
    if (result && result.url) {
      return result;
    }
  }

  return null;
}

/**
 * Fetch images from multiple sources and return all results
 *
 * @param query - Search query
 * @param options - Fetch options
 * @returns Array of UnifiedImage from all sources
 */
export async function fetchImagesFromAll(
  query: string,
  options?: UnifiedImageOptions
): Promise<UnifiedImage[]> {
  const results: UnifiedImage[] = [];
  const sources: ImageSource[] = options?.sources || [
    "wikipedia",
    "ddg",
    "pexels",
  ];

  const opts: UnifiedImageOptions = {
    thumbSize: 400,
    preferredLanguage: "en",
    safeSearch: true,
    ...options,
  };

  // If articleUrl provided, add OG
  if (opts.articleUrl && !sources.includes("og")) {
    const ogResult = await fetchFromSource("og", query, opts);
    if (ogResult) results.push(ogResult);
  }

  // Fetch from all sources in parallel
  const promises = sources
    .filter(s => s !== "auto")
    .map(async source => {
      try {
        if (source === "wikipedia" && !isLikelyEntity(query)) {
          return null;
        }
        return await fetchFromSource(source, query, opts);
      } catch {
        return null;
      }
    });

  const sourceResults = await Promise.all(promises);

  for (const result of sourceResults) {
    if (result && result.url) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Fetch multiple images for a query (useful for galleries)
 *
 * @param query - Search query
 * @param limit - Maximum number of images (default: 5)
 * @param options - Fetch options
 * @returns Array of UnifiedImage
 */
export async function fetchMultipleImages(
  query: string,
  limit = 5,
  options?: UnifiedImageOptions
): Promise<UnifiedImage[]> {
  const results: UnifiedImage[] = [];
  const opts = options || {};

  // Get images from DDG (best for variety)
  const ddgResults = await ddgSearch(query, {
    limit: Math.ceil(limit * 0.6),
    safeSearch: opts.safeSearch ?? true,
  });
  results.push(...ddgResults.map(fromDDGImage));

  // Fill remaining with stock photos
  if (results.length < limit) {
    const remaining = limit - results.length;
    const stockResults = await searchStockImages(query, {
      limit: remaining,
      orientation: opts.orientation,
    });
    results.push(...stockResults.map(fromStockImage));
  }

  return results.slice(0, limit);
}

/**
 * Get the best image for a person (uses Wikipedia primarily)
 *
 * @param name - Person's name
 * @param options - Fetch options
 * @returns UnifiedImage or null
 */
export async function fetchPersonImage(
  name: string,
  options?: Pick<UnifiedImageOptions, "thumbSize" | "preferredLanguage">
): Promise<UnifiedImage | null> {
  return fetchImage(name, {
    ...options,
    sources: ["wikipedia", "ddg"],
    preferredSource: "wikipedia",
  });
}

/**
 * Get the best image for an article (uses OG parsing primarily)
 *
 * @param articleUrl - URL of the article
 * @param fallbackQuery - Fallback search query if OG fails
 * @param options - Fetch options
 * @returns UnifiedImage or null
 */
export async function fetchArticleImage(
  articleUrl: string,
  fallbackQuery?: string,
  options?: UnifiedImageOptions
): Promise<UnifiedImage | null> {
  // First try OG
  const ogResult = await fetchFromSource("og", fallbackQuery || "", {
    ...options,
    articleUrl,
  });

  if (ogResult) return ogResult;

  // If OG fails and we have a fallback query, try other sources
  if (fallbackQuery) {
    return fetchImage(fallbackQuery, {
      ...options,
      sources: ["ddg", "pexels"],
    });
  }

  return null;
}

/**
 * Check if any image source is available for a query
 *
 * @param query - Search query
 * @param options - Fetch options
 * @returns true if at least one source returns an image
 */
export async function hasImage(
  query: string,
  options?: UnifiedImageOptions
): Promise<boolean> {
  const result = await fetchImage(query, options);
  return result !== null;
}
