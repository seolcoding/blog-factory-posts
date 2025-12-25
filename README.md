# Blog Factory

> 24/7 Autonomous Viral Content Production System

## Overview

Blog Factory is an autonomous multi-agent system that generates, publishes, and optimizes viral blog content. Built on Anthropic's Orchestrator-Worker pattern.

## Quick Start

```bash
# 1. Initialize environment
./scripts/init.sh

# 2. Configure credentials
cp .env.example .env
# Edit .env with your API keys

# 3. Run tests
uv run pytest tests/ -v

# 4. Start orchestrator (coming soon)
uv run blog-factory
```

## MCP Servers

| Server | Purpose |
|--------|---------|
| **trendkit** | Google Trends - realtime trends, keyword comparison |
| **deepnews** | Korean news - search, analysis, timeline |
| **naver-search** | Naver - news, DataLab trends |
| **github** | Publishing - commits, PRs |

## Architecture

```
Orchestrator (Claude Opus/Sonnet)
    ├── Researcher Agent → Trend collection
    ├── Writer Agent → Content generation
    └── Publisher Agent → GitHub Pages deployment
```

## Status

See `data/feature_list.json` for current progress.

## License

MIT
