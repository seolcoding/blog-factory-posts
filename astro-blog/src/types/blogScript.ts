/**
 * BlogScript - JSON-based blog post schema
 *
 * Inspired by MulmoScript (https://github.com/receptron/mulmocast-cli)
 * LLM generates this JSON → deterministic engine renders to MDX
 *
 * Key Concept: "beats" for content sequencing
 */

import { z } from "zod";

// ============================================
// Version & Meta
// ============================================

export const blogScriptVersionSchema = z.object({
  version: z.literal("1.0"),
});

// ============================================
// Image Schema
// ============================================

export const imageSourceSchema = z.discriminatedUnion("kind", [
  // Direct URL (highest priority)
  z.object({
    kind: z.literal("url"),
    url: z.string().url(),
    alt: z.string().optional(),
  }).strict(),

  // Wikipedia/Wikidata entity lookup
  z.object({
    kind: z.literal("wikipedia"),
    entity: z.string().min(1),
    lang: z.enum(["en", "ko"]).default("en"),
  }).strict(),

  // DuckDuckGo image search (real images)
  z.object({
    kind: z.literal("ddg"),
    query: z.string().min(1),
  }).strict(),

  // Unsplash (fallback for stock photos)
  z.object({
    kind: z.literal("unsplash"),
    query: z.string().min(1),
    orientation: z.enum(["landscape", "portrait", "squarish"]).optional(),
  }).strict(),
]);

export const imageBeatSchema = z.object({
  type: z.literal("image"),
  source: imageSourceSchema,
  size: z.enum(["small", "medium", "large", "hero", "full"]).default("large"),
  caption: z.string().optional(),
  alt: z.string().optional(),
  float: z.enum(["left", "right", "none"]).optional(),
}).strict();

// ============================================
// Text Content Schemas
// ============================================

export const textBeatSchema = z.object({
  type: z.literal("text"),
  content: z.string().min(1), // Markdown
}).strict();

export const headingBeatSchema = z.object({
  type: z.literal("heading"),
  level: z.enum(["h2", "h3", "h4"]),
  text: z.string().min(1),
}).strict();

export const quoteBeatSchema = z.object({
  type: z.literal("quote"),
  text: z.string().min(1),
  author: z.string().optional(),
  source: z.string().optional(),
  variant: z.enum(["default", "accent", "minimal", "card"]).default("default"),
}).strict();

export const calloutBeatSchema = z.object({
  type: z.literal("callout"),
  variant: z.enum(["info", "warning", "success", "tip", "danger"]),
  title: z.string().optional(),
  content: z.string().min(1), // Markdown
}).strict();

// ============================================
// Widget Schemas
// ============================================

export const statCardBeatSchema = z.object({
  type: z.literal("stat"),
  label: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
  trend: z.enum(["up", "down", "neutral"]).optional(),
}).strict();

export const statGridBeatSchema = z.object({
  type: z.literal("stat-grid"),
  columns: z.enum(["2", "3", "4"]).default("3"),
  stats: z.array(statCardBeatSchema.omit({ type: true })).min(1).max(6),
}).strict();

export const tableRowSchema = z.array(z.union([z.string(), z.boolean()]));

export const tableBeatSchema = z.object({
  type: z.literal("table"),
  title: z.string().optional(),
  headers: z.array(z.string()).min(2),
  rows: z.array(tableRowSchema).min(1),
}).strict();

export const timelineItemSchema = z.object({
  date: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["completed", "current", "upcoming"]).optional(),
});

export const timelineBeatSchema = z.object({
  type: z.literal("timeline"),
  items: z.array(timelineItemSchema).min(1),
}).strict();

export const profileBeatSchema = z.object({
  type: z.literal("profile"),
  name: z.string().min(1),
  role: z.string().optional(),
  description: z.string().optional(),
  image: imageSourceSchema.optional(),
  stats: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
}).strict();

// ============================================
// Layout Schemas
// ============================================

export const dividerBeatSchema = z.object({
  type: z.literal("divider"),
}).strict();

export const spacerBeatSchema = z.object({
  type: z.literal("spacer"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
}).strict();

// ============================================
// Union Beat Schema
// ============================================

export const beatSchema = z.discriminatedUnion("type", [
  // Content
  textBeatSchema,
  headingBeatSchema,
  imageBeatSchema,
  quoteBeatSchema,
  calloutBeatSchema,

  // Widgets
  statCardBeatSchema,
  statGridBeatSchema,
  tableBeatSchema,
  timelineBeatSchema,
  profileBeatSchema,

  // Layout
  dividerBeatSchema,
  spacerBeatSchema,
]);

// ============================================
// Reference Schema
// ============================================

export const referenceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
}).strict();

