import time
from typing import Any


class TTLCache:
    """
    Simple in-memory TTL cache.
    """

    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Any | None:
        """Retrieve a value from the cache if it exists and hasn't expired."""
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        """Store a value in the cache with a time-to-live (TTL)."""
        self._store[key] = (value, time.time() + ttl_seconds)

    def invalidate(self, key: str) -> None:
        """Invalidate a specific cache entry."""
        self._store.pop(key, None)

    def clear(self) -> None:
        """Clear all entries from the cache."""
        self._store.clear()


cache = TTLCache()
