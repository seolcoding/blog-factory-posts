"""Agent prompt executor for Claude Code.

This module provides utilities to load and prepare agent prompts
for execution in Claude Code's MCP-enabled environment.

Note: Actual execution happens in Claude Code, not via Anthropic SDK.
"""

import json
from datetime import datetime
from pathlib import Path

from .models import PublishResult, TopicResearch

PROJECT_ROOT = Path(__file__).parent.parent
PROMPTS_DIR = PROJECT_ROOT / "agent" / "prompts"
DATA_DIR = PROJECT_ROOT / "data"


class PromptExecutor:
    """Load and prepare agent prompts for execution."""

    @staticmethod
    def load_prompt(agent_name: str) -> str:
        """Load agent prompt template.

        Args:
            agent_name: Name of agent (researcher, writer, publisher)

        Returns:
            Prompt template content
        """
        prompt_file = PROMPTS_DIR / f"{agent_name}.md"

        if not prompt_file.exists():
            raise FileNotFoundError(f"Prompt not found: {prompt_file}")

        return prompt_file.read_text(encoding="utf-8")

    @staticmethod
    def save_research(research: TopicResearch) -> Path:
        """Save research results to data/topics/.

        Args:
            research: Research output

        Returns:
            Path to saved file
        """
        topics_dir = DATA_DIR / "topics"
        topics_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y-%m-%d-%H")
        filepath = topics_dir / f"{timestamp}.json"

        filepath.write_text(
            research.model_dump_json(indent=2),
            encoding="utf-8",
        )

        return filepath

    @staticmethod
    def load_latest_research() -> TopicResearch | None:
        """Load the most recent research results.

        Returns:
            Latest research or None if no research exists
        """
        topics_dir = DATA_DIR / "topics"

        if not topics_dir.exists():
            return None

        topic_files = sorted(topics_dir.glob("*.json"), reverse=True)

        if not topic_files:
            return None

        data = json.loads(topic_files[0].read_text(encoding="utf-8"))
        return TopicResearch(**data)

    @staticmethod
    def save_draft(content: str, slug: str) -> Path:
        """Save blog post draft.

        Args:
            content: Full markdown content with frontmatter
            slug: URL slug for filename

        Returns:
            Path to saved draft
        """
        drafts_dir = DATA_DIR / "drafts"
        drafts_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y-%m-%d")
        filename = f"{timestamp}-{slug}.md"

        filepath = drafts_dir / filename
        filepath.write_text(content, encoding="utf-8")

        return filepath

    @staticmethod
    def load_latest_draft() -> tuple[Path, str] | None:
        """Load the most recent draft.

        Returns:
            Tuple of (path, content) or None if no drafts exist
        """
        drafts_dir = DATA_DIR / "drafts"

        if not drafts_dir.exists():
            return None

        draft_files = sorted(drafts_dir.glob("*.md"), reverse=True)

        if not draft_files:
            return None

        latest = draft_files[0]
        return latest, latest.read_text(encoding="utf-8")

    @staticmethod
    def save_publish_result(result: PublishResult) -> Path:
        """Save publishing result.

        Args:
            result: Publishing result

        Returns:
            Path to saved result
        """
        published_dir = DATA_DIR / "published"
        published_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y-%m-%d")
        filepath = published_dir / f"{timestamp}.json"

        # Append to existing file or create new
        if filepath.exists():
            existing = json.loads(filepath.read_text(encoding="utf-8"))
            existing.append(result.model_dump(mode="json"))
            data = existing
        else:
            data = [result.model_dump(mode="json")]

        filepath.write_text(
            json.dumps(data, indent=2, ensure_ascii=False, default=str),
            encoding="utf-8",
        )

        return filepath

    @staticmethod
    def ensure_data_directories() -> None:
        """Create all required data directories."""
        directories = [
            DATA_DIR / "topics",
            DATA_DIR / "drafts",
            DATA_DIR / "published",
            DATA_DIR / "analytics",
        ]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)


# Singleton instance
executor = PromptExecutor()
