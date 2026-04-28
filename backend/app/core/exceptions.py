import traceback

import httpx
import orjson
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError as PydanticValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

from app.core.logger import get_logger

logger = get_logger(__name__)


def error_response(
    status_code: int, code: str, message: str, detail: str = None
) -> Response:
    """Utility to create a standardized error response."""
    body = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
    }
    if detail:
        body["error"]["detail"] = detail
    return Response(
        content=orjson.dumps(body),
        status_code=status_code,
        media_type="application/json",
    )


def notify_admin(request: Request, exc: Exception):
    """
    utility function for alerting on 500 errors.
    e.g  Sentry, SNS, Slack webhook, or email.
    """
    msg = (
        "UNHANDLED EXCEPTION — admin notification triggered\n"
        f"Path: {request.method} {request.url}\n"
        f"Exception: {type(exc).__name__}: {str(exc)}\n"
        f"Traceback:\n{traceback.format_exc()}"
    )
    logger.error(msg)
    # e.g send_email_to_admin(subject="Critical Error in Air Quality API", body=msg)


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles all explicit HTTPExceptions raised in routes."""
    code_map = {
        status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
        status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
        status.HTTP_403_FORBIDDEN: "FORBIDDEN",
        status.HTTP_404_NOT_FOUND: "NOT_FOUND",
        status.HTTP_405_METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
        status.HTTP_408_REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
        status.HTTP_409_CONFLICT: "CONFLICT",
        status.HTTP_422_UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
        status.HTTP_429_TOO_MANY_REQUESTS: "RATE_LIMITED",
        status.HTTP_502_BAD_GATEWAY: "UPSTREAM_ERROR",
        status.HTTP_503_SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
        status.HTTP_504_GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    logger.warning(
        f"HTTP {exc.status_code} | {request.method} {request.url} | {exc.detail}"
    )
    return error_response(
        status_code=exc.status_code,
        code=code,
        message=str(exc.detail),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic/FastAPI request validation failures."""
    errors = exc.errors()
    # Flatten into readable messages
    messages = []
    for e in errors:
        loc = " -> ".join(str(l) for l in e["loc"] if l != "body")
        messages.append(f"{loc}: {e['msg']}" if loc else e["msg"])

    logger.warning(f"Validation error | {request.method} {request.url} | {messages}")
    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="VALIDATION_ERROR",
        message="Request validation failed",
        detail="; ".join(messages),
    )


async def airqo_upstream_error_handler(request: Request, exc: httpx.HTTPStatusError):
    """Handles non-2xx responses from the AirQo API."""
    _status = exc.response.status_code
    logger.error(
        f"AirQo API error | Status {_status} | "
        f"{request.method} {request.url} | {exc.response.text[:200]}"
    )

    if _status == status.HTTP_401_UNAUTHORIZED:
        return error_response(
            status_code=status.HTTP_502_BAD_GATEWAY,
            code="UPSTREAM_AUTH_ERROR",
            message="AirQo API authentication failed. Check API token.",
        )
    if _status == status.HTTP_429_TOO_MANY_REQUESTS:
        exc_errors = exc.response.json().get("errors", {})
        retry = exc_errors.get("retry_after_seconds", "")
        return error_response(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code="UPSTREAM_RATE_LIMITED",
            message=f"AirQo API rate limit reached. Please wait {retry} seconds before retrying.",
            detail=f"Retry after {retry} seconds." if retry else "",
        )
    if _status == status.HTTP_404_NOT_FOUND:
        return error_response(
            status_code=status.HTTP_404_NOT_FOUND,
            code="SITE_NOT_FOUND",
            message="The requested site was not found in AirQo.",
        )
    return error_response(
        status_code=status.HTTP_502_BAD_GATEWAY,
        code="UPSTREAM_ERROR",
        message=f"AirQo API returned an unexpected error (HTTP {_status}).",
    )


async def airqo_timeout_handler(request: Request, exc: httpx.TimeoutException):
    """Handles timeouts when calling the AirQo API."""
    logger.error(f"AirQo API timeout | {request.method} {request.url}")
    return error_response(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        code="UPSTREAM_TIMEOUT",
        message="AirQo API did not respond in time. Please try again.",
    )


async def airqo_connect_error_handler(request: Request, exc: httpx.ConnectError):
    """Handles connection failures to the AirQo API."""
    logger.error(
        f"AirQo API connection error | {request.method} {request.url} | {str(exc)}"
    )
    return error_response(
        status_code=status.HTTP_502_BAD_GATEWAY,
        code="UPSTREAM_UNREACHABLE",
        message="Could not connect to AirQo API. Check network or try again later.",
    )


async def pydantic_validation_handler(request: Request, exc: PydanticValidationError):
    """
    Handles pydantic.ValidationError
    """
    messages = []
    for e in exc.errors():
        loc = " -> ".join(str(l) for l in e["loc"] if l != "body")
        messages.append(f"{loc}: {e['msg']}" if loc else e["msg"])

    logger.warning(
        f"Pydantic validation error | {request.method} {request.url} | {messages}"
    )
    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="VALIDATION_ERROR",
        message="Request validation failed",
        detail="; ".join(messages),
    )


async def value_error_handler(request: Request, exc: ValueError):
    """Handles ValueError raised in the service layer (business logic errors)."""
    logger.warning(f"ValueError | {request.method} {request.url} | {str(exc)}")

    return error_response(
        status_code=status.HTTP_400_BAD_REQUEST,
        code="BAD_REQUEST",
        message=str(exc),
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for any unhandled exception.
    Logs full traceback and notifies admin.
    Returns a safe, generic 500 response, no internals leaked.
    """
    notify_admin(request, exc)
    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred. Our team has been notified.",
    )


# Registration
def register_exception_handlers(app: FastAPI):
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(PydanticValidationError, pydantic_validation_handler)
    app.add_exception_handler(httpx.HTTPStatusError, airqo_upstream_error_handler)
    app.add_exception_handler(httpx.TimeoutException, airqo_timeout_handler)
    app.add_exception_handler(httpx.ConnectError, airqo_connect_error_handler)
    app.add_exception_handler(ValueError, value_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
