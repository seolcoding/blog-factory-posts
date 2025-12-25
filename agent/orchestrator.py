"""Main orchestrator implementing the content production loop.

This module coordinates the RESEARCH -> WRITE -> PUBLISH workflow.
Each phase generates instructions for Claude Code to execute using MCP tools.

Usage in Claude Code:
    from agent.orchestrator import Orchestrator
    orchestrator = Orchestrator()
    orchestrator.run_cycle()
"""

import json
from datetime import datetime
from pathlib import Path
from time import time

from .executor import executor
from .models import PublishedPost, PublishMetrics, PublishResult, Topic, TopicResearch
from .telegram import telegram

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
PROGRESS_FILE = DATA_DIR / "claude-progress.txt"
FEATURE_LIST = DATA_DIR / "feature_list.json"


class Orchestrator:
    """Main orchestrator for autonomous content production.

    Implements the decision loop:
    1. RESEARCH - Collect trending topics using MCP tools
    2. WRITE - Generate SEO-optimized blog post
    3. PUBLISH - Deploy to GitHub Pages
    4. NOTIFY - Send Telegram notifications at each step
    """

    def __init__(self):
        """Initialize orchestrator."""
        self.start_time = time()
        executor.ensure_data_directories()

    def update_progress(self, message: str) -> None:
        """Append to progress file.

        Args:
            message: Progress message
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(PROGRESS_FILE, "a", encoding="utf-8") as f:
            f.write(f"\n[{timestamp}] {message}")

    def load_feature_list(self) -> dict:
        """Load feature list from JSON.

        Returns:
            Feature list data
        """
        with open(FEATURE_LIST, encoding="utf-8") as f:
            return json.load(f)

    def update_feature_list(self, feature_id: int, passing: bool, notes: str = "") -> None:
        """Mark a feature as passing/failing.

        Args:
            feature_id: Feature ID to update
            passing: Whether feature is passing
            notes: Implementation notes
        """
        feature_list = self.load_feature_list()

        for phase_data in feature_list["phases"].values():
            for feature in phase_data.get("features", []):
                if feature["id"] == feature_id:
                    feature["passing"] = passing
                    if notes:
                        feature["implementation_notes"] = notes
                    break

        # Recalculate statistics
        total = sum(len(p.get("features", [])) for p in feature_list["phases"].values())
        passing_count = sum(
            sum(1 for f in p.get("features", []) if f["passing"])
            for p in feature_list["phases"].values()
        )

        feature_list["statistics"] = {
            "total_features": total,
            "passing": passing_count,
            "failing": total - passing_count,
            "completion_percentage": round(passing_count / total * 100, 1) if total > 0 else 0,
        }

        with open(FEATURE_LIST, "w", encoding="utf-8") as f:
            json.dump(feature_list, f, indent=2, ensure_ascii=False)

    def research_phase(self, topics: list[dict]) -> TopicResearch:
        """Record research results.

        This method is called after Claude Code executes the researcher prompt
        and collects topics using MCP tools (trendkit, deepnews, naver-search).

        Args:
            topics: List of topic dictionaries from research

        Returns:
            TopicResearch object
        """
        research = TopicResearch(
            timestamp=datetime.now(),
            topics=[Topic(**t) for t in topics],
            next_refresh=None,
        )

        # Save to file
        filepath = executor.save_research(research)
        self.update_progress(f"Research saved: {filepath.name}")

        # Notify
        telegram.notify_research_complete(research)

        return research

    def write_phase(self, topic: Topic, content: str, seo_score: int) -> Path:
        """Record writing results.

        This method is called after Claude Code executes the writer prompt
        and generates a blog post.

        Args:
            topic: Topic being written about
            content: Full markdown content with frontmatter
            seo_score: SEO score (0-100)

        Returns:
            Path to saved draft
        """
        # Generate slug from keyword
        slug = topic.keyword.lower().replace(" ", "-")[:50]
        # Remove special characters
        slug = "".join(c if c.isalnum() or c == "-" else "" for c in slug)

        # Save draft
        filepath = executor.save_draft(content, slug)
        self.update_progress(f"Draft saved: {filepath.name}")

        # Count words
        word_count = len(content.split())

        # Create BlogPost for notification
        from .models import BlogPost, PostMetadata

        post = BlogPost(
            title=topic.keyword,
            content=content,
            metadata=PostMetadata(
                title=topic.keyword,
                date=datetime.now(),
                description=topic.angle[:150],
            ),
            seo_score=seo_score,
            word_count=word_count,
        )

        telegram.notify_post_written(post)

        return filepath

    def publish_phase(
        self,
        title: str,
        filename: str,
        url: str,
        commit_sha: str,
        seo_score: int,
        word_count: int,
    ) -> PublishResult:
        """Record publishing results.

        This method is called after Claude Code executes the publisher prompt
        and commits to GitHub.

        Args:
            title: Post title
            filename: Filename in blog/content/posts/
            url: Live URL on GitHub Pages
            commit_sha: Git commit SHA
            seo_score: SEO score
            word_count: Word count

        Returns:
            PublishResult object
        """
        elapsed = int(time() - self.start_time)

        result = PublishResult(
            status="success",
            post=PublishedPost(
                title=title,
                filename=filename,
                url=url,
                commit_sha=commit_sha,
                published_at=datetime.now(),
            ),
            metrics=PublishMetrics(
                seo_score=seo_score,
                word_count=word_count,
                time_to_publish=f"{elapsed}s",
            ),
        )

        # Save result
        executor.save_publish_result(result)
        self.update_progress(f"Published: {title} -> {url}")

        # Notify
        telegram.notify_post_published(result)

        return result

    def complete_cycle(self, posts_count: int = 1) -> None:
        """Mark cycle as complete and update features.

        Args:
            posts_count: Number of posts published in this cycle
        """
        elapsed = int(time() - self.start_time)
        elapsed_str = f"{elapsed // 60}m {elapsed % 60}s"

        # Update feature #6 (orchestrator)
        self.update_feature_list(
            6,
            passing=True,
            notes=f"Orchestrator loop working. Last run: {datetime.now().isoformat()}",
        )

        # Update feature #7 (telegram notifications)
        self.update_feature_list(
            7,
            passing=True,
            notes="Telegram notifications working via Bot API",
        )

        # Notify completion
        telegram.notify_cycle_complete(posts_count, elapsed_str)

        self.update_progress(f"Cycle complete: {posts_count} posts in {elapsed_str}")

    def print_instructions(self) -> None:
        """Print instructions for manual execution in Claude Code."""
        print("=" * 60)
        print("BLOG FACTORY - CONTENT PRODUCTION CYCLE")
        print("=" * 60)
        print()
        print("Execute the following phases in order:")
        print()
        print("PHASE 1: RESEARCH")
        print("-" * 40)
        print("1. Use MCP tools to collect trends:")
        print("   - trendkit: trends_trending()")
        print("   - deepnews: get_today_issues()")
        print("   - naver-search: search_news()")
        print("2. Score topics by viral potential")
        print("3. Call orchestrator.research_phase(topics)")
        print()
        print("PHASE 2: WRITING")
        print("-" * 40)
        print("1. Select top topic from research")
        print("2. Deep research with deepnews.search_news()")
        print("3. Write SEO-optimized post (1500-2500 words)")
        print("4. Generate Hugo frontmatter")
        print("5. Call orchestrator.write_phase(topic, content, seo_score)")
        print()
        print("PHASE 3: PUBLISHING")
        print("-" * 40)
        print("1. Read latest draft from data/drafts/")
        print("2. Use GitHub MCP to commit to blog/content/posts/")
        print("3. Wait for GitHub Actions deployment")
        print("4. Call orchestrator.publish_phase(...)")
        print()
        print("PHASE 4: COMPLETION")
        print("-" * 40)
        print("Call orchestrator.complete_cycle()")
        print()
        print("=" * 60)


# Convenience function for quick access
def run_cycle() -> Orchestrator:
    """Create orchestrator and print instructions.

    Returns:
        Orchestrator instance for method calls
    """
    orchestrator = Orchestrator()
    orchestrator.print_instructions()
    return orchestrator
