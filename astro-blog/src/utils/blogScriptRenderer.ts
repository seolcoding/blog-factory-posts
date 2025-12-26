/**
 * BlogScript Renderer
 *
 * Deterministic engine that converts BlogScript JSON to MDX
 * No LLM calls - pure transformation
 */

import type {
  BlogScript,
  Beat,
  ImageSource,
  StatGridBeat,
  TableBeat,
  TimelineBeat,
  CalloutBeat,
  QuoteBeat,
  ProfileBeat,
  ImageBeat,
} from "../types/blogScript";

// ============================================
// Image Source Rendering
// ============================================

function renderImageSource(source: ImageSource): string {
  switch (source.kind) {
    case "url":
      return `url="${source.url}"`;
    case "wikipedia":
      return `query="${source.entity}" sources={["wikipedia"]} lang="${source.lang}"`;
    case "ddg":
      return `query="${source.query}" sources={["ddg", "wikipedia"]}`;
    case "unsplash":
      const orientation = source.orientation ? ` orientation="${source.orientation}"` : "";
      return `query="${source.query}" sources={["unsplash"]}${orientation}`;
    default:
      return "";
  }
}

// ============================================
// Beat Renderers
// ============================================

function renderText(content: string): string {
  return content + "\n";
}

function renderHeading(level: "h2" | "h3" | "h4", text: string): string {
  const prefix = level === "h2" ? "##" : level === "h3" ? "###" : "####";
  return `${prefix} ${text}\n`;
}

function renderImage(beat: ImageBeat): string {
  const sourceProps = renderImageSource(beat.source);
  const sizeMap: Record<string, string> = { small: "small", medium: "medium", large: "large", hero: "hero", full: "full" };
  const size = sizeMap[beat.size || "large"] || "large";
  const caption = beat.caption ? ` caption="${beat.caption}"` : "";
  const alt = beat.alt ? ` alt="${beat.alt}"` : "";
  const float = beat.float && beat.float !== "none" ? ` class="float-${beat.float}"` : "";

  return `<SmartImage
  ${sourceProps}
  size="${size}"${caption}${alt}${float}
/>\n`;
}

function renderQuote(beat: QuoteBeat): string {
  const author = beat.author ? ` author="${beat.author}"` : "";
  const source = beat.source ? ` source="${beat.source}"` : "";
  const variant = beat.variant !== "default" ? ` variant="${beat.variant}"` : "";

  return `<QuoteBox
  quote="${beat.text.replace(/"/g, '\\"')}"${author}${source}${variant}
/>\n`;
}

function renderCallout(beat: CalloutBeat): string {
  const title = beat.title ? ` title="${beat.title}"` : "";

  return `<HighlightBox type="${beat.variant}"${title}>

${beat.content}

</HighlightBox>\n`;
}

function renderStatCard(label: string, value: string, description?: string, trend?: "up" | "down" | "neutral"): string {
  const desc = description ? ` description="${description}"` : "";
  const trendProp = trend ? ` trend="${trend}"` : "";

  return `  <StatCard
    label="${label}"
    value="${value}"${desc}${trendProp}
  />`;
}

function renderStatGrid(beat: StatGridBeat): string {
  const cols = beat.columns;
  const gridClass = `grid grid-cols-1 md:grid-cols-${cols} gap-4 my-8`;

  const stats = beat.stats
    .map((s: { label: string; value: string; description?: string; trend?: "up" | "down" | "neutral" }) =>
      renderStatCard(s.label, s.value, s.description, s.trend))
    .join("\n");

  return `<div class="${gridClass}">
${stats}
</div>\n`;
}

function renderTable(beat: TableBeat): string {
  const title = beat.title ? ` title="${beat.title}"` : "";
  const headers = JSON.stringify(beat.headers);
  const rows = JSON.stringify(beat.rows);

  return `<ComparisonTable${title}
  headers={${headers}}
  rows={${rows}}
/>\n`;
}

function renderTimeline(beat: TimelineBeat): string {
  const items = beat.items
    .map((item: { date: string; title: string; description?: string; status?: "completed" | "current" | "upcoming" }) => {
      const desc = item.description ? ` description="${item.description}"` : "";
      const status = item.status ? ` status="${item.status}"` : "";
      return `  <TimelineItem
    date="${item.date}"
    title="${item.title}"${desc}${status}
  />`;
    })
    .join("\n");

  return `<div class="my-8 space-y-4">
${items}
</div>\n`;
}

