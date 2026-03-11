"""Role management API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.company import Role

router = APIRouter(prefix="/api/company/{company_id}/roles", tags=["roles"])


class RoleResponse(BaseModel):
    id: str
    role_type: str
    active_skill_id: str | None
    config: dict
    status: str
    last_output: str | None

    class Config:
        from_attributes = True


class SetSkillRequest(BaseModel):
    skill_id: str
    config: dict | None = None


class UpdateConfigRequest(BaseModel):
    config: dict


def _ok(data):
    return {"ok": True, "data": data, "error": None}


@router.get("")
async def list_roles(company_id: str, db: AsyncSession = Depends(get_db)):
    """List all roles for a company."""
    result = await db.execute(select(Role).where(Role.company_id == company_id))
    roles = result.scalars().all()
    return _ok([RoleResponse.model_validate(r).model_dump() for r in roles])


@router.get("/{role_type}")
async def get_role(company_id: str, role_type: str, db: AsyncSession = Depends(get_db)):
    """Get a specific role."""
    result = await db.execute(
        select(Role).where(Role.company_id == company_id, Role.role_type == role_type)
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return _ok(RoleResponse.model_validate(role).model_dump())


@router.put("/{role_type}/skill")
async def set_role_skill(
    company_id: str, role_type: str, req: SetSkillRequest, db: AsyncSession = Depends(get_db)
):
    """Set/change the skill for a role."""
    result = await db.execute(
        select(Role).where(Role.company_id == company_id, Role.role_type == role_type)
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    role.active_skill_id = req.skill_id
    if req.config:
        role.config = req.config
    role.status = "active"

    await db.commit()
    return _ok(RoleResponse.model_validate(role).model_dump())


@router.put("/{role_type}/config")
async def update_role_config(
    company_id: str, role_type: str, req: UpdateConfigRequest, db: AsyncSession = Depends(get_db)
):
    """Update role configuration without changing skill."""
    result = await db.execute(
        select(Role).where(Role.company_id == company_id, Role.role_type == role_type)
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    role.config = {**role.config, **req.config}
    await db.commit()
    return _ok(RoleResponse.model_validate(role).model_dump())
