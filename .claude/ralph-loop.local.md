# Ralph Loop Progress

## Current Status
- **Iteration**: 14
- **Total Posts**: 35
- **Last Update**: 2025-12-26 14:00 KST

## Iteration 14 Summary

### Completed Tasks
1. ✅ Fixed BASE_URL routing issues for GitHub Pages subdirectory
   - Added base prefix to Card, Tag, Layout, PostDetails, RSS components
   - All internal links now correctly include `/blog-factory-posts/`

2. ✅ Created 9 new trending blog posts:
   - `openai-o3-agi-milestone.md` - OpenAI o3 and AGI analysis
   - `2025-us-stock-investment-guide.md` - US stock trends, Tesla FSD
   - `2025-education-ai-revolution.md` - Education AI trends
   - `cursor-ai-coding-tools-2025.md` - Cursor IDE 2.0 guide (featured)
   - `korea-ai-startups-2025.md` - Korean AI startups (Liner, Wrtn, etc.)
   - `ai-coding-agents-comparison-2025.md` - Claude Code vs Devin vs Cursor
   - `apple-intelligence-korean-guide.md` - Apple Intelligence Korean support
   - `mcp-model-context-protocol-guide.md` - MCP development guide (featured)
   - `gta6-2026-release-info.md` - GTA6 release information

### Blog Stats
- Total posts: 35
- Deployed to: https://seolcoding.github.io/blog-factory-posts/
- Framework: Astro + AstroPaper theme

### User Feedback
- Meme usage is too repetitive - need more diverse, human-like meme selection
- TODO: Create better meme search/selection agent

## Next Iteration Tasks
- [ ] Search for more trending topics
- [ ] Create posts with more diverse meme usage
- [ ] Consider lifestyle/entertainment topics

## Technical Notes
- Astro base URL: `/blog-factory-posts`
- All href links must use `${base}${path}` pattern
- Posts with future dates are filtered out by default
