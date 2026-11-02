"""Bounded per-IP rate limiting with Redis support for multi-instance deployments."""
import asyncio
import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from .config import settings

try:
    import redis.asyncio as redis
except ImportError:  # pragma: no cover - optional dependency
    redis = None


class RateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()
        self._redis = None
        if settings.redis_url and redis is not None:
            try:
                self._redis = redis.from_url(
                    settings.redis_url, decode_responses=True
                )
            except Exception:
                self._redis = None

    async def hit(
        self, key: str, limit: int, window_seconds: int = 60
    ) -> tuple[bool, int, int]:
        if self._redis is not None:
            try:
                bucket = int(time.time() // window_seconds)
                redis_key = f"ratelimit:{key}:{bucket}"
                count = await self._redis.incr(redis_key)
                if count == 1:
                    await self._redis.expire(redis_key, window_seconds + 1)
                remaining = max(0, limit - int(count))
                retry_after = window_seconds - (int(time.time()) % window_seconds)
                return int(count) <= limit, remaining, retry_after
            except Exception:
                # Fall through to the in-process limiter if Redis is unavailable.
                pass

        now = time.time()
        cutoff = now - window_seconds
        async with self._lock:
            bucket = self._hits[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            allowed = len(bucket) < limit
            if allowed:
                bucket.append(now)
            remaining = max(0, limit - len(bucket))
            retry_after = window_seconds
            return allowed, remaining, retry_after


limiter = RateLimiter()
AUTH_PATHS = {
    "/api/auth/login",
    "/api/auth/register",
}
SKIP_PATHS = {"/api/health", "/api/ready"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if request.method != "OPTIONS" and path.startswith("/api") and path not in SKIP_PATHS:
            client = request.client.host if request.client else "unknown"
            is_auth = path in AUTH_PATHS
            limit = (
                settings.auth_rate_limit_per_minute
                if is_auth
                else settings.rate_limit_per_minute
            )
            allowed, remaining, retry_after = await limiter.hit(
                f"{client}:{path}", limit
            )
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again shortly."},
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(limit),
                        "X-RateLimit-Remaining": "0",
                    },
                )
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            return response
        return await call_next(request)
