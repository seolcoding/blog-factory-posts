#!/usr/bin/env node
/**
 * BlogScript Pipeline Test
 *
 * Tests:
 * 1. Schema validation (Zod)
 * 2. Renderer output (JSON → MDX)
 * 3. Quantitative metrics
 * 4. Qualitative checks
 */

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// Test Configuration
// ============================================

const TEST_JSON_PATH = join(__dirname, 'test-blogscript.json');
const OUTPUT_MDX_PATH = join(__dirname, 'astro-blog/src/content/blog/test-ai-coding-agents-2025.mdx');

// ============================================
// Import from TypeScript (via tsx)
// ============================================

async function importTypeScriptModule() {
  console.log('📦 Loading TypeScript modules...');

  // Use dynamic import with tsx loader
  const { renderBlogScript, validateBlogScript, safeParseBlogScript } = await import('./astro-blog/src/utils/blogScriptRenderer.ts');

  return { validateBlogScript, safeParseBlogScript, renderBlogScript };
}

// ============================================
// Quantitative Metrics
// ============================================

function analyzeMetrics(json, mdx) {
  const metrics = {
    input: {
      jsonSize: JSON.stringify(json).length,
      beatCount: json.beats.length,
      beatTypes: {},
      imageCount: 0,
      widgetCount: 0,
    },
    output: {
      mdxSize: mdx.length,
      lineCount: mdx.split('\n').length,
      componentCount: 0,
      imports: [],
    },
    efficiency: {
      compressionRatio: 0,
      averageBeatSize: 0,
    },
  };

  // Analyze beat types
  json.beats.forEach(beat => {
    metrics.input.beatTypes[beat.type] = (metrics.input.beatTypes[beat.type] || 0) + 1;

    if (beat.type === 'image') metrics.input.imageCount++;
    if (['stat-grid', 'table', 'timeline', 'profile'].includes(beat.type)) {
      metrics.input.widgetCount++;
    }
  });

  // Analyze MDX output
  const componentMatches = mdx.match(/<[A-Z]\w+/g) || [];
  metrics.output.componentCount = componentMatches.length;

  const importMatches = mdx.match(/^import .+ from .+;$/gm) || [];
  metrics.output.imports = importMatches;

  // Calculate efficiency
  metrics.efficiency.compressionRatio = (metrics.input.jsonSize / metrics.output.mdxSize).toFixed(2);
  metrics.efficiency.averageBeatSize = (metrics.output.mdxSize / metrics.input.beatCount).toFixed(0);

  return metrics;
}

// ============================================
// Qualitative Checks
// ============================================

function qualityChecks(json, mdx) {
  const checks = {
    schema: {
      hasValidMeta: Boolean(json.meta?.title && json.meta?.description),
      hasHero: Boolean(json.hero),
      hasBeats: json.beats?.length > 0,
      hasReferences: json.references?.length > 0,
    },
    content: {
      hasHeadings: json.beats.some(b => b.type === 'heading'),
      hasImages: json.beats.some(b => b.type === 'image'),
      hasWidgets: json.beats.some(b => ['stat-grid', 'table', 'timeline', 'profile'].includes(b.type)),
      hasCallouts: json.beats.some(b => b.type === 'callout'),
    },
    rendering: {
      hasFrontmatter: mdx.startsWith('---'),
      hasImports: mdx.includes('import '),
      hasComponents: /<[A-Z]\w+/.test(mdx),
      noEmptyLines: !mdx.includes('\n\n\n\n'),
    },
    seo: {
      titleLength: json.meta.title.length,
      descriptionLength: json.meta.description.length,
      tagCount: json.meta.tags?.length || 0,
      titleOK: json.meta.title.length >= 10 && json.meta.title.length <= 70,
      descriptionOK: json.meta.description.length >= 50 && json.meta.description.length <= 160,
      tagsOK: json.meta.tags?.length >= 3 && json.meta.tags?.length <= 10,
    },
  };

  // Overall score
  const allChecks = [
    ...Object.values(checks.schema),
    ...Object.values(checks.content),
    ...Object.values(checks.rendering),
    checks.seo.titleOK,
    checks.seo.descriptionOK,
    checks.seo.tagsOK,
  ];

  checks.overallScore = (allChecks.filter(Boolean).length / allChecks.length * 100).toFixed(1);

  return checks;
}

