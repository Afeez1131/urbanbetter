from typing import Literal

from fastapi import APIRouter, Query, status

from app.core.logger import get_logger
from app.external.airqo.client import AirQoClient
from app.schemas.response import SitesResponse

router = APIRouter(prefix="/api/sites", tags=["sites"])
logger = get_logger(__name__)
airqo_client = AirQoClient()


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
    sites = await airqo_client.fetch_sites(country=country)
    return {
        "message": "Sites fetched successfully",
        "data": {
            "sites": sites,
            "total": len(sites),
        },
    }
