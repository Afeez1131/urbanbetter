from app.core.cache import cache, make_cache_key
from app.core.logger import get_logger
from app.external.airqo.client import AirQoClient, compute_aggregation
from app.schemas.base import MeasurementQuery
from app.schemas.response import AggregationResponse, MeasurementsResponse
from fastapi import APIRouter, Depends, status

logger = get_logger(__name__)
router = APIRouter(prefix="/api/measurements", tags=["measurements"])
airqo_client = AirQoClient()
AGGREGATE_CACHE_TTL = 60 * 15  # 15 minutes


@router.get(
    "",
    summary="Get measurements for a site and date range",
    description="Fetch measurements for a given site and date range.",
    response_model=MeasurementsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_measurements(
    query: MeasurementQuery = Depends(),
):
    """Fetch measurements for a given site and date range."""
    measurements = await airqo_client.fetch_measurements(
        site_id=query.site_id,
        start_time=query.start_time.isoformat(),
        end_time=query.end_time.isoformat(),
    )
    return {
        "message": "Measurements fetched successfully",
        "data": {
            "measurements": measurements,
            "total": len(measurements),
        },
    }


@router.get(
    "/aggregate",
    summary="Get aggregated measurements for a site and date range",
    description="Fetch measurements for a given site and date range",
    response_model=AggregationResponse,
    status_code=status.HTTP_200_OK,
)
async def get_aggregate(
    query: MeasurementQuery = Depends(),
):
    """Get aggregated measurements for a given site and date range."""
    cache_key = make_cache_key("aggregate", query.site_id, str(query.start_time), str(query.end_time))
    cached = cache.get(cache_key)

    if cached:
        logger.info(f"Aggregate cache hit | key={cache_key}")
        aggregation = cached
    else:
        logger.info(f"Aggregate cache miss | computing aggregation | key={cache_key}")
        measurements = await airqo_client.fetch_measurements(
            site_id=query.site_id,
            start_time=query.start_time.isoformat(),
            end_time=query.end_time.isoformat(),
        )
        aggregation = compute_aggregation(measurements)
        cache.set(cache_key, aggregation, ttl_seconds=AGGREGATE_CACHE_TTL)
        logger.info(f"Aggregate cached | key={cache_key} | ttl={AGGREGATE_CACHE_TTL}s")

    return {
        "message": "Aggregated measurements fetched successfully",
        "data": {
            "site_id": query.site_id,
            "aggregation": aggregation,
        },
    }
