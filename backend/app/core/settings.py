import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")

    AIRQO_API_KEY: str = os.getenv("AIRQO_API_KEY", "")
    AIRQO_BASE_URL: str = os.getenv("AIRQO_BASE_URL", "https://api.airqo.net/api/v2")
    AIRQO_MAX_DAYS: int = (
        31  # AirQo API only supports 1 month (31 days) back from today
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
