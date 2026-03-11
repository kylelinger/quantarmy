"""Company management API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.company import Company, Role

router = APIRouter(prefix="/api/company", tags=["company"])

ROLE_TYPES = ["ceo", "cto", "strategist", "risk_officer", "collector", "executor", "analyst", "researcher"]


class CreateCompanyRequest(BaseModel):
    name: str
    initial_capital: float = 100_000.0
    market: str = "crypto"


class CompanyResponse(BaseModel):
    id: str
    name: str
    initial_capital: float
    current_equity: float
    market: str
    status: str

    class Config:
        from_attributes = True


def _ok(data):
    return {"ok": True, "data": data, "error": None}


def _err(msg: str, status: int = 400):
    raise HTTPException(status_code=status, detail={"ok": False, "data": None, "error": msg})


@router.post("")
async def create_company(req: CreateCompanyRequest, db: AsyncSession = Depends(get_db)):
    """Create a new company with all 8 roles."""
    company = Company(
        name=req.name,
        initial_capital=req.initial_capital,
        current_equity=req.initial_capital,
        market=req.market,
    )
    db.add(company)

    # Create all roles
    for role_type in ROLE_TYPES:
        role = Role(company_id=company.id, role_type=role_type)
        db.add(role)

    await db.commit()
    await db.refresh(company)
    return _ok(CompanyResponse.model_validate(company).model_dump())


@router.get("/{company_id}")
async def get_company(company_id: str, db: AsyncSession = Depends(get_db)):
    """Get company details."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        _err("Company not found", 404)
    return _ok(CompanyResponse.model_validate(company).model_dump())


@router.post("/{company_id}/reset")
async def reset_company(company_id: str, db: AsyncSession = Depends(get_db)):
    """Reset company: clear positions, restore initial capital."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        _err("Company not found", 404)

    company.current_equity = company.initial_capital
    company.status = "active"
    # TODO: clear positions
    await db.commit()
    return _ok({"message": "Company reset", "equity": company.current_equity})


@router.delete("/{company_id}")
async def delete_company(company_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a company."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        _err("Company not found", 404)

    await db.delete(company)
    await db.commit()
    return _ok({"message": "Company deleted"})
