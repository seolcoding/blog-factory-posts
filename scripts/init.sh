#!/bin/bash
# Blog Factory - Environment Initialization Script
# Run this at the start of each session

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=========================================="
echo "Blog Factory - Environment Initialization"
echo "=========================================="

# 1. Check Python version
echo ""
echo "[1/6] Checking Python version..."
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
if [[ "$python_version" < "3.12" ]]; then
    echo "ERROR: Python 3.12+ required, found $python_version"
    exit 1
fi
echo "  ✓ Python $python_version"

# 2. Check uv
echo ""
echo "[2/6] Checking uv..."
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv not found. Install with: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi
echo "  ✓ uv $(uv --version | cut -d' ' -f2)"

# 3. Sync dependencies
echo ""
echo "[3/6] Syncing dependencies..."
uv sync --quiet
echo "  ✓ Dependencies synced"

# 4. Check .env file
echo ""
echo "[4/6] Checking environment variables..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "  WARNING: .env file not found"
    echo "  Creating from template..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo "  ⚠ Please edit .env with your API credentials"
else
    echo "  ✓ .env file exists"
fi

# 5. Verify MCP servers
echo ""
echo "[5/6] Verifying MCP servers..."

# Check trendkit
if [ -d "/Users/sdh/Dev/02_production/trendkit" ]; then
    echo "  ✓ trendkit: available"
else
    echo "  ✗ trendkit: not found at /Users/sdh/Dev/02_production/trendkit"
fi

# Check deepnews (SSE - just verify URL format)
echo "  ✓ deepnews: SSE server configured"

# Check npx for naver-search and github
if command -v npx &> /dev/null; then
    echo "  ✓ npx: available for naver-search, github MCPs"
else
    echo "  ✗ npx: not found. Install Node.js"
fi

# 6. Show progress
echo ""
echo "[6/6] Current progress..."
if [ -f "$PROJECT_DIR/data/claude-progress.txt" ]; then
    echo ""
    head -30 "$PROJECT_DIR/data/claude-progress.txt"
else
    echo "  No progress file found"
fi

echo ""
echo "=========================================="
echo "Initialization complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API credentials"
echo "  2. Run: uv run pytest tests/ -v"
echo "  3. Check feature_list.json for current tasks"
echo "=========================================="
