"""Seed built-in skills into the database on startup."""
from sqlalchemy import select

from app.core.database import async_session
from app.models.skill import Skill
from app.skills.builtin import BUILTIN_SKILLS


async def seed_builtin_skills():
    """Ensure all built-in skills exist in the database."""
    async with async_session() as db:
        for skill_class in BUILTIN_SKILLS:
            # Check if skill already exists (by name + source=builtin)
            result = await db.execute(
                select(Skill).where(Skill.name == skill_class.name, Skill.source == "builtin")
            )
            existing = result.scalar_one_or_none()

            if not existing:
                skill = Skill(
                    name=skill_class.name,
                    role_type=skill_class.role_type,
                    version=skill_class.version,
                    description=skill_class.description,
                    author="QuantArmy",
                    source="builtin",
                    parameters=skill_class.parameters,
                )
                db.add(skill)
                print(f"  ✅ Seeded skill: {skill_class.name}")
            else:
                # Update metadata if version changed
                if existing.version != skill_class.version:
                    existing.description = skill_class.description
                    existing.parameters = skill_class.parameters
                    existing.version = skill_class.version
                    print(f"  🔄 Updated skill: {skill_class.name} → v{skill_class.version}")

        await db.commit()
