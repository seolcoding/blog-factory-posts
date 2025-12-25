"""Pytest configuration and fixtures for Blog Factory tests."""

import json
import os
from pathlib import Path

import pytest

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent


@pytest.fixture
def project_root() -> Path:
    """Return the project root directory."""
    return PROJECT_ROOT


@pytest.fixture
def data_dir(project_root: Path) -> Path:
    """Return the data directory."""
    return project_root / "data"


@pytest.fixture
def feature_list(data_dir: Path) -> dict:
    """Load and return the feature list."""
    feature_file = data_dir / "feature_list.json"
    with open(feature_file, encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def mcp_config(project_root: Path) -> dict:
    """Load and return the MCP configuration."""
    mcp_file = project_root / ".mcp" / "mcp.json"
    with open(mcp_file, encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def env_example(project_root: Path) -> str:
    """Load and return the .env.example content."""
    env_file = project_root / ".env.example"
    with open(env_file, encoding="utf-8") as f:
        return f.read()
