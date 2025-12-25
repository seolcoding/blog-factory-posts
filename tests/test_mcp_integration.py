"""Tests for MCP server integration."""

import subprocess
import pytest
from pathlib import Path


class TestMCPServerAvailability:
    """Test that MCP servers are available."""

    def test_trendkit_directory_exists(self):
        """Trendkit project should exist."""
        trendkit_path = Path("/Users/sdh/Dev/02_production/trendkit")
        assert trendkit_path.exists(), "trendkit not found"
        assert (trendkit_path / "pyproject.toml").exists()

    def test_trendkit_mcp_entry_point(self):
        """Trendkit should have MCP entry point."""
        trendkit_path = Path("/Users/sdh/Dev/02_production/trendkit")
        mcp_server = trendkit_path / "src" / "trendkit" / "mcp_server.py"
        assert mcp_server.exists(), "trendkit mcp_server.py not found"

    def test_npx_available(self):
        """npx should be available for naver-search and github MCPs."""
        result = subprocess.run(
            ["which", "npx"],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, "npx not found"

    def test_uv_available(self):
        """uv should be available for trendkit MCP."""
        result = subprocess.run(
            ["which", "uv"],
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, "uv not found"


class TestMCPConfiguration:
    """Test MCP configuration validity."""

    def test_trendkit_config(self, mcp_config: dict):
        """Trendkit config should have correct structure."""
        trendkit = mcp_config["mcpServers"]["trendkit"]
        assert trendkit["command"] == "uv"
        assert "trendkit-mcp" in trendkit["args"]

    def test_deepnews_sse_config(self, mcp_config: dict):
        """Deepnews config should be SSE type."""
        deepnews = mcp_config["mcpServers"]["deepnews"]
        assert deepnews["type"] == "sse"
        assert "url" in deepnews
        assert "seolcoding.com" in deepnews["url"]

    def test_naver_search_config(self, mcp_config: dict):
        """Naver search config should have env vars."""
        naver = mcp_config["mcpServers"]["naver-search"]
        assert naver["command"] == "npx"
        assert "env" in naver
        assert "NAVER_CLIENT_ID" in naver["env"]
        assert "NAVER_CLIENT_SECRET" in naver["env"]

    def test_github_config(self, mcp_config: dict):
        """GitHub config should have token env var."""
        github = mcp_config["mcpServers"]["github"]
        assert github["command"] == "npx"
        assert "env" in github
        assert "GITHUB_TOKEN" in github["env"]


@pytest.mark.integration
class TestMCPConnections:
    """Integration tests for MCP connections.

    These tests require actual credentials and network access.
    Run with: pytest -m integration
    """

    @pytest.mark.skip(reason="Requires network and credentials")
    def test_trendkit_responds(self):
        """Trendkit MCP should respond to requests."""
        # This would require MCP client to test
        pass

    @pytest.mark.skip(reason="Requires network")
    def test_deepnews_sse_reachable(self):
        """Deepnews SSE endpoint should be reachable."""
        import httpx
        response = httpx.get(
            "https://deepnews-playmcp.seolcoding.com/health",
            timeout=10,
        )
        assert response.status_code == 200
