from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .ai import AIProviderError, get_provider_name
from .config import settings
from .database import Base, engine
from .observability import (
    RequestContextMiddleware,
    configure_logging,
    init_sentry,
)
from .rate_limit import RateLimitMiddleware
from .routers import (
    admin,
    auth,
    coach,
    copilot,
    dashboard,
    interviews,
    preparation_goals,
    providers,
    questions,
    skills,
    users,
)

configure_logging()
init_sentry()

if settings.environment == "development" or settings.database_url.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, version="0.2.0")


@app.exception_handler(AIProviderError)
async def ai_provider_error_handler(request: Request, exc: AIProviderError):
    return JSONResponse(status_code=502, content={"detail": str(exc)})


app.add_middleware(RequestContextMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(providers.router)
app.include_router(users.router)
app.include_router(interviews.router)
app.include_router(questions.router)
app.include_router(skills.router)
app.include_router(copilot.router)
app.include_router(coach.router)
app.include_router(preparation_goals.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "ai_provider": get_provider_name(),
        "environment": settings.environment,
    }


@app.get("/api/ready")
def ready():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ready"}

