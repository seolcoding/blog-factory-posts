"""Content enrichment pipeline for viral blog posts.

This module provides reusable components for enriching blog content with:
- GIFs from Giphy
- Memes and humor from Reddit
- Trending topics from various sources
- External references and citations

Usage in Claude Code:
    from agent.content_enricher import enricher

    # Get relevant GIFs for a topic
    gifs = enricher.search_gifs("AI coding")

    # Get trending memes from Reddit
    memes = enricher.get_reddit_memes("artificial")

    # Enrich a blog post with all elements
    enriched = enricher.enrich_post(content, topic="AI")
"""

import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx

# Giphy API configuration
GIPHY_API_KEY = "dc6zaTOxFJmzC"  # Public beta key for development
GIPHY_SEARCH_URL = "https://api.giphy.com/v1/gifs/search"
GIPHY_TRENDING_URL = "https://api.giphy.com/v1/gifs/trending"

# Reddit API configuration (no auth needed for public endpoints)
REDDIT_BASE_URL = "https://www.reddit.com"


@dataclass
class GifResult:
    """A GIF result from Giphy."""

    url: str
    title: str
    preview_url: str
    width: int
    height: int

    def to_markdown(self, alt_text: str = "") -> str:
        """Convert to markdown image format."""
        alt = alt_text or self.title
        return f"![{alt}]({self.url})"


@dataclass
class MemeResult:
    """A meme result from Reddit."""

    title: str
    url: str
    subreddit: str
    score: int
    permalink: str
    is_image: bool = True

    def to_markdown(self) -> str:
        """Convert to markdown format."""
        if self.is_image:
            return f"![{self.title}]({self.url})\n*출처: [r/{self.subreddit}](https://reddit.com{self.permalink})*"
        return f"[{self.title}](https://reddit.com{self.permalink}) - r/{self.subreddit}"


@dataclass
class HumorElement:
    """A humor element (joke, meme text, etc.)."""

    content: str
    source: str
    category: str  # "meme", "joke", "quote", "reaction"

    def to_markdown(self) -> str:
        """Convert to markdown blockquote."""
        return f"> {self.content}\n> — *{self.source}*"


@dataclass
class EnrichmentResult:
    """Result of content enrichment."""

    gifs: list[GifResult] = field(default_factory=list)
    memes: list[MemeResult] = field(default_factory=list)
    humor: list[HumorElement] = field(default_factory=list)
    references: list[str] = field(default_factory=list)

    def get_random_gif(self) -> Optional[GifResult]:
        """Get a random GIF from results."""
        import random
        return random.choice(self.gifs) if self.gifs else None

    def get_top_meme(self) -> Optional[MemeResult]:
        """Get the highest-scored meme."""
        return max(self.memes, key=lambda m: m.score) if self.memes else None


