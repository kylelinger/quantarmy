"""Skill management API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.skill import Skill, SkillImport

router = APIRouter(prefix="/api/skills", tags=["skills"])


class SkillResponse(BaseModel):
    id: str
    name: str
    role_type: str
    version: str
    description: str
    author: str
    source: str
    source_url: str | None
    parameters: list
    backtest_result: dict | None
    status: str

    class Config:
        from_attributes = True


class ImportRequest(BaseModel):
    github_url: str
    role_type: str


class BacktestRequest(BaseModel):
    symbol: str
    period: str = "3m"
    config: dict | None = None


def _ok(data):
    return {"ok": True, "data": data, "error": None}


@router.get("")
async def list_skills(
    role_type: str | None = None,
    source: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List available skills with optional filters."""
    query = select(Skill).where(Skill.status == "active")
    if role_type:
        query = query.where(Skill.role_type == role_type)
    if source:
        query = query.where(Skill.source == source)
    if search:
        query = query.where(Skill.name.ilike(f"%{search}%"))

    result = await db.execute(query)
    skills = result.scalars().all()
    return _ok([SkillResponse.model_validate(s).model_dump() for s in skills])


@router.get("/{skill_id}")
async def get_skill(skill_id: str, db: AsyncSession = Depends(get_db)):
    """Get skill details."""
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return _ok(SkillResponse.model_validate(skill).model_dump())


@router.post("/import")
async def import_skill(req: ImportRequest, db: AsyncSession = Depends(get_db)):
    """Start importing a skill from GitHub."""
    skill_import = SkillImport(
        github_url=req.github_url,
        role_type=req.role_type,
        status="analyzing",
        progress=0,
        steps=[
            {"name": "clone", "status": "running"},
            {"name": "analyze", "status": "pending"},
            {"name": "adapt", "status": "pending"},
            {"name": "test", "status": "pending"},
        ],
    )
    db.add(skill_import)
    await db.commit()
    await db.refresh(skill_import)

    # TODO: kick off async import pipeline (clone → LLM analyze → adapt → test)

    return _ok({"import_id": skill_import.id, "status": skill_import.status})


@router.get("/import/{import_id}")
async def get_import_status(import_id: str, db: AsyncSession = Depends(get_db)):
    """Check import progress."""
    result = await db.execute(select(SkillImport).where(SkillImport.id == import_id))
    imp = result.scalar_one_or_none()
    if not imp:
        raise HTTPException(status_code=404, detail="Import not found")

    return _ok({
        "status": imp.status,
        "progress": imp.progress,
        "steps": imp.steps,
        "skill_id": imp.skill_id,
        "error": imp.error_message,
    })


@router.post("/{skill_id}/backtest")
async def backtest_skill(skill_id: str, req: BacktestRequest, db: AsyncSession = Depends(get_db)):
    """Run a backtest on a skill."""
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # TODO: implement actual backtest via sandbox
    return _ok({
        "trades": 0,
        "win_rate": 0.0,
        "profit_factor": 0.0,
        "max_drawdown": 0.0,
        "sharpe_ratio": 0.0,
        "total_return": 0.0,
        "message": "Backtest engine not yet implemented",
    })
