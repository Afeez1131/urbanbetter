from collections import Counter
from datetime import datetime
from typing import Literal

import httpx

from app.core.logger import get_logger
from app.core.settings import get_settings
from app.external.airqo.utils import BREAKPOINTS, AQIResult, truncate_pm25

logger = get_logger(__name__)
settings = get_settings()


class AirQoClient:
    """
    REST client for the AirQo API.

    Handles:
    - Fetching monitoring sites (with pagination and country filtering)
    - Fetching historical air quality measurements (with pagination)
    - AQI categorization based on PM2.5 using US EPA standards
    - Basic aggregation statistics
    """

    def __init__(self):
        self.base_url = settings.AIRQO_BASE_URL
        self._client = httpx.AsyncClient(timeout=30.0)

    def _get_auth_params(self, **extra_params) -> dict:
        """Build common query parameters including the API token."""
        params = {"token": settings.AIRQO_API_KEY}
        params.update(extra_params)
        return params

    async def fetch_sites(
        self, country: Literal["Nigeria", "Ghana", "both"] = "both"
    ) -> list[dict]:
        """
        Fetch all AirQo monitoring sites, optionally filtered by country.
        Handles pagination automatically.

        Args:
            country (str): "Nigeria", "Ghana", or "both"

        Returns:
            list[dict]: List of site dictionaries
        """

        logger.info(f"Fetching sites | country={country}")

        all_sites: list[dict] = []
        skip = 0
        limit = 100

        while True:
            params = self._get_auth_params(limit=limit, skip=skip)
            if country and country.lower() != "both":
                params["country"] = country

            response = await self._client.get(
                f"{self.base_url}/devices/sites", params=params
            )
            response.raise_for_status()
            data = response.json()

            sites = data.get("sites", [])
            if not sites:
                break

            for s in sites:
                site_country = s.get("country", "")
                if (
                    country
                    and country.lower() == "both"
                    and site_country not in ("Nigeria", "Ghana")
                ):
                    continue  # exclude countries not in Nigeria/Ghana when fetching "both"

                all_sites.append(
                    {
                        "site_id": s.get("_id"),
                        "name": s.get("name", ""),
                        "city": s.get("city", ""),
                        "country": site_country,
                        "latitude": s.get("latitude"),
                        "longitude": s.get("longitude"),
                        "is_online": s.get("isOnline", False),
                    }
                )

            meta = data.get("meta", {})
            if meta.get("page", 1) >= meta.get("totalPages", 1):
                break

            skip += limit

        return all_sites

    async def fetch_measurements(
        self, site_id: str, start_time: str, end_time: str
    ) -> list[dict]:
        """
        Fetch historical measurements for a site within a time range.
        Handles pagination and adds AQI information.

        Args:
            site_id (str): AirQo site ID
            start_time (str): ISO datetime string
            end_time (str): ISO datetime string

        Returns:
            list[dict]: Enriched measurement records

        """

        logger.info(
            f"Fetching measurements | site_id={site_id} | "
            f"start={start_time} | end={end_time}"
        )
        all_measurements: list[dict] = []
        skip = 0
        limit = 100

        while True:
            params = self._get_auth_params(
                startTime=start_time,
                endTime=end_time,
                limit=limit,
                skip=skip,
            )

            response = await self._client.get(
                f"{self.base_url}/devices/measurements/sites/{site_id}/historical",
                params=params,
            )

            response.raise_for_status()
            data = response.json()

            if not data.get("success"):
                raise ValueError(
                    data.get("errors", {}).get("message", "AirQo API error")
                )

            measurements = data.get("measurements", [])
            if not measurements:
                break

            for m in measurements:
                pm25_raw = m.get("pm2_5", {}).get("value")
                if pm25_raw is None:
                    continue

                pm25_value = round(float(pm25_raw), 2)
                aqi = get_aqi_info(pm25_value)
                site = m.get("siteDetails", {})

                all_measurements.append(
                    {
                        "site_id": m.get("site_id", ""),
                        "device_id": m.get("device_id", ""),
                        "device": m.get("device", ""),
                        "city": site.get("city", ""),
                        "country": site.get("country", ""),
                        "time": m.get("time", ""),
                        "pm2_5_value": pm25_value,
                        "aqi_category": aqi.get("aqi_category"),
                        "aqi_color": aqi.get("aqi_color"),
                        "aqi_index": aqi.get("aqi_index"),
                        "aqi_color_name": aqi.get("aqi_color_name"),
                        "frequency": m.get("frequency", "hourly"),
                    }
                )

            if not data.get("meta", {}).get("hasNextPage", False):
                break

            skip += limit
        logger.info(
            f"Measurements fetched | site_id={site_id} | "
            f"total={len(all_measurements)}"
        )
        return all_measurements