class ContentEnricher:
    """Pipeline for enriching blog content with viral elements."""

    # Common humor patterns for AI content
    AI_HUMOR_TEMPLATES = [
        HumorElement(
            content="AI: '개발자 대체할게요' / 현실: '다시 실행해주세요, 에러났어요'",
            source="개발자 커뮤니티",
            category="meme"
        ),
        HumorElement(
            content="코드 리뷰 AI: '이 코드는 개선이 필요합니다' / 그 코드: AI가 작성한 코드",
            source="r/ProgrammerHumor",
            category="meme"
        ),
        HumorElement(
            content="GPT한테 물어봤는데... / 그냥 Magic 8 Ball 흔들어봐",
            source="Twitter Meme",
            category="reaction"
        ),
        HumorElement(
            content="Claude: 'Processing... Analyzing... Thinking...' / 실제로 하는 일: 아무것도 안 함",
            source="ProgrammerHumor.io",
            category="meme"
        ),
    ]

    # Recommended GIFs by topic
    TOPIC_GIFS = {
        "ai": [
            "https://media.giphy.com/media/LmNwrBhejkK9EFP504/giphy.gif",  # typing
            "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",  # loading
            "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzBmN2Y2YjI3MTFhNDhkMzY0ZWJjNGVlN2RlZTk4YjVlNzhhMjhmZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/jUwpNzg9IcyrK/giphy.gif",  # relief
        ],
        "coding": [
            "https://media.giphy.com/media/LmNwrBhejkK9EFP504/giphy.gif",  # typing fast
            "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif",  # success
            "https://media.giphy.com/media/l0IylOPCNkiqOgMyA/giphy.gif",  # future
        ],
        "success": [
            "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif",
            "https://media.giphy.com/media/l0IylOPCNkiqOgMyA/giphy.gif",
        ],
        "error": [
            "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",  # plug
        ],
    }

    # Reddit subreddits by topic
    TOPIC_SUBREDDITS = {
        "ai": ["artificial", "ChatGPT", "MachineLearning", "ClaudeAI"],
        "coding": ["ProgrammerHumor", "programming", "learnprogramming"],
        "tech": ["technology", "technews", "gadgets"],
        "meme": ["memes", "dankmemes", "me_irl"],
    }

    def __init__(self):
        """Initialize the content enricher."""
        self.client = httpx.Client(
            timeout=10.0,
            headers={"User-Agent": "BlogFactory/1.0"}
        )

    def search_gifs(
        self,
        query: str,
        limit: int = 5,
        rating: str = "g"
    ) -> list[GifResult]:
        """Search for GIFs on Giphy.

        Args:
            query: Search query
            limit: Maximum number of results
            rating: Content rating (g, pg, pg-13, r)

        Returns:
            List of GIF results
        """
        try:
            response = self.client.get(
                GIPHY_SEARCH_URL,
                params={
                    "api_key": GIPHY_API_KEY,
                    "q": query,
                    "limit": limit,
                    "rating": rating,
                    "lang": "ko",
                }
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for gif in data.get("data", []):
                images = gif.get("images", {})
                original = images.get("original", {})
                preview = images.get("fixed_height", {})

                results.append(GifResult(
                    url=original.get("url", ""),
                    title=gif.get("title", ""),
                    preview_url=preview.get("url", ""),
                    width=int(original.get("width", 0)),
                    height=int(original.get("height", 0)),
                ))

            return results

        except Exception as e:
            print(f"Giphy search error: {e}")
            return []

    def get_trending_gifs(self, limit: int = 10) -> list[GifResult]:
        """Get trending GIFs from Giphy.

        Args:
            limit: Maximum number of results

        Returns:
            List of trending GIF results
        """
        try:
            response = self.client.get(
                GIPHY_TRENDING_URL,
                params={
                    "api_key": GIPHY_API_KEY,
                    "limit": limit,
                    "rating": "g",
                }
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for gif in data.get("data", []):
                images = gif.get("images", {})
                original = images.get("original", {})

                results.append(GifResult(
                    url=original.get("url", ""),
                    title=gif.get("title", ""),
                    preview_url=images.get("fixed_height", {}).get("url", ""),
                    width=int(original.get("width", 0)),
                    height=int(original.get("height", 0)),
                ))

            return results

        except Exception as e:
            print(f"Giphy trending error: {e}")
            return []

    def get_reddit_memes(
        self,
        subreddit: str = "memes",
        limit: int = 10,
        time_filter: str = "week"
    ) -> list[MemeResult]:
        """Get top memes from a Reddit subreddit.

        Args:
            subreddit: Subreddit name
            limit: Maximum number of results
            time_filter: Time filter (hour, day, week, month, year, all)

        Returns:
            List of meme results
        """
        try:
            url = f"{REDDIT_BASE_URL}/r/{subreddit}/top.json"
            response = self.client.get(
                url,
                params={
                    "limit": limit,
                    "t": time_filter,
                },
                follow_redirects=True,
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for post in data.get("data", {}).get("children", []):
                post_data = post.get("data", {})

                # Filter for image posts
                url = post_data.get("url", "")
                is_image = any(url.endswith(ext) for ext in [".jpg", ".png", ".gif", ".webp"])

                if post_data.get("is_self"):
                    continue

                results.append(MemeResult(
                    title=post_data.get("title", ""),
                    url=url,
                    subreddit=subreddit,
                    score=post_data.get("score", 0),
                    permalink=post_data.get("permalink", ""),
                    is_image=is_image,
                ))

            return results

        except Exception as e:
            print(f"Reddit fetch error: {e}")
            return []

    def get_humor_for_topic(self, topic: str) -> list[HumorElement]:
        """Get relevant humor elements for a topic.

        Args:
            topic: Topic keyword

        Returns:
            List of humor elements
        """
        topic_lower = topic.lower()

        # Filter relevant humor
        relevant = []
        for humor in self.AI_HUMOR_TEMPLATES:
            if any(kw in topic_lower for kw in ["ai", "gpt", "claude", "코딩", "개발"]):
                relevant.append(humor)

        return relevant

    def get_recommended_gifs(self, topic: str) -> list[str]:
        """Get recommended GIF URLs for a topic.

        Args:
            topic: Topic keyword

        Returns:
            List of GIF URLs
        """
        topic_lower = topic.lower()

        for key, gifs in self.TOPIC_GIFS.items():
            if key in topic_lower:
                return gifs

        # Default to AI gifs
        return self.TOPIC_GIFS.get("ai", [])

    def enrich_post(
        self,
        content: str,
        topic: str,
        add_gifs: bool = True,
        add_memes: bool = True,
        add_humor: bool = True,
    ) -> EnrichmentResult:
        """Enrich a blog post with viral elements.

        This is the main pipeline method that gathers all enrichment elements.

        Args:
            content: Original blog content
            topic: Main topic of the post
            add_gifs: Whether to search for GIFs
            add_memes: Whether to fetch Reddit memes
            add_humor: Whether to add humor elements

        Returns:
            EnrichmentResult with all gathered elements
        """
        result = EnrichmentResult()

        # Search for relevant GIFs
        if add_gifs:
            result.gifs = self.search_gifs(topic, limit=5)

            # Add recommended GIFs as fallback
            for url in self.get_recommended_gifs(topic):
                result.gifs.append(GifResult(
                    url=url,
                    title=f"Recommended {topic} GIF",
                    preview_url=url,
                    width=480,
                    height=360,
                ))

        # Fetch Reddit memes
        if add_memes:
            # Determine relevant subreddits
            topic_lower = topic.lower()
            subreddits = []

            for key, subs in self.TOPIC_SUBREDDITS.items():
                if key in topic_lower or topic_lower in key:
                    subreddits.extend(subs)

            if not subreddits:
                subreddits = ["memes"]

            # Fetch from each subreddit
            for sub in subreddits[:3]:  # Limit to 3 subreddits
                memes = self.get_reddit_memes(sub, limit=5)
                result.memes.extend(memes)

        # Add humor elements
        if add_humor:
            result.humor = self.get_humor_for_topic(topic)

        return result

    def insert_enrichments_into_content(
        self,
        content: str,
        enrichment: EnrichmentResult,
        max_gifs: int = 3,
        max_memes: int = 2,
    ) -> str:
        """Insert enrichment elements into content at appropriate positions.

        Args:
            content: Original markdown content
            enrichment: Enrichment result to insert
            max_gifs: Maximum GIFs to insert
            max_memes: Maximum memes to insert

        Returns:
            Enriched content
        """
        lines = content.split("\n")

        # Find section headers (##)
        headers = []
        for i, line in enumerate(lines):
            if line.startswith("## "):
                headers.append(i)

        if not headers:
            return content

        # Insert GIFs after some headers
        gifs_inserted = 0
        for i, header_idx in enumerate(headers[1:], start=1):  # Skip first header
            if gifs_inserted >= max_gifs:
                break

            if enrichment.gifs and i % 2 == 0:  # Every other section
                gif = enrichment.gifs[gifs_inserted % len(enrichment.gifs)]
                gif_md = f"\n{gif.to_markdown()}\n"

                # Find next non-empty line after header
                insert_idx = header_idx + 1
                while insert_idx < len(lines) and not lines[insert_idx].strip():
                    insert_idx += 1

                lines.insert(insert_idx + 1, gif_md)
                gifs_inserted += 1

                # Adjust remaining header indices
                for j in range(i, len(headers)):
                    headers[j] += 1

        return "\n".join(lines)

    def generate_meme_section(self, topic: str) -> str:
        """Generate a dedicated meme section for a blog post.

        Args:
            topic: Topic for meme section

        Returns:
            Markdown meme section
        """
        humor = self.get_humor_for_topic(topic)

        if not humor:
            return ""

        section = f"\n## 🎭 {topic} 밈으로 보는 트렌드\n\n"

        for h in humor[:3]:  # Max 3 humor elements
            section += h.to_markdown() + "\n\n"

        return section

    def close(self):
        """Close the HTTP client."""
        self.client.close()


# Singleton instance
enricher = ContentEnricher()
