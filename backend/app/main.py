from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.exceptions import register_exception_handlers
from app.core.logger import get_logger
from app.core.settings import get_settings
from app.routes import measurements, sites

logger = get_logger(__name__)
settings = get_settings()

app = FastAPI(
    title="AirQuality Dashboard API",
    description="Air quality data for West Africa powered by AirQo",
    version="1.0.0",
)
logger.info("AirQuality Dashboard API starting up")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sites.router)
app.include_router(measurements.router)

# Register exception handlers
register_exception_handlers(app)


@app.get("/health")
async def health():
    return {"status": "ok"}
