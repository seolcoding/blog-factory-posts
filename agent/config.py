"""Configuration management for Blog Factory agents."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore extra env vars not defined in Settings
    )

    # Telegram Bot API
    telegram_bot_token: str = Field(description="Telegram bot token from @BotFather")
    telegram_chat_id: str = Field(description="Chat ID to send notifications")

    # GitHub
    github_token: str = Field(default="", description="GitHub personal access token")
    github_repo: str = Field(
        default="seolcoding/blog-factory-posts",
        description="GitHub repository for blog",
    )

    # Agent behavior
    agent_max_iterations: int = Field(default=50)
    agent_session_timeout: int = Field(default=3600)
    log_level: str = Field(default="INFO")

    # Auto-publish (Phase 1: always auto, Phase 2: add approval)
    auto_publish: bool = Field(
        default=True,
        description="Auto-publish without approval",
    )


# Singleton instance
settings = Settings()