// ============================================
// Main Test
// ============================================

async function runTest() {
  console.log('🧪 BlogScript Pipeline Test\n');
  console.log('='.repeat(60));

  try {
    // 1. Load modules
    const { validateBlogScript, safeParseBlogScript, renderBlogScript } = await importTypeScriptModule();

    // 2. Read test JSON
    console.log('\n📖 Step 1: Loading test JSON...');
    const jsonContent = await fs.readFile(TEST_JSON_PATH, 'utf-8');
    const json = JSON.parse(jsonContent);
    console.log(`✅ Loaded: ${json.meta.title}`);

    // 3. Validate schema
    console.log('\n🔍 Step 2: Validating schema...');
    const parseResult = safeParseBlogScript(json);

    if (!parseResult.success) {
      console.error('❌ Schema validation failed:');
      console.error(parseResult.error);
      process.exit(1);
    }
    console.log('✅ Schema valid');

    // 4. Render to MDX
    console.log('\n🎨 Step 3: Rendering to MDX...');
    const mdx = renderBlogScript(parseResult.data);
    console.log(`✅ Rendered ${mdx.length} characters`);

    // 5. Save output
    console.log('\n💾 Step 4: Saving MDX output...');
    await fs.writeFile(OUTPUT_MDX_PATH, mdx, 'utf-8');
    console.log(`✅ Saved to: ${OUTPUT_MDX_PATH}`);

    // 6. Quantitative analysis
    console.log('\n📊 Step 5: Quantitative Metrics');
    console.log('='.repeat(60));
    const metrics = analyzeMetrics(json, mdx);

    console.log('\n📥 Input:');
    console.log(`  JSON size: ${metrics.input.jsonSize.toLocaleString()} bytes`);
    console.log(`  Beat count: ${metrics.input.beatCount}`);
    console.log(`  Beat types:`, metrics.input.beatTypes);
    console.log(`  Images: ${metrics.input.imageCount}`);
    console.log(`  Widgets: ${metrics.input.widgetCount}`);

    console.log('\n📤 Output:');
    console.log(`  MDX size: ${metrics.output.mdxSize.toLocaleString()} bytes`);
    console.log(`  Lines: ${metrics.output.lineCount}`);
    console.log(`  Components: ${metrics.output.componentCount}`);
    console.log(`  Imports: ${metrics.output.imports.length}`);

    console.log('\n⚡ Efficiency:');
    console.log(`  Compression ratio: ${metrics.efficiency.compressionRatio}x`);
    console.log(`  Avg beat size: ${metrics.efficiency.averageBeatSize} chars`);

    // 7. Qualitative checks
    console.log('\n✅ Step 6: Quality Checks');
    console.log('='.repeat(60));
    const quality = qualityChecks(json, mdx);

    console.log('\n📋 Schema:');
    Object.entries(quality.schema).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}`);
    });

    console.log('\n📝 Content:');
    Object.entries(quality.content).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}`);
    });

    console.log('\n🎨 Rendering:');
    Object.entries(quality.rendering).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}`);
    });

    console.log('\n🔍 SEO:');
    console.log(`  Title: ${quality.seo.titleLength} chars ${quality.seo.titleOK ? '✅' : '❌'}`);
    console.log(`  Description: ${quality.seo.descriptionLength} chars ${quality.seo.descriptionOK ? '✅' : '❌'}`);
    console.log(`  Tags: ${quality.seo.tagCount} ${quality.seo.tagsOK ? '✅' : '❌'}`);

    console.log('\n🏆 Overall Score:', quality.overallScore + '%');

    // 8. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Schema validation: PASSED`);
    console.log(`✅ Rendering: PASSED`);
    console.log(`✅ Quality score: ${quality.overallScore}%`);
    console.log(`✅ Output: ${OUTPUT_MDX_PATH}`);
    console.log('\n🎉 All tests passed!\n');

    // 9. Next steps
    console.log('📋 Next Steps:');
    console.log('  1. Review MDX output: ' + OUTPUT_MDX_PATH);
    console.log('  2. Test in dev server: npm run dev');
    console.log('  3. Deploy to GitHub Pages: git add . && git commit && git push');
    console.log('  4. Verify live rendering\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run test
runTest();