// ============================================
// Main BlogScript Schema
// ============================================

export const blogScriptSchema = z.object({
  $blogscript: blogScriptVersionSchema,

  // Meta
  meta: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(160),
    pubDatetime: z.string(), // ISO 8601
    tags: z.array(z.string()).min(1).max(10),
    author: z.string().default("Blog Factory"),
    draft: z.boolean().default(false),
    ogImage: imageSourceSchema.optional(),
  }),

  // Hero image (optional)
  hero: imageBeatSchema.optional(),

  // Main content as beats
  beats: z.array(beatSchema).min(1),

  // References
  references: z.array(referenceSchema).optional(),
}).strict();

// ============================================
// Type exports
// ============================================

export type ImageSource = z.infer<typeof imageSourceSchema>;
export type ImageBeat = z.infer<typeof imageBeatSchema>;
export type TextBeat = z.infer<typeof textBeatSchema>;
export type HeadingBeat = z.infer<typeof headingBeatSchema>;
export type QuoteBeat = z.infer<typeof quoteBeatSchema>;
export type CalloutBeat = z.infer<typeof calloutBeatSchema>;
export type StatCardBeat = z.infer<typeof statCardBeatSchema>;
export type StatGridBeat = z.infer<typeof statGridBeatSchema>;
export type TableBeat = z.infer<typeof tableBeatSchema>;
export type TimelineBeat = z.infer<typeof timelineBeatSchema>;
export type ProfileBeat = z.infer<typeof profileBeatSchema>;
export type DividerBeat = z.infer<typeof dividerBeatSchema>;
export type SpacerBeat = z.infer<typeof spacerBeatSchema>;
export type Beat = z.infer<typeof beatSchema>;
export type Reference = z.infer<typeof referenceSchema>;
export type BlogScript = z.infer<typeof blogScriptSchema>;

// ============================================
// Example BlogScript
// ============================================

export const exampleBlogScript: BlogScript = {
  $blogscript: { version: "1.0" },

  meta: {
    title: "2025년 AI 에이전트 완벽 가이드",
    description: "Claude, GPT-5, Gemini 3 등 최신 AI 에이전트를 비교 분석합니다.",
    pubDatetime: "2025-12-26T10:00:00+09:00",
    tags: ["AI", "에이전트", "Claude", "GPT"],
    author: "Blog Factory",
    draft: false,
  },

  hero: {
    type: "image",
    source: { kind: "ddg", query: "AI artificial intelligence robot 2025" },
    size: "hero",
    alt: "AI 에이전트 일러스트",
  },

  beats: [
    {
      type: "text",
      content: "2025년, AI 에이전트는 단순한 챗봇을 넘어 **자율적인 작업 수행**이 가능해졌습니다.",
    },
    {
      type: "stat-grid",
      columns: "3",
      stats: [
        { label: "시장 규모", value: "$50B", trend: "up", description: "2025년 전망" },
        { label: "도입률", value: "67%", trend: "up", description: "Fortune 500" },
        { label: "생산성", value: "+40%", trend: "up", description: "평균 향상" },
      ],
    },
    {
      type: "heading",
      level: "h2",
      text: "주요 AI 에이전트 비교",
    },
    {
      type: "table",
      title: "2025 AI 에이전트 비교",
      headers: ["모델", "개발사", "특징", "가격"],
      rows: [
        ["Claude Opus 4", "Anthropic", "긴 컨텍스트, 코딩", "$15/MTok"],
        ["GPT-5", "OpenAI", "멀티모달, 추론", "$20/MTok"],
        ["Gemini 3", "Google", "검색 통합", "$12/MTok"],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "추천",
      content: "코딩 작업에는 **Claude**, 범용 작업에는 **GPT-5**를 추천합니다.",
    },
    {
      type: "image",
      source: { kind: "wikipedia", entity: "Claude (language model)", lang: "en" },
      size: "medium",
      caption: "Anthropic의 Claude 로고",
    },
    {
      type: "quote",
      text: "AI 에이전트는 2025년 소프트웨어 개발의 게임 체인저가 될 것입니다.",
      author: "Dario Amodei",
      source: "Anthropic CEO",
      variant: "accent",
    },
  ],

  references: [
    { url: "https://anthropic.com/blog", title: "Anthropic Blog" },
    { url: "https://openai.com/docs", title: "OpenAI Docs" },
  ],
};
