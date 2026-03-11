"""Skill-related database models."""
from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, JSON, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _uuid() -> str:
    import uuid
    return str(uuid.uuid4())[:8]


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(16), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100))
    role_type: Mapped[str] = mapped_column(String(30))
    version: Mapped[str] = mapped_column(String(20), default="0.1.0")
    description: Mapped[str] = mapped_column(String(500), default="")
    author: Mapped[str] = mapped_column(String(100), default="QuantArmy")
    source: Mapped[str] = mapped_column(String(20), default="builtin")  # builtin | marketplace | github
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    parameters: Mapped[list] = mapped_column(JSON, default=list)  # list of Parameter dicts
    adapter_code: Mapped[str | None] = mapped_column(Text, nullable=True)  # LLM-generated adapter
    backtest_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | disabled | error
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class SkillImport(Base):
    __tablename__ = "skill_imports"

    id: Mapped[str] = mapped_column(String(16), primary_key=True, default=_uuid)
    github_url: Mapped[str] = mapped_column(String(500))
    role_type: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(20), default="analyzing")  # analyzing | adapting | testing | success | failed
    progress: Mapped[int] = mapped_column(Integer, default=0)
    steps: Mapped[list] = mapped_column(JSON, default=list)
    skill_id: Mapped[str | None] = mapped_column(String(16), nullable=True)  # created skill on success
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
