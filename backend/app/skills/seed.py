"""Seed built-in skills into the database on startup."""
from sqlalchemy import select

from app.core.database import async_session
from app.models.skill import Skill
from app.skills.catalog import BUILTIN_SKILL_CATALOG


async def seed_builtin_skills():
    """Ensure all built-in skills exist in the database."""
    async with async_session() as db:
        for spec in BUILTIN_SKILL_CATALOG:
            result = await db.execute(
                select(Skill).where(Skill.name == spec["name"], Skill.source == "builtin")
            )
            existing = result.scalar_one_or_none()

            if not existing:
                skill = Skill(
                    name=spec["name"],
                    role_type=spec["role_type"],
                    version=spec.get("version", "1.0.0"),
                    description=spec.get("description", ""),
                    author="QuantArmy",
                    source="builtin",
                    parameters=spec.get("parameters", []),
                    backtest_result=spec.get("backtest_result"),
                )
                db.add(skill)
                print(f"  ✅ Seeded skill: {spec['name']}")
            else:
                changed = False
                for field in ["role_type", "version", "description", "parameters", "backtest_result"]:
                    value = spec.get(field)
                    if getattr(existing, field) != value:
                        setattr(existing, field, value)
                        changed = True
                if changed:
                    print(f"  🔄 Updated skill: {spec['name']} → v{spec.get('version', '1.0.0')}")

        await db.commit()
