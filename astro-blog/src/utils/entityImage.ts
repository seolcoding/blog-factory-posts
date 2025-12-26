/**
 * Entity Image Utility
 *
 * Fetches images for people, organizations, and entities from Wikipedia/Wikidata
 * with proper CC BY-SA attribution.
 */

export interface EntityImage {
  imageUrl: string | null;
  thumbnailUrl: string | null;
  attribution: string;
  source: "wikipedia" | "wikidata" | "wikimedia";
  license: string;
  entityName: string;
  artistName?: string;
  imageDescription?: string;
}

export interface EntityImageOptions {
  thumbSize?: number; // default 400
  preferredLanguage?: "en" | "ko"; // default 'en'
}

interface WikipediaPageImagesResponse {
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number;
        title?: string;
        pageimage?: string;
        thumbnail?: {
          source: string;
          width: number;
          height: number;
        };
        original?: {
          source: string;
          width: number;
          height: number;
        };
      }
    >;
  };
}

interface WikimediaImageInfoResponse {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: Array<{
          extmetadata?: {
            Artist?: { value: string };
            LicenseShortName?: { value: string };
            LicenseUrl?: { value: string };
            ImageDescription?: { value: string };
            Credit?: { value: string };
          };
          url?: string;
          thumburl?: string;
        }>;
      }
    >;
  };
}

interface WikidataEntityResponse {
  entities?: Record<
    string,
    {
      claims?: {
        P18?: Array<{
          mainsnak?: {
            datavalue?: {
              value?: string;
            };
          };
        }>;
      };
      labels?: Record<string, { value: string }>;
    }
  >;
}

// Simple in-memory cache
const imageCache = new Map<string, EntityImage | null>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const cacheTimestamps = new Map<string, number>();

function getCacheKey(entityName: string, lang: string): string {
  return `${lang}:${entityName.toLowerCase().trim()}`;
}

function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Get Wikipedia API URL for a given language
 */
function getWikipediaApiUrl(lang: "en" | "ko"): string {
  return `https://${lang}.wikipedia.org/w/api.php`;
}

/**
 * Convert a Wikipedia image filename to a Wikimedia Commons URL
 */
function getCommonsImageUrl(filename: string, thumbSize?: number): string {
  const encodedFilename = encodeURIComponent(filename.replace(/ /g, "_"));

  if (thumbSize) {
    // Use Special:FilePath for thumbnails
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodedFilename}?width=${thumbSize}`;
  }

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodedFilename}`;
}

/**
 * Fetch image metadata from Wikimedia Commons
 */
async function fetchCommonsImageInfo(
  filename: string,
  thumbSize: number
): Promise<{
  url: string;
  thumbUrl: string;
  artist: string;
  license: string;
  description: string;
} | null> {
  const apiUrl = "https://commons.wikimedia.org/w/api.php";
  const params = new URLSearchParams({
    action: "query",
    titles: `File:${filename}`,
    prop: "imageinfo",
    iiprop: "extmetadata|url",
    iiurlwidth: thumbSize.toString(),
    format: "json",
    origin: "*",
  });

  try {
    const response = await fetch(`${apiUrl}?${params}`);
    if (!response.ok) return null;

    const data: WikimediaImageInfoResponse = await response.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    const imageinfo = page?.imageinfo?.[0];
    if (!imageinfo) return null;

    const extmetadata = imageinfo.extmetadata;

    return {
      url: imageinfo.url || getCommonsImageUrl(filename),
      thumbUrl: imageinfo.thumburl || getCommonsImageUrl(filename, thumbSize),
      artist: extmetadata?.Artist?.value
        ? stripHtml(extmetadata.Artist.value)
        : "Unknown",
      license: extmetadata?.LicenseShortName?.value || "CC BY-SA",
      description: extmetadata?.ImageDescription?.value
        ? stripHtml(extmetadata.ImageDescription.value)
        : "",
    };
  } catch {
    return null;
  }
}

/**
 * Fetch entity image from Wikipedia API
 */
