from typing import Any

from app.schemas.base import (
    AggregationResponseBase,
    MeasurementsResponseBase,
    SitesResponseBase,
)
from pydantic import BaseModel, Field


class BaseResponse(BaseModel):
    """Base response model for all API endpoints"""

    status: str = Field(description="Status of the API response", default="success")
    message: str = Field(
        description="Detailed message about the API response",
        default="Request Successful",
    )
    data: Any = Field(description="The response data")


class SitesResponse(BaseResponse):
    """Response model for the sites endpoint"""

    data: SitesResponseBase = Field(description="The response data for sites endpoint")


class MeasurementsResponse(BaseResponse):
    """Response model for the measurements endpoint"""

    data: MeasurementsResponseBase = Field(
        description="The response data for measurements endpoint"
    )


class AggregationResponse(BaseResponse):
    """Response model for the aggregated measurements endpoint"""

    data: AggregationResponseBase = Field(
        description="The response data for aggregation endpoint"
    )
