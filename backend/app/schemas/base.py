from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.core.settings import get_settings
from pydantic import BaseModel, Field, field_validator, model_validator

settings = get_settings()
AIRQO_MAX_DAYS = settings.AIRQO_MAX_DAYS


class Site(BaseModel):
    """Represents an AirQo monitoring site."""

    site_id: str = Field(description="Unique identifier for the site")
    name: str = Field(description="Name of the site")
    city: str = Field(description="City where the site is located")
    country: str = Field(description="Country where the site is located")
    latitude: float = Field(description="Latitude of the site")
    longitude: float = Field(description="Longitude of the site")
    is_online: bool = Field(description="Whether the site is currently online")


class SitesResponseBase(BaseModel):
    """Base response model for the sites"""

    sites: list[Site] = Field(description="List of available sites")
    total: int = Field(description="Total number of sites returned")


class Measurement(BaseModel):
    """Represents an air quality measurement."""

    site_id: str = Field(description="Unique identifier for the site")
    device_id: str = Field(description="Unique identifier for the device at the site")
    device: str = Field(description="Name of the device")
    city: str = Field(description="City where the site is located")
    country: str = Field(description="Country where the site is located")
    time: str = Field(description="Timestamp of the measurement in ISO format")
    pm2_5_value: float = Field(description="PM2.5 value of the measurement")
    aqi_category: str = Field(description="AQI category of the measurement")
    aqi_color: str = Field(description="AQI color of the measurement")
    aqi_color_name: str = Field(description="Name of the AQI color")
    frequency: str = Field(description="Frequency of the measurement")


class MeasurementsResponseBase(BaseModel):
    """Base response model for the measurements endpoint"""

    measurements: list[Measurement] = Field(
        description="List of measurements for the specified site and date range"
    )
    total: int = Field(description="Total number of measurements returned")


class MeasurementQuery(BaseModel):
    """Represents the query parameters for fetching measurements."""

    site_id: str = Field(description="Unique identifier for the site")
    start_time: datetime = Field(description="Start time of the measurement range")
    end_time: datetime = Field(description="End time of the measurement range")

    @field_validator("start_time", "end_time")
    def ensure_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @model_validator(mode="after")
    def validate_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")

        if (self.end_time - self.start_time) > timedelta(days=AIRQO_MAX_DAYS):
            raise ValueError(f"Date range cannot exceed {AIRQO_MAX_DAYS} days")

        cutoff = datetime.now(timezone.utc) - timedelta(days=AIRQO_MAX_DAYS)

        if self.start_time < cutoff:
            raise ValueError(f"Data only available for the last {AIRQO_MAX_DAYS} days")

        if self.end_time < cutoff:
            raise ValueError("end_time is outside the allowed range")

        return self


class CategoryBreakdown(BaseModel):
    """Represents the breakdown of measurements by AQI category."""

    category: str = Field(description="AQI category name")
    count: int = Field(description="Number of measurements in this category")
    percentage: float = Field(
        description="Percentage of total measurements in this category"
    )
    color: str = Field(description="AQI color associated with this category")


class Reading(BaseModel):
    """Represents a single measurement reading with AQI information."""

    time: str = Field(description="Timestamp of the measurement in ISO format")
    pm2_5_value: float = Field(description="PM2.5 value of the measurement")
    aqi_category: str = Field(description="AQI category of the measurement")


class Aggregate(BaseModel):
    """Represents aggregated measurement statistics for a site and date range."""

    total_datapoints: int = Field(
        description="Total number of measurements in the date range"
    )
    avg_pm25: Optional[float] = Field(
        description="Average PM2.5 value across all measurements"
    )
    worst_reading: Optional[Reading] = Field(
        description="Measurement with the worst (highest) PM2.5 value"
    )
    best_reading: Optional[Reading] = Field(
        description="Measurement with the best (lowest) PM2.5 value"
    )
    data_completeness: str = Field(
        description="Data completeness percentage based on expected vs actual measurements"
    )
    category_breakdown: List[CategoryBreakdown] = Field(
        description="Breakdown of measurements by AQI category"
    )


class AggregationResponseBase(BaseModel):
    """Response model for the aggregated measurements endpoint"""

    site_id: str = Field(description="ID of the site for which aggregation is returned")
    aggregation: Aggregate = Field(
        description="Aggregated measurement statistics for the specified site and date range"
    )
