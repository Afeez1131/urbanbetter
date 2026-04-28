# AirWatch — Air Quality Dashboard

A full-stack web application for querying and visualising historical air quality data across West Africa (Ghana and Nigeria), built on top of the [AirQo API](https://docs.airqo.net/airqo-rest-api-documentation).

**Live:** [https://d10ln88g8k549v.cloudfront.net](https://d10ln88g8k549v.cloudfront.net)

---

## Table of Contents

- [Architecture](#architecture)
- [AWS Service Choices](#aws-service-choices)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [CI/CD](#cicd)

---

## Architecture

```
User
 │
 ├──► CloudFront (HTTPS)
 │         │
 │         ├──► S3 Bucket              (React SPA, static files)
 │         │
 │         └──► /api/* ──► EC2 t3.micro
 │                              └── Nginx (reverse proxy :80)
 │                                    └── Uvicorn (FastAPI :8000)
```

All traffic enters through **CloudFront**. The frontend (static files) is served from **S3**. API requests (`/api/*`) are forwarded by CloudFront to the **EC2** instance running the FastAPI backend behind Nginx. This means the browser only ever talks to one HTTPS origin — no mixed content issues, no CORS needed.

---

## AWS Service Choices

### S3: Frontend Hosting

The React frontend compiles to a folder of static files (HTML, CSS, JS). S3 is the natural fit: it stores and serves static files reliably, scales automatically, and costs almost nothing at low traffic. There is no server to provision, patch, or restart.

**Free tier:** 5 GB storage · 20,000 GET requests/month · 2,000 PUT requests/month

### CloudFront: CDN and HTTPS

S3 alone serves over plain HTTP. CloudFront sits in front of it to provide:
- **HTTPS** — required for secure browser access
- **Edge caching** — assets served from the nearest AWS edge location
- **Single origin** — both the frontend and the `/api/*` backend are behind the same domain, eliminating mixed-content and CORS issues
- **Custom error responses** — 403/404 errors return `index.html` so React Router handles all client-side navigation correctly

**Free tier:** 1 TB data transfer/month · 10 million requests/month (12 months)

### EC2 t3.micro: Backend

The FastAPI backend is a long-running Python process that makes outbound HTTP calls to the AirQo API, applies AQI classification logic, and caches responses in memory. This stateful, compute-bound workload is not suited to serverless (Lambda cold starts + execution time limits would hurt). A continuously running EC2 instance is the right fit and stays within free tier limits.

**t3.micro** was chosen for the free tier eligibility.

**Free tier:** 750 hrs/month for 12 months

---

## Tech Stack

### Backend

| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.136.1 | Web framework |
| Uvicorn | 0.46.0 | ASGI server |
| Pydantic v2 | 2.13.3 | Validation and settings |
| httpx | 0.28.1 | Async HTTP client for AirQo API |
| orjson | 3.11.8 | Fast JSON serialisation |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 8.0 | Build tool and dev server |
| Tailwind CSS | 4.2 | Utility-first styling |
| Axios | 1.15 | HTTP client |
| ApexCharts | 5.10 | Interactive time-series chart |
| dayjs | 1.11 | Date parsing and validation |

---

## Project Structure

```
airquality/
├── backend/                  # FastAPI REST API
│   ├── app/
│   │   ├── main.py           # App factory, middleware, router registration
│   │   ├── core/             # Settings, cache, exceptions, logger
│   │   ├── external/airqo/   # AirQo API client + AQI classification
│   │   ├── routes/           # /api/sites, /api/measurements
│   │   └── schemas/          # Request and response models
│   └── README.md             # Backend technical reference
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── App.jsx           # Root component, layout, filter bar
│   │   ├── api/              # Axios instance and API calls
│   │   ├── hooks/            # useSites, useMeasurements
│   │   ├── components/       # UI, controls, dashboard components
│   │   └── utils/            # Date helpers
│   └── README.md             # Frontend technical reference
├── .github/workflows/        # GitHub Actions CI/CD
└── README.md                 # This file
```

---

## Running Locally

### Prerequisites

- Python 3.11+
- Node.js 20+
- An AirQo API key ([docs.airqo.net/]( https://docs.airqo.net/airqo-rest-api-documentation))

### Backend

```bash
cd backend

# Create and activate virtual environment
python3.11 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Open .env and fill in your AIRQO_API_KEY

# Start the server
uvicorn app.main:app --reload --port 8000
```

API available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Start dev server
npm run dev
```

App runs at `http://localhost:5173`. The backend must be running first.

---

## CI/CD

Two GitHub Actions workflows run automatically on every push to `main`:

| Workflow | Trigger | Action |
|---|---|---|
| `deploy-backend.yml` | Changes to `backend/**` | SSH into EC2 → `git pull` → restart systemd service |
| `deploy-frontend.yml` | Changes to `frontend/**` | `npm run build` → S3 sync → CloudFront cache invalidation |

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `EC2_HOST` | EC2 public IP address |
| `EC2_SSH_KEY` | Contents of the `.pem` key pair file |

---

