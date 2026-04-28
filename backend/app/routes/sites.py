from typing import Literal

from fastapi import APIRouter, Query, status

from app.core.cache import cache
from app.core.logger import get_logger
from app.external.airqo.client import AirQoClient
from app.schemas.response import SitesResponse

router = APIRouter(prefix="/api/sites", tags=["sites"])
logger = get_logger(__name__)
airqo_client = AirQoClient()
SITES_CACHE_TTL = 60 * 15  # 15 minutes


@router.get(
    "",
    summary="Get available sites",
    description="Returns available sites filtered by country. ['Nigeria', 'Ghana', or 'both'].",
    response_model=SitesResponse,
    status_code=status.HTTP_200_OK,
)
async def get_sites(
    country: Literal["Nigeria", "Ghana", "both"] = Query(default="both"),
):
    """
    Returns available sites filtered by country.
    country: 'Nigeria', 'Ghana', or 'both'
    """

    cache_key = f"sites:{country}"
    cached = cache.get(cache_key)
    if cached:
        logger.info(f"Sites cache hit | key={cache_key}")
        sites = cached
    else:
        logger.info(f"Sites cache miss | fetching from AirQo | key={cache_key}")

        sites = await airqo_client.fetch_sites(country=country)

        cache.set(cache_key, sites, ttl_seconds=SITES_CACHE_TTL)
        logger.info(
            f"Sites cached | key={cache_key} | "
            f"total={len(sites)} | ttl={SITES_CACHE_TTL}s"
        )

    return {
        "message": "Sites fetched successfully",
        "data": {
            "sites": sites,
            "total": len(sites)
        },
    }
