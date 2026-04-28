from typing import TypedDict


class AQIResult(TypedDict):
    aqi_category: str
    aqi_color: str
    aqi_color_name: str


# US EPA PM2.5 AQI breakpoints
# Source: https://www.airnow.gov/aqi/aqi-basics/ and https://aqicn.org/scale/
Breakpoint = tuple[float, float, str, str, str]
BREAKPOINTS: list[Breakpoint] = [
    (0.0, 12.0, "Good", "#00E400", "Green"),
    (12.1, 35.4, "Moderate", "#FFFF00", "Yellow"),
    (35.5, 55.4, "Unhealthy for Sensitive Groups", "#FF7E00", "Orange"),
    (55.5, 150.4, "Unhealthy", "#FF0000", "Red"),
    (150.5, 250.4, "Very Unhealthy", "#8F3F97", "Purple"),
    (250.5, 500.0, "Hazardous", "#7E0023", "Maroon"),
]


def truncate_pm25(value: float) -> float:
    """
    Truncate PM2.5 to 1 decimal place per EPA standard.
    """
    return int(value * 10) / 10
