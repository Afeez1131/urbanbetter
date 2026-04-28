# AirQuality Dashboard: Frontend

React single-page application for querying, visualising, and analysing historical air quality data across West Africa. Consumes the AirQuality Dashboard API.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Components](#components)
- [API Integration](#api-integration)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Building for Production](#building-for-production)

---

## Overview

The dashboard lets users:

1. **Select** a country (Nigeria, Ghana, or both) and a specific monitoring site
2. **Set** a date range (up to 31 days, defaulting to the last 7 days)
3. **Fetch** historical measurements and view them across four panels, stat cards, a time-series chart, a category breakdown, and a paginated data table

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 8.0 | Build tool and dev server |
| Tailwind CSS | 4.2 | Utility-first styling |
| Axios | 1.15 | HTTP client |
| ApexCharts / react-apexcharts | 5.10 / 2.1 | Interactive time-series chart |
| dayjs | 1.11 | Date parsing, formatting, validation |

---

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── App.jsx                        # Root component, layout, state, filter bar
│   ├── main.jsx                       # React entry point
│   ├── api/
│   │   └── index.js                   # Axios instance + all API calls
│   ├── hooks/
│   │   ├── useSites.js                # Fetches sites when country changes
│   │   └── useMeasurements.js         # Fetches measurements + aggregation in parallel
│   ├── utils/
│   │   └── dateUtils.js               # Date helpers, validation, formatters (dayjs)
│   └── components/
│       ├── controls/
│       │   ├── CountrySelector.jsx    # Country dropdown (Nigeria / Ghana / Both)
│       │   ├── SiteSelector.jsx       # Site dropdown, grouped by city, online indicator
│       │   └── DateRangePicker.jsx    # From / To date inputs, 31-day max enforced
│       ├── dashboard/
│       │   ├── AggregationPanel.jsx   # KPI stat cards + Best / Worst reading cards
│       │   ├── AQIChart.jsx           # ApexCharts time-series line chart
│       │   └── DataTable.jsx          # Sortable, paginated measurements table
│       └── ui/
│           ├── AQIBadge.jsx           # Colour-coded AQI category pill
│           ├── EmptyState.jsx         # Empty / initial state illustration
│           ├── ErrorBanner.jsx        # Inline error with retry action
│           └── LoadingSpinner.jsx     # Loading state indicator
```

---

## Features

### Filter Bar

- **Country selector**: Nigeria, Ghana, or both; changing country resets the site selection and clears any existing results
- **Site selector**: populated dynamically from the API after a country is chosen; sites are grouped by city with online (`●`) / offline (`○`) indicators
- **Date range picker**: two date inputs (From / To) with the last 7 days pre-filled; enforces a 31-day maximum via `min`/`max` attributes
- **Fetch Data** button: disabled until a site is selected; shows "Fetching…" during load
- **Clear** button: appears after a query is made; resets all results without clearing the filter selections
- **Site status strip**: shown below the controls once a site is selected; displays online status, site name, city, and country

### Stat Cards (AggregationPanel)

Four KPI cards rendered after a successful fetch:

| Card | Value |
|---|---|
| Total Readings | Count of data points returned |
| Average PM2.5 | Mean µg/m³ across the date range |
| Data Completeness | Actual vs expected hourly readings as a % |
| Dominant Category | Highest-frequency AQI category with its badge |

Below the KPI row, two accent cards show the **Worst Reading** (red left border, faint red-tinted value area) and **Best Reading** (green left border, faint green-tinted value area), each showing PM2.5 value, timestamp, and AQI badge.

### AQI Category Breakdown (BreakdownPanel)

One row per AQI category present in the dataset:
- Colour-coded badge (fixed width, truncation-safe)
- Animated progress bar proportional to percentage, animates in on mount
- Percentage value
- Raw count

### Time-Series Chart (AQIChart)

Built with **ApexCharts** (`react-apexcharts`):

- Smooth line chart with no dot markers at rest, dot on hover
- Datetime-aware X axis, tick labels adjust automatically with zoom level (e.g. `Apr 26` collapses to `HH:mm` when zoomed to hours)
- Four US EPA threshold reference lines annotated inline on the right axis: Good / Moderate / Sensitive / Unhealthy, no separate legend needed
- Built-in toolbar: drag-to-zoom, zoom in/out, pan, reset view, PNG download
- Custom tooltip showing timestamp, PM2.5 value in µg/m³, and a colour-coded AQI category badge

### Measurements Table (DataTable)

- **Columns**: Time · PM2.5 µg/m³ · AQI Category · Colour Name · City · Country · Site ID · Device ID
- Click **Time** or **PM2.5 µg/m³** headers to sort ascending / descending
- **Pagination footer**: page-size selector (10 / 20 / 50 / 100), record range indicator, Previous / Next buttons, always visible regardless of page count
- Rows highlight on hover

---

## Components

### `useSites(country)`

Fires `GET /api/sites?country=<country>` whenever `country` changes. Skips the request if `country` is empty. Returns `{ sites, loading, error }`.

### `useMeasurements()`

Exposes a `query(siteId, startDate, endDate)` function that:
1. Runs client-side date validation via `validateDateRange()` before touching the network
2. Fires `GET /api/measurements` and `GET /api/measurements/aggregate` **in parallel** with `Promise.all`

Returns `{ measurements, aggregation, loading, error, hasQueried, query, reset }`.

### `AQIBadge`

```jsx
<AQIBadge
  category="Moderate"
  color="#FFFF00"
  colorName="Yellow"
/>
```

Renders a pill badge with `backgroundColor` set to `color`. Text colour is black for light AQI colours (`#FFFF00`, `#00E400`) and white for all others. `colorName` is surfaced as a `title` tooltip.

### `SiteSelector`

Renders three distinct states:
- **Loading** — spinner with "Loading sites…" text
- **Error** — inline error message with a Retry button that re-triggers the sites fetch
- **Loaded** — `<select>` with sites grouped into `<optgroup>` by city, sorted alphabetically; disabled and greyed out when the sites list is empty

### `DateRangePicker`

The `max` on the start input is set to the current end date value, and the `min` on the end input is set to the current start date value, preventing logically invalid browser-native selections. Range validation is also enforced in `useMeasurements` before the API call.

---

## API Integration

All requests go through a single Axios instance in `src/api/index.js`:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});
```

The response interceptor normalises errors into `{ message, code, status }` using the backend's error envelope, so every UI error state displays the backend's human-readable `message` directly without any extra mapping.

| Function | Method | Endpoint |
|---|---|---|
| `fetchSites(country)` | GET | `/api/sites` |
| `fetchMeasurements(siteId, start, end)` | GET | `/api/measurements` |
| `fetchAggregation(siteId, start, end)` | GET | `/api/measurements/aggregate` |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Base URL of the backend API (no trailing slash) |

Create a `.env` file at `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

For production, point this to your CloudFront domain (API calls are routed through CloudFront to EC2):

```env
VITE_API_BASE_URL=https://<YOUR_CLOUDFRONT_DOMAIN>.cloudfront.net
```

> Vite only exposes variables prefixed with `VITE_` to the browser bundle. Never put secrets in frontend environment variables.

---

## Running Locally

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Start dev server
npm run dev
```

App runs at `http://localhost:5173`. The backend must be running at the URL set in `VITE_API_BASE_URL`.

Other scripts:

```bash
npm run lint      # ESLint
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
```

---

## Building for Production

```bash
npm run build
```

Output is written to `frontend/dist/`. Upload the contents of `dist/` to S3 for deployment.

```bash
# Verify the production build before uploading
npm run preview
```
