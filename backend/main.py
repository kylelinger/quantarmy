"""QuantArmy Backend — FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.api.company import router as company_router
from app.api.roles import router as roles_router
from app.api.skills import router as skills_router
from app.api.trading import router as trading_router
from app.api.market import router as market_router
from app.api.watchlist import router as watchlist_router
from app.ws.router import router as ws_router
from app.skills.seed import seed_builtin_skills


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    print("🚀 QuantArmy backend starting...")
    await init_db()
    await seed_builtin_skills()
    print("✅ Database initialized")
    yield
    print("🛑 QuantArmy backend shutting down")


app = FastAPI(
    title="QuantArmy API",
    description="AI Quantitative Trading Team Simulator",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://frontend-beige-kappa-51.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(company_router)
app.include_router(roles_router)
app.include_router(skills_router)
app.include_router(trading_router)
app.include_router(market_router)
app.include_router(watchlist_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return {"name": "QuantArmy API", "version": "0.1.0", "status": "ok"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
