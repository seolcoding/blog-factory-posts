/**
 * Blog Post JSON Schema
 *
 * LLM generates this JSON structure, then a deterministic engine renders it to MDX.
 * This separates creative decisions (LLM) from rendering (code).
 */

// ============================================
// Image Types
// ============================================

export type ImageSource = "wikipedia" | "ddg" | "unsplash" | "url";

export interface PostImage {
  /** Search query for DDG/Wikipedia, or direct URL */
  query: string;
  /** Preferred source order: try ddg/wiki first, unsplash as fallback */
  sources: ImageSource[];
  /** Image size */
  size: "small" | "medium" | "large" | "hero";
  /** Alt text */
  alt: string;
  /** Optional caption */
  caption?: string;
  /** Direct URL if known */
  url?: string;
  /** Wikipedia entity for precise lookup */
  wikiEntity?: string;
}

// ============================================
// Widget Types
// ============================================

export interface StatCardData {
  type: "stat-card";
  label: string;
  value: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
}

export interface ComparisonTableData {
  type: "comparison-table";
  title?: string;
  headers: string[];
  rows: (string | boolean)[][];
}

export interface HighlightBoxData {
  type: "highlight-box";
  variant: "info" | "warning" | "success" | "tip" | "danger";
  title?: string;
  content: string; // Markdown content
}

export interface QuoteBoxData {
  type: "quote-box";
  quote: string;
  author?: string;
  source?: string;
  variant?: "default" | "accent" | "minimal" | "card";
}

export interface TimelineData {
  type: "timeline";
  items: {
    date: string;
    title: string;
    description?: string;
    status?: "completed" | "current" | "upcoming";
  }[];
}

export interface ProfileCardData {
  type: "profile-card";
  name: string;
  role?: string;
  description?: string;
  image?: PostImage;
  stats?: { label: string; value: string }[];
}

export type WidgetData =
  | StatCardData
  | ComparisonTableData
  | HighlightBoxData
  | QuoteBoxData
  | TimelineData
  | ProfileCardData;

// ============================================
// Section Types
// ============================================

export interface TextSection {
  type: "text";
  content: string; // Markdown
}

export interface HeadingSection {
  type: "heading";
  level: 2 | 3 | 4;
  text: string;
}

export interface ImageSection {
  type: "image";
  image: PostImage;
  layout?: "inline" | "full-width" | "float-left" | "float-right";
}

export interface WidgetSection {
  type: "widget";
  widget: WidgetData;
}

export interface WidgetGridSection {
  type: "widget-grid";
  columns: 2 | 3 | 4;
  widgets: WidgetData[];
}

export interface DividerSection {
  type: "divider";
}

export type Section =
  | TextSection
  | HeadingSection
  | ImageSection
  | WidgetSection
  | WidgetGridSection
  | DividerSection;

// ============================================
// Post Schema
// ============================================

export interface PostSchema {
  /** Post metadata */
  meta: {
    title: string;
    description: string;
    pubDatetime: string; // ISO 8601
    tags: string[];
    author?: string;
    draft?: boolean;
    ogImage?: PostImage;
  };

  /** Hero section (optional) */
  hero?: {
    image: PostImage;
    overlay?: boolean;
  };

  /** Main content sections */
  sections: Section[];

  /** References/Sources (optional) */
  references?: {
    title: string;
    url: string;
  }[];
}

// ============================================
// Example Post JSON
// ============================================

export const examplePost: PostSchema = {
  meta: {
    title: "2025년 AI 에이전트 완벽 가이드",
    description: "Claude, GPT-5, Gemini 3 등 최신 AI 에이전트를 비교 분석합니다.",
    pubDatetime: "2025-12-26T10:00:00+09:00",
    tags: ["AI", "에이전트", "Claude", "GPT"],
    author: "Blog Factory",
  },

  hero: {
    image: {
      query: "artificial intelligence robot",
      sources: ["ddg", "wikipedia", "unsplash"],
      size: "hero",
      alt: "AI 에이전트 일러스트",
    },
  },

  sections: [
    {
      type: "text",
      content: "2025년, AI 에이전트는 단순한 챗봇을 넘어 **자율적인 작업 수행**이 가능해졌습니다.",
    },
    {
      type: "widget-grid",
      columns: 3,
      widgets: [
        { type: "stat-card", label: "시장 규모", value: "$50B", trend: "up", description: "2025년 전망" },
        { type: "stat-card", label: "도입률", value: "67%", trend: "up", description: "Fortune 500" },
        { type: "stat-card", label: "생산성", value: "+40%", trend: "up", description: "평균 향상" },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: "주요 AI 에이전트 비교",
    },
    {
      type: "widget",
      widget: {
        type: "comparison-table",
        title: "2025 AI 에이전트 비교",
        headers: ["모델", "개발사", "특징", "가격"],
        rows: [
          ["Claude Opus 4", "Anthropic", "긴 컨텍스트, 코딩", "$15/MTok"],
          ["GPT-5", "OpenAI", "멀티모달, 추론", "$20/MTok"],
          ["Gemini 3", "Google", "검색 통합", "$12/MTok"],
        ],
      },
    },
    {
      type: "widget",
      widget: {
        type: "highlight-box",
        variant: "tip",
        title: "추천",
        content: "코딩 작업에는 **Claude**, 범용 작업에는 **GPT-5**를 추천합니다.",
      },
    },
  ],

  references: [
    { title: "Anthropic Blog", url: "https://anthropic.com/blog" },
    { title: "OpenAI Docs", url: "https://openai.com/docs" },
  ],
};
