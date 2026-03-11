"""Company-related database models."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, ForeignKey, JSON, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())[:8]


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(16), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100))
    initial_capital: Mapped[float] = mapped_column(Float, default=100_000.0)
    current_equity: Mapped[float] = mapped_column(Float, default=100_000.0)
    market: Mapped[str] = mapped_column(String(20), default="crypto")  # crypto | stock
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | paused | stopped
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    roles: Mapped[list["Role"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    positions: Mapped[list["Position"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    trades: Mapped[list["Trade"]] = relationship(back_populates="company", cascade="all, delete-orphan")


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(16), primary_key=True, default=_uuid)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    role_type: Mapped[str] = mapped_column(String(30))  # ceo, strategist, etc.
    active_skill_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(20), default="idle")  # active | idle | error
    last_output: Mapped[str | None] = mapped_column(String(500), nullable=True)

    company: Mapped["Company"] = relationship(back_populates="roles")


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[str] = mapped_column(String(16), primary_key=True, default=_uuid)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    symbol: Mapped[str] = mapped_column(String(20))
    side: Mapped[str] = mapped_column(String(10))  # long | short
    size: Mapped[float] = mapped_column(Float)
    entry_price: Mapped[float] = mapped_column(Float)
    current_price: Mapped[float] = mapped_column(Float, default=0.0)
    unrealized_pnl: Mapped[float] = mapped_column(Float, default=0.0)
    strategy: Mapped[str] = mapped_column(String(50), default="")
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    company: Mapped["Company"] = relationship(back_populates="positions")


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[str] = mapped_column(String(16), primary_key=True, default=_uuid)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    symbol: Mapped[str] = mapped_column(String(20))
    side: Mapped[str] = mapped_column(String(10))  # buy | sell
    size: Mapped[float] = mapped_column(Float)
    price: Mapped[float] = mapped_column(Float)
    fee: Mapped[float] = mapped_column(Float, default=0.0)
    strategy: Mapped[str] = mapped_column(String(50), default="")
    signal_reason: Mapped[str] = mapped_column(String(200), default="")
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    company: Mapped["Company"] = relationship(back_populates="trades")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    from_role: Mapped[str] = mapped_column(String(30))
    to_role: Mapped[str] = mapped_column(String(30))
    msg_type: Mapped[str] = mapped_column(String(20))  # signal | report | alert | request
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
