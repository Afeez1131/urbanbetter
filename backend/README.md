# AirQuality Dashboard: Backend

REST API for querying, enriching, and aggregating historical air quality data for specific regions in West Africa (Ghana and Nigeria). Built with **FastAPI**, powered by the **AirQo API**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [AQI Classification](#aqi-classification)
- [Data Aggregation](#data-aggregation)
- [Caching Strategy](#caching-strategy)
- [Logging](#logging)
- [Error Handling](#error-handling)
- [EC2 Deployment](#ec2-deployment)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)

---

## Overview

The backend acts as a layer between the AirQo API and the frontend:

1. **Fetches** monitoring sites and historical measurements from AirQo with automatic pagination
2. **Enriches** raw measurements with AQI category, colour, and colour name fields the AirQo API does not return directly
3. **Aggregates** measurement sets into statistics (total readings, average PM2.5, best/worst readings, data completeness, category breakdown)
4. **Caches** expensive or frequently repeated responses to stay within AirQo API rate limits

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.136.1 | Web framework |
| Uvicorn | 0.46.0 | ASGI server |
| Pydantic v2 | 2.13.3 | Request validation, settings, response schemas |
| pydantic-settings | 2.14.0 | Environment variable management |
| httpx | 0.28.1 | Async HTTP client for AirQo API |
| orjson | 3.11.8 | Fast JSON serialisation |
| python-dotenv | 1.2.2 | `.env` file loading |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # App factory, middleware, router registration
│   ├── requirements.txt         # App dependencies
│   ├── core/
│   │   ├── settings.py          # Pydantic-settings config (env vars)
│   │   ├── cache.py             # In-memory TTL cache
│   │   ├── exceptions.py        # Centralised exception handlers
│   │   └── logger.py            # Structured logger
│   ├── external/
│   │   └── airqo/
│   │       ├── client.py        # AirQo REST client + aggregation logic
│   │       └── utils.py         # EPA AQI breakpoints + PM2.5 truncation
│   ├── routes/
│   │   ├── sites.py             # GET /api/sites
│   │   └── measurements.py      # GET /api/measurements, /api/measurements/aggregate
│   └── schemas/
│       ├── base.py              # Request + domain models (MeasurementQuery, etc.)
│       └── response.py          # Envelope response models
```

---

## API Endpoints

### `GET /api/sites`

Returns available AirQo monitoring sites, filtered by country.

**Query Parameters**

| Parameter | Type | Required | Values |
|---|---|---|---|
| `country` | string | No (default: `both`) | `Nigeria`, `Ghana`, `both` |

**Example**

```
GET /api/sites?country=Nigeria
```

```json
{
  "success": true,
  "data": {
    "sites": [
      {
        "site_id": "697071d6cf256a0013a986ac",
        "name": "Trans-Amadi Road",
        "city": "Port Harcourt",
        "country": "Nigeria",
        "latitude": 4.805783,
        "longitude": 7.0104,
        "is_online": true
      },
      {
        "site_id": "6970717a78ad850013bc5854",
        "name": "UST road",
        "city": "Port Harcourt",
        "country": "Nigeria",
        "latitude": 4.805571,
        "longitude": 6.988223,
        "is_online": true
      },
      ...
    ],
    "total": 42
  }
}
```

> Sites are fetched live from the AirQo API with full pagination and cached for **15 minutes**.

---

### `GET /api/measurements`

Returns historical measurements for a site within a date range.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `site_id` | string | Yes | AirQo site ID |
| `start_time` | date | Yes | Start date (`YYYY-MM-DD`) |
| `end_time` | date | Yes | End date (`YYYY-MM-DD`) |

**Constraints (enforced by `MeasurementQuery` validator)**
- `end_time` must be after `start_time`
- Range cannot exceed **31 days**
- `start_time` cannot be older than **31 days** from today (AirQo API limit)

**Example**

```
GET /api/measurements?site_id=697071d6cf256a0013a986ac&start_time=2026-04-01&end_time=2026-04-07
```

```json
{
  "success": true,
  "data": {
    "measurements": [
      {
        "site_id": "697071d6cf256a0013a986ac",
        "device_id": "6825a7d7c23a5b00136bfe78",
        "device": "airqo_g5500",
        "city": "Port Harcourt",
        "country": "Nigeria",
        "time": "2026-04-26T21:00:00.000Z",
        "pm2_5_value": 12.24,
        "aqi_category": "Moderate",
        "aqi_color": "#FFFF00",
        "aqi_color_name": "Yellow",
        "frequency": "hourly"
      },
      {
        "site_id": "697071d6cf256a0013a986ac",
        "device_id": "6825a7d7c23a5b00136bfe78",
        "device": "airqo_g5500",
        "city": "Port Harcourt",
        "country": "Nigeria",
        "time": "2026-04-26T22:00:00.000Z",
        "pm2_5_value": 7.74,
        "aqi_category": "Good",
        "aqi_color": "#00E400",
        "aqi_color_name": "Green",
        "frequency": "hourly"
      },
      ...
    ],
    "total": 65
  }
}
```

> **Note:** `aqi_category`, `aqi_color`, and `aqi_color_name` are not returned by AirQo. They are computed server-side from the raw `pm2_5_value` using US EPA breakpoints (see [AQI Classification](#aqi-classification)).

---

### `GET /api/measurements/aggregate`

Returns aggregated statistics for a site and date range. Accepts the same query parameters as `/api/measurements`.

**Example**

```
GET /api/measurements/aggregate?site_id=697071d6cf256a0013a986ac&start_time=2026-04-01&end_time=2026-04-07
```

```json
{
  "success": true,
  "data": {
    "site_id": "697071d6cf256a0013a986ac",
    "aggregation": {
      "total_datapoints": 65,
      "avg_pm25": 20.01,
      "worst_reading": {
        "time": "2026-04-03T14:00:00Z",
        "pm2_5_value": 123.09,
        "aqi_category": "Unhealthy"
      },
      "best_reading": {
        "time": "2026-04-01T04:00:00Z",
        "pm2_5_value": 4.38,
        "aqi_category": "Good"
      },
      "data_completeness": "89.0%",
      "category_breakdown": [
        { "category": "Moderate",  "count": 36, "percentage": 55.4, "color": "#FFFF00" },
        { "category": "Good",      "count": 24, "percentage": 36.9, "color": "#00E400" },
        { "category": "Unhealthy", "count": 5,  "percentage": 7.7,  "color": "#FF0000" }
      ]
    }
  }
}
```

> Aggregation results are cached for **15 minutes** per `(site_id, start_time, end_time)` combination.

---

### `GET /health`

Liveness check.

```json
{ "status": "ok" }
```

---

## AQI Classification

The AirQo API returns raw `pm2_5_value` only. AQI category, colour, and colour name are derived server-side using **US EPA PM2.5 breakpoints**.

| PM2.5 (µg/m³) | Category | Colour | Colour Name |
|---|---|---|---|
| 0.0 – 12.0 | Good | `#00E400` | Green |
| 12.1 – 35.4 | Moderate | `#FFFF00` | Yellow |
| 35.5 – 55.4 | Unhealthy for Sensitive Groups | `#FF7E00` | Orange |
| 55.5 – 150.4 | Unhealthy | `#FF0000` | Red |
| 150.5 – 250.4 | Very Unhealthy | `#8F3F97` | Purple |
| 250.5 – 500.0 | Hazardous | `#7E0023` | Maroon |
| < 0 | Invalid | `#AAAAAA` | Grey |

Per EPA standard, PM2.5 values are **truncated** (not rounded) to one decimal place before breakpoint lookup e.g. `12.99` → `12.9` → **Moderate**, not `13.0`.

Source: [airnow.gov/aqi/aqi-basics](https://www.airnow.gov/aqi/aqi-basics/)
        [aqicn.org/scale/](https://aqicn.org/scale/)

---

## Data Aggregation

`compute_aggregation()` in `app/external/airqo/client.py` derives the following from a raw measurements list:

| Field | Method |
|---|---|
| `total_datapoints` | `len(measurements)` |
| `avg_pm25` | Mean of all non-negative PM2.5 values, rounded to 2 d.p. |
| `worst_reading` | Record with the highest `pm2_5_value` |
| `best_reading` | Record with the lowest non-negative `pm2_5_value` |
| `data_completeness` | `(actual readings / expected hourly readings) × 100`, capped at 100% |
| `category_breakdown` | Count and percentage per AQI category, sorted by frequency |

**Data completeness** is calculated from the span between the earliest and latest timestamps in the dataset, it reflects sensor uptime, not calendar coverage.

---

## Caching Strategy

A custom in-memory `TTLCache` (`app/core/cache.py`) is used, no external dependencies, no extra AWS cost.

| Data | Cached | TTL | Rationale |
|---|---|---|---|
| Sites list | Yes | 15 minutes | Changes rarely; same response for all users |
| Measurements | No | — | High cardinality; always user-specific |
| Aggregations | Yes | 15 minutes | Expensive to compute; same result for same query |

**Trade-off:** Cache is per-process. With a single Uvicorn worker on a `t3.micro`, this is perfectly sufficient, there is no cross-process cache sharing problem. A production upgrade running multiple workers would swap `TTLCache` for a shared Redis instance or ElastiCache.

---

## Logging

Configured in `app/core/logger.py`. Each module obtains a named logger via `get_logger(__name__)`.

| Handler | Level | Destination |
|---|---|---|
| `StreamHandler` | `INFO` | stdout → systemd/journald on EC2 |
| `RotatingFileHandler` | `DEBUG` | `logs/airquality.log` (5 MB × 3 files) |

Log format:
```
2026-04-28 12:00:00 | INFO     | app.routes.sites | Fetched 42 sites
```

The `logs/` directory is created automatically on startup and is excluded from version control.

---

## Error Handling

All errors return a consistent envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "detail": "end_time: end_time must be after start_time"
  }
}
```

| Exception | Handler | Status |
|---|---|---|
| `RequestValidationError` | `validation_exception_handler` | 422 |
| `pydantic.ValidationError` (from `Depends()`) | `pydantic_validation_handler` | 422 |
| `ValueError` (business logic) | `value_error_handler` | 400 |
| `HTTPException` | `http_exception_handler` | varies |
| `httpx.HTTPStatusError` | `airqo_upstream_error_handler` | 502 / 404 / 429 |
| `httpx.TimeoutException` | `airqo_timeout_handler` | 504 |
| `httpx.ConnectError` | `airqo_connect_error_handler` | 502 |
| `Exception` (catch-all) | `unhandled_exception_handler` | 500 |


---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `AIRQO_API_KEY` | Yes | — | AirQo API token |
| `AIRQO_BASE_URL` | No | `https://api.airqo.net/api/v2` | AirQo base URL |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Frontend URL |

Create a `.env` file at `backend/`:

```env
AIRQO_API_KEY=your_api_key_here
AIRQO_BASE_URL=https://api.airqo.net/api/v2
ALLOWED_ORIGINS=http://localhost:5173
```

---

## Running Locally

```bash
# Clone and enter the backend directory
git clone https://github.com/Afeez1131/urbanbetter
cd airquality/backend

# Create and activate virtual environment
python3.11 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env
cp .env.example .env             # then fill in AIRQO_API_KEY

# Start the server
uvicorn app.main:app --reload --port 8000
```

API is available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

**Example requests**

```bash
# Fetch sites for Ghana
curl "http://localhost:8000/api/sites?country=Ghana"

# Fetch measurements
curl "http://localhost:8000/api/measurements?site_id=<SITE_ID>&start_time=2026-04-01&end_time=2026-04-07"

# Fetch aggregation
curl "http://localhost:8000/api/measurements/aggregate?site_id=<SITE_ID>&start_time=2026-04-01&end_time=2026-04-07"
```

---

## EC2 Deployment

The backend is deployed on an **AWS EC2 `t3.micro`** instance (free tier) behind **Nginx** as a reverse proxy, with **Uvicorn** serving the FastAPI app and **systemd** managing the process.


**Production stack summary:**

| Component | Role |
|---|---|
| EC2 `t3.micro` | Application host (free tier) |
| Nginx | Reverse proxy |
| Uvicorn | ASGI server |
| systemd | Service supervision and auto-restart |
| `.env` on server | Secret management (never committed) |