async function fetchFromWikipedia(
  entityName: string,
  lang: "en" | "ko",
  thumbSize: number
): Promise<EntityImage | null> {
  const apiUrl = getWikipediaApiUrl(lang);
  const params = new URLSearchParams({
    action: "query",
    titles: entityName,
    prop: "pageimages",
    piprop: "original|thumbnail",
    pithumbsize: thumbSize.toString(),
    format: "json",
    origin: "*",
  });

  try {
    const response = await fetch(`${apiUrl}?${params}`);
    if (!response.ok) return null;

    const data: WikipediaPageImagesResponse = await response.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    if (!page || !page.pageimage) return null;

    // Fetch detailed image info from Commons
    const commonsInfo = await fetchCommonsImageInfo(page.pageimage, thumbSize);

    if (commonsInfo) {
      return {
        imageUrl: commonsInfo.url,
        thumbnailUrl: commonsInfo.thumbUrl,
        attribution: `${commonsInfo.artist} / Wikimedia Commons`,
        source: "wikipedia",
        license: commonsInfo.license,
        entityName: page.title || entityName,
        artistName: commonsInfo.artist,
        imageDescription: commonsInfo.description,
      };
    }

    // Fallback if Commons info fetch fails
    return {
      imageUrl: page.original?.source || null,
      thumbnailUrl: page.thumbnail?.source || null,
      attribution: "Wikimedia Commons",
      source: "wikipedia",
      license: "CC BY-SA",
      entityName: page.title || entityName,
    };
  } catch {
    return null;
  }
}

/**
 * Search Wikidata for an entity and fetch its image
 */
