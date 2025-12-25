"""Telegram Bot API client for notifications."""

from typing import Literal

import httpx

from .config import settings
from .models import BlogPost, PublishResult, TopicResearch


class TelegramClient:
    """Simple Telegram Bot API client using httpx."""

    BASE_URL = "https://api.telegram.org/bot{token}/{method}"

    def __init__(self, bot_token: str | None = None, chat_id: str | None = None):
        """Initialize Telegram client.

        Args:
            bot_token: Telegram bot token (default: from settings)
            chat_id: Chat ID to send messages (default: from settings)
        """
        self.bot_token = bot_token or settings.telegram_bot_token
        self.chat_id = chat_id or settings.telegram_chat_id

    def send_message(
        self,
        text: str,
        parse_mode: Literal["HTML", "Markdown", "MarkdownV2"] = "HTML",
        disable_notification: bool = False,
    ) -> dict:
        """Send a message to the configured chat.

        Args:
            text: Message text
            parse_mode: Message formatting
            disable_notification: Send silently

        Returns:
            Telegram API response

        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        url = self.BASE_URL.format(token=self.bot_token, method="sendMessage")

        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_notification": disable_notification,
        }

        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            return response.json()

    def notify_research_complete(self, research: TopicResearch) -> dict:
        """Notify that research is complete.

        Args:
            research: Research results

        Returns:
            Telegram API response
        """
        if not research.topics:
            message = "No topics found"
            return self.send_message(message)

        topics_text = "\n".join(
            f"{t.rank}. {t.keyword} (Score: {t.score})" for t in research.topics[:3]
        )

        message = (
            f"<b>Research Complete</b>\n\n"
            f"<b>Top Topics:</b>\n{topics_text}\n\n"
            f"Found {len(research.topics)} topics total"
        )

        return self.send_message(message)

    def notify_post_written(self, post: BlogPost) -> dict:
        """Notify that a post has been written.

        Args:
            post: Blog post content

        Returns:
            Telegram API response
        """
        message = (
            f"<b>Post Written</b>\n\n"
            f"<b>Title:</b> {post.title}\n"
            f"<b>SEO Score:</b> {post.seo_score}/100\n"
            f"<b>Word Count:</b> {post.word_count}\n\n"
            f"Auto-publishing..."
        )
        return self.send_message(message)

    def notify_post_published(self, result: PublishResult) -> dict:
        """Notify that a post has been published.

        Args:
            result: Publishing result

        Returns:
            Telegram API response
        """
        if result.status == "success" and result.post:
            message = (
                f"<b>Post Published!</b>\n\n"
                f"<b>Title:</b> {result.post.title}\n"
                f"<b>URL:</b> {result.post.url}\n"
                f"<b>Time:</b> {result.metrics.time_to_publish if result.metrics else 'N/A'}\n\n"
                f"Live on GitHub Pages"
            )
        else:
            message = f"<b>Publishing Failed</b>\n\n<b>Error:</b> {result.error or 'Unknown error'}"

        return self.send_message(message)

    def notify_error(self, error: str, context: str = "") -> dict:
        """Notify an error occurred.

        Args:
            error: Error message
            context: Additional context

        Returns:
            Telegram API response
        """
        message = f"<b>Error</b>\n\n{error}"
        if context:
            message += f"\n\n<b>Context:</b> {context}"

        return self.send_message(message)

    def notify_cycle_complete(self, posts_count: int, elapsed: str) -> dict:
        """Notify that a content cycle is complete.

        Args:
            posts_count: Number of posts published
            elapsed: Total elapsed time

        Returns:
            Telegram API response
        """
        message = (
            f"<b>Cycle Complete</b>\n\n"
            f"<b>Posts Published:</b> {posts_count}\n"
            f"<b>Total Time:</b> {elapsed}"
        )
        return self.send_message(message)


# Singleton instance
telegram = TelegramClient()
