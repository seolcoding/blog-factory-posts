/**
 * Open Graph Meta Tag Parser
 *
 * Extracts Open Graph metadata from URLs (useful for getting thumbnails
 * and metadata from news articles and other web pages).
 */

export interface OGData {
  /** The og:title or fallback title */
  title: string | null;
  /** The og:description or meta description */
  description: string | null;
  /** The og:image URL (primary image) */
  image: string | null;
  /** The og:site_name */
  siteName: string | null;
  /** The canonical URL or og:url */
  url: string;
  /** The og:type (e.g., article, website) */
  type: string | null;
  /** Additional images found (twitter:image, etc.) */
  additionalImages?: string[];
  /** The og:image:alt or image alt text */
  imageAlt?: string | null;
  /** Article publish date if available */
  publishedTime?: string | null;
  /** Article author if available */
  author?: string | null;
}

// Simple in-memory cache
const ogCache = new Map<string, OGData | null>();
const cacheTimestamps = new Map<string, number>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function isCacheValid(url: string): boolean {
  const timestamp = cacheTimestamps.get(url);
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Extract the content of a meta tag by property or name
 */
function extractMetaContent(
  html: string,
  property: string,
  isName = false
): string | null {
  const attrType = isName ? "name" : "property";

  // Match both single and double quotes, handle various attribute orders
  const patterns = [
    // property="..." content="..."
    new RegExp(
      `<meta[^>]+${attrType}=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    // content="..." property="..."
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+${attrType}=["']${property}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHTMLEntities(match[1].trim());
    }
  }

  return null;
}

/**
 * Extract the title tag content
 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeHTMLEntities(match[1].trim()) : null;
}

/**
 * Extract canonical URL from link tag
 */
function extractCanonical(html: string): string | null {
  const match = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
  );
  return match ? match[1] : null;
}

/**
 * Decode common HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&#x60;": "`",
    "&#x3D;": "=",
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, "gi"), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );
  decoded = decoded.replace(/&#x([a-fA-F0-9]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );

  return decoded;
}

/**
 * Resolve a potentially relative URL to an absolute URL
 */
function resolveUrl(relativeUrl: string | null, baseUrl: string): string | null {
  if (!relativeUrl) return null;

  // Already absolute
  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }

  // Protocol-relative
  if (relativeUrl.startsWith("//")) {
    const baseProtocol = baseUrl.startsWith("https") ? "https:" : "http:";
    return baseProtocol + relativeUrl;
  }

  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch {
    return relativeUrl;
  }
}

/**
 * Extract all potential images from HTML
 */
function extractAllImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // OG images
  const ogImage = extractMetaContent(html, "og:image");
  if (ogImage) {
    const resolved = resolveUrl(ogImage, baseUrl);
    if (resolved && !seen.has(resolved)) {
      images.push(resolved);
      seen.add(resolved);
    }
  }

  // Twitter image
  const twitterImage =
    extractMetaContent(html, "twitter:image") ||
    extractMetaContent(html, "twitter:image:src");
  if (twitterImage) {
    const resolved = resolveUrl(twitterImage, baseUrl);
    if (resolved && !seen.has(resolved)) {
      images.push(resolved);
      seen.add(resolved);
    }
  }

  // Additional og:image:url
  const ogImageUrl = extractMetaContent(html, "og:image:url");
  if (ogImageUrl) {
    const resolved = resolveUrl(ogImageUrl, baseUrl);
    if (resolved && !seen.has(resolved)) {
      images.push(resolved);
      seen.add(resolved);
    }
  }

  return images;
}

/**
 * Parse Open Graph metadata from a URL
 *
 * @param url - The URL to fetch and parse
 * @returns OGData object or null if parsing fails
 *
 * @example
 * ```typescript
 * const og = await parseOG("https://example.com/article");
 * if (og) {
 *   console.log(og.title, og.image);
 * }
 * ```
 */
export async function parseOG(url: string): Promise<OGData | null> {
  if (!url || url.trim().length === 0) {
    return null;
  }

  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  // Check cache
  if (isCacheValid(normalizedUrl)) {
    return ogCache.get(normalizedUrl) ?? null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[ogParser] Failed to fetch ${url}: ${response.status}`);
      ogCache.set(normalizedUrl, null);
      cacheTimestamps.set(normalizedUrl, Date.now());
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      console.warn(`[ogParser] Non-HTML content type for ${url}: ${contentType}`);
      return null;
    }

    const html = await response.text();
    const finalUrl = response.url || normalizedUrl;

    // Extract all images
    const allImages = extractAllImages(html, finalUrl);

    const ogData: OGData = {
      title:
        extractMetaContent(html, "og:title") ||
        extractMetaContent(html, "twitter:title") ||
        extractTitle(html),
      description:
        extractMetaContent(html, "og:description") ||
        extractMetaContent(html, "twitter:description") ||
        extractMetaContent(html, "description", true),
      image: allImages[0] || null,
      siteName:
        extractMetaContent(html, "og:site_name") ||
        extractMetaContent(html, "application-name", true),
      url: extractMetaContent(html, "og:url") || extractCanonical(html) || finalUrl,
      type: extractMetaContent(html, "og:type"),
      additionalImages: allImages.slice(1),
      imageAlt:
        extractMetaContent(html, "og:image:alt") ||
        extractMetaContent(html, "twitter:image:alt"),
      publishedTime:
        extractMetaContent(html, "article:published_time") ||
        extractMetaContent(html, "datePublished", true),
      author:
        extractMetaContent(html, "article:author") ||
        extractMetaContent(html, "author", true),
    };

    // Cache the result
    ogCache.set(normalizedUrl, ogData);
    cacheTimestamps.set(normalizedUrl, Date.now());

    return ogData;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(`[ogParser] Timeout fetching ${url}`);
    } else {
      console.warn(
        `[ogParser] Error parsing ${url}:`,
        error instanceof Error ? error.message : error
      );
    }

    ogCache.set(normalizedUrl, null);
    cacheTimestamps.set(normalizedUrl, Date.now());
    return null;
  }
}

/**
 * Parse Open Graph metadata from multiple URLs in parallel
 *
 * @param urls - Array of URLs to parse
 * @returns Map of URL to OGData (or null if parsing failed)
 *
 * @example
 * ```typescript
 * const results = await parseOGBatch([
 *   "https://example.com/article1",
 *   "https://example.com/article2"
 * ]);
 * for (const [url, og] of results) {
 *   console.log(url, og?.image);
 * }
 * ```
 */
export async function parseOGBatch(
  urls: string[]
): Promise<Map<string, OGData | null>> {
  const results = new Map<string, OGData | null>();

  if (!urls || urls.length === 0) {
    return results;
  }

  // Process in batches to avoid overwhelming the network
  const BATCH_SIZE = 5;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async url => {
      const og = await parseOG(url);
      return { url, og };
    });

    const batchResults = await Promise.all(promises);
    for (const { url, og } of batchResults) {
      results.set(url, og);
    }
  }

  return results;
}

/**
 * Check if a URL has valid Open Graph image
 *
 * @param url - The URL to check
 * @returns true if the URL has an og:image
 */
export async function hasOGImage(url: string): Promise<boolean> {
  const og = await parseOG(url);
  return Boolean(og?.image);
}

/**
 * Clear the OG parser cache
 */
export function clearOGCache(): void {
  ogCache.clear();
  cacheTimestamps.clear();
}

/**
 * Get cache statistics
 */
export function getOGCacheStats(): { size: number; urls: string[] } {
  return {
    size: ogCache.size,
    urls: Array.from(ogCache.keys()),
  };
}