async function fetchFromWikidata(
  entityName: string,
  lang: "en" | "ko",
  thumbSize: number
): Promise<EntityImage | null> {
  // First, search for the entity
  const searchParams = new URLSearchParams({
    action: "wbsearchentities",
    search: entityName,
    language: lang,
    format: "json",
    origin: "*",
  });

  try {
    const searchResponse = await fetch(
      `https://www.wikidata.org/w/api.php?${searchParams}`
    );
    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const entityId = searchData.search?.[0]?.id;
    if (!entityId) return null;

    // Fetch entity details including image (P18)
    const entityParams = new URLSearchParams({
      action: "wbgetentities",
      ids: entityId,
      props: "claims|labels",
      format: "json",
      origin: "*",
    });

    const entityResponse = await fetch(
      `https://www.wikidata.org/w/api.php?${entityParams}`
    );
    if (!entityResponse.ok) return null;

    const entityData: WikidataEntityResponse = await entityResponse.json();
    const entity = entityData.entities?.[entityId];
    if (!entity) return null;

    // P18 is the property for "image"
    const imageClaim = entity.claims?.P18?.[0];
    const imageFilename = imageClaim?.mainsnak?.datavalue?.value;
    if (!imageFilename) return null;

    // Get the entity label in preferred language
    const entityLabel =
      entity.labels?.[lang]?.value ||
      entity.labels?.en?.value ||
      entityName;

    // Fetch detailed image info from Commons
    const commonsInfo = await fetchCommonsImageInfo(imageFilename, thumbSize);

    if (commonsInfo) {
      return {
        imageUrl: commonsInfo.url,
        thumbnailUrl: commonsInfo.thumbUrl,
        attribution: `${commonsInfo.artist} / Wikimedia Commons`,
        source: "wikidata",
        license: commonsInfo.license,
        entityName: entityLabel,
        artistName: commonsInfo.artist,
        imageDescription: commonsInfo.description,
      };
    }

    // Fallback
    return {
      imageUrl: getCommonsImageUrl(imageFilename),
      thumbnailUrl: getCommonsImageUrl(imageFilename, thumbSize),
      attribution: "Wikimedia Commons",
      source: "wikidata",
      license: "CC BY-SA",
      entityName: entityLabel,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch image for a person, organization, or entity by name
 *
 * @param entityName - The name of the entity to search for
 * @param options - Optional configuration for thumbnail size and language
 * @returns EntityImage object or null if not found
 *
 * @example
 * ```typescript
 * const image = await getEntityImage("Elon Musk");
 * if (image) {
 *   console.log(image.thumbnailUrl);
 *   console.log(generateAttribution(image));
 * }
 * ```
 */
export async function getEntityImage(
  entityName: string,
  options?: EntityImageOptions
): Promise<EntityImage | null> {
  const thumbSize = options?.thumbSize ?? 400;
  const lang = options?.preferredLanguage ?? "en";

  // Check cache
  const cacheKey = getCacheKey(entityName, lang);
  if (isCacheValid(cacheKey)) {
    return imageCache.get(cacheKey) ?? null;
  }

  // Try Wikipedia first (usually has better direct page matches)
  let result = await fetchFromWikipedia(entityName, lang, thumbSize);

  // If not found and language is Korean, try English Wikipedia
  if (!result && lang === "ko") {
    result = await fetchFromWikipedia(entityName, "en", thumbSize);
  }

  // Fall back to Wikidata (better for searching)
  if (!result) {
    result = await fetchFromWikidata(entityName, lang, thumbSize);
  }

  // Cache the result (including null results to avoid repeated failed lookups)
  imageCache.set(cacheKey, result);
  cacheTimestamps.set(cacheKey, Date.now());

  return result;
}

/**
 * Fetch images for multiple entities in batch
 *
 * @param entityNames - Array of entity names to fetch
 * @param options - Optional configuration
 * @returns Map of entity names to their images
 *
 * @example
 * ```typescript
 * const images = await getEntityImages(["Elon Musk", "Tim Cook", "Satya Nadella"]);
 * for (const [name, image] of images) {
 *   console.log(`${name}: ${image?.thumbnailUrl}`);
 * }
 * ```
 */
export async function getEntityImages(
  entityNames: string[],
  options?: EntityImageOptions
): Promise<Map<string, EntityImage | null>> {
  const results = new Map<string, EntityImage | null>();

  // Process in parallel with a reasonable concurrency limit
  const BATCH_SIZE = 5;

  for (let i = 0; i < entityNames.length; i += BATCH_SIZE) {
    const batch = entityNames.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async name => {
      const image = await getEntityImage(name, options);
      return { name, image };
    });

    const batchResults = await Promise.all(promises);
    for (const { name, image } of batchResults) {
      results.set(name, image);
    }
  }

  return results;
}

/**
 * Generate proper HTML attribution string for an entity image
 *
 * @param image - The EntityImage object
 * @returns HTML string with proper attribution
 *
 * @example
 * ```typescript
 * const image = await getEntityImage("Elon Musk");
 * if (image) {
 *   const attribution = generateAttribution(image);
 *   // Returns: '<a href="...">Artist Name</a>, <a href="...">CC BY-SA 4.0</a>, via Wikimedia Commons'
 * }
 * ```
 */
export function generateAttribution(image: EntityImage): string {
  const artistPart = image.artistName || "Unknown author";
  const licensePart = image.license || "CC BY-SA";

  // Build the attribution based on available information
  const parts: string[] = [];

  // Artist/Author
  parts.push(artistPart);

  // License with link
  const licenseUrl = getLicenseUrl(licensePart);
  if (licenseUrl) {
    parts.push(
      `<a href="${licenseUrl}" target="_blank" rel="noopener noreferrer">${licensePart}</a>`
    );
  } else {
    parts.push(licensePart);
  }

  // Source
  parts.push("via Wikimedia Commons");

  return parts.join(", ");
}

/**
 * Generate a plain text attribution string (no HTML)
 */
export function generatePlainAttribution(image: EntityImage): string {
  const artistPart = image.artistName || "Unknown author";
  const licensePart = image.license || "CC BY-SA";

  return `${artistPart}, ${licensePart}, via Wikimedia Commons`;
}

/**
 * Get the URL for a Creative Commons license
 */
function getLicenseUrl(license: string): string | null {
  const normalizedLicense = license.toLowerCase().replace(/\s+/g, " ").trim();

  const licenseUrls: Record<string, string> = {
    "cc by-sa 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
    "cc by-sa 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
    "cc by-sa 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
    "cc by-sa": "https://creativecommons.org/licenses/by-sa/4.0/",
    "cc by 4.0": "https://creativecommons.org/licenses/by/4.0/",
    "cc by 3.0": "https://creativecommons.org/licenses/by/3.0/",
    "cc by 2.0": "https://creativecommons.org/licenses/by/2.0/",
    "cc by": "https://creativecommons.org/licenses/by/4.0/",
    "cc0": "https://creativecommons.org/publicdomain/zero/1.0/",
    "public domain": "https://creativecommons.org/publicdomain/mark/1.0/",
  };

  return licenseUrls[normalizedLicense] || null;
}

/**
 * Clear the image cache (useful for testing or memory management)
 */
export function clearImageCache(): void {
  imageCache.clear();
  cacheTimestamps.clear();
}
