"""Tests for project structure and configuration."""

import json
from pathlib import Path

import pytest


class TestDirectoryStructure:
    """Test that required directories exist."""

    REQUIRED_DIRS = [
        ".mcp",
        ".claude/commands",
        "agent/prompts",
        "blog/_posts",
        "blog/_drafts",
        "content/ideas",
        "content/drafts",
        "content/review",
        "content/published",
        "data/trends",
        "data/analytics",
        "scripts",
        "tests",
    ]

    def test_required_directories_exist(self, project_root: Path):
        """All required directories should exist."""
        for dir_path in self.REQUIRED_DIRS:
            full_path = project_root / dir_path
            assert full_path.exists(), f"Directory not found: {dir_path}"
            assert full_path.is_dir(), f"Not a directory: {dir_path}"


class TestConfigurationFiles:
    """Test that configuration files are valid."""

    def test_pyproject_toml_exists(self, project_root: Path):
        """pyproject.toml should exist."""
        pyproject = project_root / "pyproject.toml"
        assert pyproject.exists()

    def test_mcp_config_valid_json(self, mcp_config: dict):
        """MCP config should be valid JSON with mcpServers key."""
        assert "mcpServers" in mcp_config
        assert isinstance(mcp_config["mcpServers"], dict)

    def test_mcp_required_servers(self, mcp_config: dict):
        """Required MCP servers should be configured."""
        servers = mcp_config["mcpServers"]
        required = ["trendkit", "deepnews", "naver-search", "github"]
        for server in required:
            assert server in servers, f"MCP server not configured: {server}"

    def test_feature_list_valid_structure(self, feature_list: dict):
        """Feature list should have valid structure."""
        assert "project" in feature_list
        assert "phases" in feature_list
        assert "phase_1" in feature_list["phases"]
        assert "features" in feature_list["phases"]["phase_1"]

    def test_env_example_has_required_vars(self, env_example: str):
        """Environment template should have required variables."""
        required_vars = [
            "NAVER_CLIENT_ID",
            "NAVER_CLIENT_SECRET",
            "GITHUB_TOKEN",
        ]
        for var in required_vars:
            assert var in env_example, f"Missing env var: {var}"


class TestFeatureList:
    """Test feature list structure and content."""

    def test_all_features_have_required_fields(self, feature_list: dict):
        """Each feature should have id, category, description, passing."""
        for phase_name, phase_data in feature_list["phases"].items():
            for feature in phase_data.get("features", []):
                assert "id" in feature, f"Feature missing id in {phase_name}"
                assert "category" in feature, f"Feature {feature['id']} missing category"
                assert "description" in feature, f"Feature {feature['id']} missing description"
                assert "passing" in feature, f"Feature {feature['id']} missing passing"

    def test_feature_ids_unique(self, feature_list: dict):
        """All feature IDs should be unique across phases."""
        all_ids = []
        for phase_data in feature_list["phases"].values():
            for feature in phase_data.get("features", []):
                all_ids.append(feature["id"])
        assert len(all_ids) == len(set(all_ids)), "Duplicate feature IDs found"

    def test_statistics_match_features(self, feature_list: dict):
        """Statistics should match actual feature counts."""
        total = 0
        passing = 0
        for phase_data in feature_list["phases"].values():
            for feature in phase_data.get("features", []):
                total += 1
                if feature["passing"]:
                    passing += 1

        stats = feature_list["statistics"]
        assert stats["total_features"] == total
        assert stats["passing"] == passing
        assert stats["failing"] == total - passing


class TestScripts:
    """Test that scripts are properly configured."""

    def test_init_script_exists(self, project_root: Path):
        """init.sh should exist and be executable."""
        init_script = project_root / "scripts" / "init.sh"
        assert init_script.exists()
        # Check executable bit
        import os
        assert os.access(init_script, os.X_OK), "init.sh is not executable"

    def test_init_script_has_shebang(self, project_root: Path):
        """init.sh should have proper shebang."""
        init_script = project_root / "scripts" / "init.sh"
        with open(init_script) as f:
            first_line = f.readline()
        assert first_line.startswith("#!/bin/bash"), "Missing bash shebang"
