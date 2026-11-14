import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Dict, List
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from backend.app.database.init_db import init_db
from backend.app.api import (
    health,
    dashboard,
    scamshield,
    scamtrace,
    reports,
    datasets,
    analytics,
    auth,
    cases
)

# App Lifespan: Auto-initializes database schema & synthetic demonstration records
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting ShieldNet backend...")
    try:
        init_db()
    except Exception as e:
        print(f"Startup Warning: Database initialization error: {e}")
    yield
    print("Shutting down ShieldNet backend...")


app = FastAPI(
    title="ShieldNet — Cybersecurity Intelligence Platform",
    description=(
        "Unified Cybersecurity Intelligence Platform: "
        "1. Citizen Protection — digital scam detection, explainable message/URL analysis, and user defense. "
        "2. Network Intelligence — entity investigation, multi-hop graph intelligence, and scam network mapping."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration: Strictly restricted to verified local & production origins
# Prevents wildcard credentials vulnerabilities (RFC 6454 / W3C CORS specification)
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

raw_origins = os.getenv("ALLOWED_ORIGINS", "")
parsed_origins = []
if raw_origins:
    for o in raw_origins.split(","):
        cleaned = o.strip().rstrip("/")
        # Reject wildcard '*' when credentials are true (invalid CORS security hazard)
        if cleaned and cleaned != "*" and (cleaned.startswith("http://") or cleaned.startswith("https://")):
            parsed_origins.append(cleaned)

allowed_origins = parsed_origins if parsed_origins else DEFAULT_ALLOWED_ORIGINS

# Deployment preview regex (e.g. Vercel deployment branches)
raw_regex = os.getenv("ALLOWED_ORIGIN_REGEX", r"https://.*\.vercel\.app")
origin_regex = None if raw_regex.strip().lower() in ("", "none", "false") else raw_regex

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

# Rate Limiting Middleware (In-memory token bucket / sliding window per client IP)
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))
client_request_history: Dict[str, List[float]] = defaultdict(list)


@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Allow docs, openapi, and health check to skip strict limiting
    path = request.url.path
    if path in ["/docs", "/redoc", "/openapi.json", "/api/health"]:
        return await call_next(request)

    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    minute_ago = now - 60.0

    # Clean old requests
    client_request_history[client_ip] = [
        t for t in client_request_history[client_ip] if t > minute_ago
    ]

    if len(client_request_history[client_ip]) >= RATE_LIMIT:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded. Maximum 120 requests per minute allowed.",
                "retry_after_seconds": 60
            }
        )

    client_request_history[client_ip].append(now)
    response = await call_next(request)
    return response


# Include API Routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(scamshield.router, prefix="/api")
app.include_router(scamtrace.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(cases.router, prefix="/api")


@app.get("/")
def root_endpoint():
    return {
        "service": "ScamShield + Intelligent Scam Network Mapper API",
        "documentation": "/docs",
        "health": "/api/health",
        "dashboard_stats": "/api/dashboard/stats"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)