function renderProfile(beat: ProfileBeat): string {
  const role = beat.role ? ` role="${beat.role}"` : "";
  const desc = beat.description ? ` description="${beat.description}"` : "";
  const stats = beat.stats ? ` stats={${JSON.stringify(beat.stats)}}` : "";

  // Image handling for profile
  let imageProps = "";
  if (beat.image) {
    imageProps = ` imageQuery="${beat.image.kind === "wikipedia" ? (beat.image as any).entity : (beat.image as any).query}"`;
  }

  return `<ProfileCard
  name="${beat.name}"${role}${desc}${imageProps}${stats}
/>\n`;
}

function renderDivider(): string {
  return "---\n";
}

function renderSpacer(size: "small" | "medium" | "large"): string {
  const heights = { small: "4", medium: "8", large: "12" };
  return `<div class="h-${heights[size]}"></div>\n`;
}

// ============================================
// Beat Dispatcher
// ============================================

function renderBeat(beat: Beat): string {
  switch (beat.type) {
    case "text":
      return renderText(beat.content);
    case "heading":
      return renderHeading(beat.level, beat.text);
    case "image":
      return renderImage(beat);
    case "quote":
      return renderQuote(beat);
    case "callout":
      return renderCallout(beat);
    case "stat":
      return renderStatCard(beat.label, beat.value, beat.description, beat.trend) + "\n";
    case "stat-grid":
      return renderStatGrid(beat);
    case "table":
      return renderTable(beat);
    case "timeline":
      return renderTimeline(beat);
    case "profile":
      return renderProfile(beat);
    case "divider":
      return renderDivider();
    case "spacer":
      return renderSpacer(beat.size);
    default:
      console.warn("Unknown beat type:", (beat as any).type);
      return "";
  }
}

// ============================================
// Main Renderer
// ============================================

export function renderBlogScript(script: BlogScript): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push("---");
  lines.push(`title: "${script.meta.title}"`);
  lines.push(`pubDatetime: ${script.meta.pubDatetime}`);
  lines.push(`tags: [${script.meta.tags.join(", ")}]`);
  lines.push(`description: "${script.meta.description}"`);
  lines.push(`author: ${script.meta.author}`);
  if (script.meta.draft) {
    lines.push(`draft: true`);
  }
  lines.push("---");
  lines.push("");

  // Imports
  lines.push(`import StatCard from "@/components/widgets/StatCard.astro";`);
  lines.push(`import ComparisonTable from "@/components/widgets/ComparisonTable.astro";`);
  lines.push(`import HighlightBox from "@/components/widgets/HighlightBox.astro";`);
  lines.push(`import QuoteBox from "@/components/widgets/QuoteBox.astro";`);
  lines.push(`import TimelineItem from "@/components/widgets/TimelineItem.astro";`);
  lines.push(`import ProfileCard from "@/components/widgets/ProfileCard.astro";`);
  lines.push(`import SmartImage from "@/components/widgets/SmartImage.astro";`);
  lines.push("");

  // Hero image
  if (script.hero) {
    lines.push(renderImage(script.hero));
    lines.push("");
  }

  // Beats
  for (const beat of script.beats) {
    lines.push(renderBeat(beat));
  }

  // References
  if (script.references && script.references.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 참고 자료");
    lines.push("");
    for (const ref of script.references) {
      const desc = ref.description ? ` - ${ref.description}` : "";
      lines.push(`- [${ref.title}](${ref.url})${desc}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ============================================
// File Writer
// ============================================

export async function writeBlogScriptToFile(
  script: BlogScript,
  outputPath: string
): Promise<void> {
  const mdxContent = renderBlogScript(script);

  // Use Node.js fs if available, otherwise just return the content
  if (typeof process !== "undefined" && process.versions?.node) {
    const fs = await import("fs/promises");
    await fs.writeFile(outputPath, mdxContent, "utf-8");
    console.log(`✅ Written: ${outputPath}`);
  } else {
    console.log("Content generated (browser environment, cannot write file):");
    console.log(mdxContent);
  }
}

// ============================================
// Validation
// ============================================

import { blogScriptSchema } from "../types/blogScript";

export function validateBlogScript(json: unknown): BlogScript {
  return blogScriptSchema.parse(json);
}

export function safeParseBlogScript(json: unknown): { success: true; data: BlogScript } | { success: false; error: string } {
  const result = blogScriptSchema.safeParse(json);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}
