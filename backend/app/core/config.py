"""Application configuration."""
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
SKILLS_DIR = BASE_DIR / "app" / "skills"
IMPORTED_SKILLS_DIR = SKILLS_DIR / "imported"

# Database
DATABASE_URL = f"sqlite+aiosqlite:///{DATA_DIR / 'quantarmy.db'}"

# Trading
DEFAULT_INITIAL_CAPITAL = 100_000.0
MAX_POSITIONS = 20
TICK_INTERVAL_SECONDS = 60  # How often the engine ticks

# Skill Sandbox
SKILL_TIMEOUT_SECONDS = 30
SKILL_MAX_MEMORY_MB = 256
SKILL_MAX_REPO_SIZE_MB = 50

# Market Data
BINANCE_REST_URL = "https://data-api.binance.vision"
YAHOO_FINANCE_URL = "https://query1.finance.yahoo.com"

# WebSocket
WS_HEARTBEAT_SECONDS = 30

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
SKILLS_DIR.mkdir(parents=True, exist_ok=True)
IMPORTED_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
