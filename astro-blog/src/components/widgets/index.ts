/**
 * Widget Components for Blog Factory
 *
 * A collection of rich, reusable widget components for blog content.
 * All components support dark mode and use the theme's CSS variables.
 *
 * @example
 * // Import individual components
 * import StatCard from "@/components/widgets/StatCard.astro";
 * import ProfileCard from "@/components/widgets/ProfileCard.astro";
 *
 * // Or import types
 * import type { Props as StatCardProps } from "@/components/widgets/StatCard.astro";
 */

// Re-export component paths for reference
export const widgets = {
  StatCard: "@/components/widgets/StatCard.astro",
  ProfileCard: "@/components/widgets/ProfileCard.astro",
  QuoteBox: "@/components/widgets/QuoteBox.astro",
  ComparisonTable: "@/components/widgets/ComparisonTable.astro",
  TimelineItem: "@/components/widgets/TimelineItem.astro",
  HighlightBox: "@/components/widgets/HighlightBox.astro",
} as const;

export type WidgetName = keyof typeof widgets;