def get_aqi_info(pm25: float) -> AQIResult:
    """
    Convert raw PM2.5 concentration (µg/m³) to AQI index,
    category, color, and color name using US EPA standard.

    Steps:
    1. Reject negative values as sensor anomalies.
    2. Truncate to 1 decimal place (EPA requirement).
    3. Find matching breakpoint range.

    Args:
        pm25: Raw PM2.5 value in µg/m³ from AirQo sensor.

    Returns:
        AQIResult with aqi_category, aqi_color, aqi_color_name.
    """
    if pm25 < 0:
        return {
            "aqi_category": "Invalid",
            "aqi_color": "#AAAAAA",
            "aqi_color_name": "Grey",
        }

    pm25 = truncate_pm25(pm25)

    for c_low, c_high, category, color, color_name in BREAKPOINTS:
        if c_low <= pm25 <= c_high:
            return {
                "aqi_category": category,
                "aqi_color": color,
                "aqi_color_name": color_name,
            }

    return {
        "aqi_category": "Hazardous",
        "aqi_color": "#7E0023",
        "aqi_color_name": "Maroon",
    }


def compute_aggregation(measurements: list[dict]) -> dict:
    """Compute statistics from measurements returned by fetch_measurements functions."""
    if not measurements:
        return {
            "total_datapoints": 0,
            "avg_pm25": None,
            "worst_reading": None,
            "best_reading": None,
            "data_completeness": "0%",
            "category_breakdown": [],
        }

    total = len(measurements)
    pm25_values = [m["pm2_5_value"] for m in measurements if m["pm2_5_value"] >= 0]

    avg_pm25 = round(sum(pm25_values) / len(pm25_values), 2) if pm25_values else None
    worst = max(measurements, key=lambda m: m["pm2_5_value"])

    best_list = [m for m in measurements if m["pm2_5_value"] >= 0]
    best = min(best_list, key=lambda m: m["pm2_5_value"]) if best_list else None

    # Category breakdown

    category_counts = Counter(m["aqi_category"] for m in measurements)

    category_breakdown = [
        {
            "category": cat,
            "count": count,
            "percentage": round((count / total) * 100, 1),
            "color": next(
                (m["aqi_color"] for m in measurements if m["aqi_category"] == cat),
                "#AAAAAA",
            ),
        }
        for cat, count in category_counts.most_common()
    ]

    # Data completeness
    completeness = 0.0
    if measurements:
        times = [m["time"] for m in measurements if m.get("time")]
        if len(times) >= 2:
            parsed = [datetime.fromisoformat(t.replace("Z", "+00:00")) for t in times]
            span_hours = ((max(parsed) - min(parsed)).total_seconds() / 3600) + 1
            completeness = min(round((total / span_hours) * 100, 1), 100.0)

    return {
        "total_datapoints": total,
        "avg_pm25": avg_pm25,
        "worst_reading": {
            "time": worst["time"],
            "pm2_5_value": worst.get("pm2_5_value"),
            "aqi_category": worst.get("aqi_category"),
            "aqi_index": worst.get("aqi_index"),
        },
        "best_reading": (
            {
                "time": best["time"],
                "pm2_5_value": best.get("pm2_5_value"),
                "aqi_category": best.get("aqi_category"),
                "aqi_index": best.get("aqi_index"),
            }
            if best
            else None
        ),
        "data_completeness": f"{completeness}%",
        "category_breakdown": category_breakdown,
    }
