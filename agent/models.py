"""Data models for Blog Factory orchestration."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Topic(BaseModel):
    """Individual topic from research."""

    rank: int
    keyword: str
    score: int = Field(ge=0, le=100)
    velocity: Literal["rising", "stable", "falling"]
    volume: str
    angle: str
    related_keywords: list[str]
    sources: list[str]


class TopicResearch(BaseModel):
    """Research output from Researcher agent."""

    timestamp: datetime
    topics: list[Topic]
    next_refresh: datetime | None = None


class PostMetadata(BaseModel):
    """Frontmatter metadata for Hugo."""

    title: str
    date: datetime
    categories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    description: str = Field(max_length=160)
    author: str = "Blog Factory"
    draft: bool = False


class BlogPost(BaseModel):
    """Blog post content from Writer agent."""

    title: str
    content: str  # Full markdown with frontmatter
    metadata: PostMetadata
    seo_score: int = Field(ge=0, le=100)
    word_count: int


class PublishedPost(BaseModel):
    """Published post details."""

    title: str
    filename: str
    url: str
    commit_sha: str
    published_at: datetime


class PublishMetrics(BaseModel):
    """Publishing performance metrics."""

    seo_score: int
    word_count: int
    time_to_publish: str  # e.g. "45s"


class PublishResult(BaseModel):
    """Result from Publisher agent."""

    status: Literal["success", "failed", "pending_approval"]
    post: PublishedPost | None = None
    error: str | None = None
    metrics: PublishMetrics | None = None


class TelegramNotification(BaseModel):
    """Notification to send via Telegram."""

    message: str
    parse_mode: Literal["HTML", "Markdown", "MarkdownV2"] = "HTML"
    disable_notification: bool = False
