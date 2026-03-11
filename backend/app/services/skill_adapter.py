"""LLM-powered Skill Adapter — adapts GitHub repos into QuantArmy skills."""
import asyncio
import subprocess
import tempfile
from pathlib import Path
from dataclasses import dataclass

from app.core.config import IMPORTED_SKILLS_DIR, SKILL_MAX_REPO_SIZE_MB


@dataclass
class AdaptResult:
    success: bool
    skill_code: str | None = None
    error: str | None = None
    detected_type: str | None = None
    detected_interface: dict | None = None


class SkillAdapter:
    """Adapts external code into QuantArmy's BaseSkill interface using LLM."""

    async def analyze_repo(self, github_url: str) -> dict:
        """Clone and analyze a GitHub repository.
        
        Returns:
            dict with keys: files, main_language, detected_type, dependencies
        """
        # 1. Clone repo (shallow, limited size)
        tmp_dir = tempfile.mkdtemp(prefix="qa_import_")
        try:
            proc = await asyncio.create_subprocess_exec(
                "git", "clone", "--depth", "1", github_url, tmp_dir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)

            if proc.returncode != 0:
                return {"error": f"Git clone failed: {stderr.decode()[:200]}"}

            # 2. Check repo size
            repo_path = Path(tmp_dir)
            total_size = sum(f.stat().st_size for f in repo_path.rglob("*") if f.is_file())
            if total_size > SKILL_MAX_REPO_SIZE_MB * 1024 * 1024:
                return {"error": f"Repository too large: {total_size / 1024 / 1024:.1f}MB (max {SKILL_MAX_REPO_SIZE_MB}MB)"}

            # 3. Scan files
            py_files = list(repo_path.rglob("*.py"))
            files_info = []
            for f in py_files[:50]:  # Limit to 50 files
                try:
                    content = f.read_text(errors="ignore")[:5000]  # First 5000 chars
                    files_info.append({
                        "path": str(f.relative_to(repo_path)),
                        "size": f.stat().st_size,
                        "preview": content,
                    })
                except Exception:
                    pass

            return {
                "path": tmp_dir,
                "files": files_info,
                "file_count": len(py_files),
                "total_size_mb": total_size / 1024 / 1024,
            }

        except asyncio.TimeoutError:
            return {"error": "Git clone timed out (60s)"}

    async def generate_adapter(self, repo_analysis: dict, role_type: str) -> AdaptResult:
        """Use LLM to generate adapter code that wraps the repo's functionality.
        
        TODO: Implement LLM call to:
        1. Understand what the repo does
        2. Map its inputs/outputs to our BaseSkill interface
        3. Generate a Python adapter class
        """
        # Placeholder - will be implemented with LLM integration
        return AdaptResult(
            success=False,
            error="LLM adapter generation not yet implemented",
        )

    async def test_in_sandbox(self, adapter_code: str, role_type: str) -> dict:
        """Run the adapted skill in sandbox with test data.
        
        TODO: Implement sandbox execution:
        1. Write adapter to temp file
        2. Run in subprocess with resource limits
        3. Feed test TradeContext
        4. Validate SkillOutput format
        """
        return {
            "success": False,
            "error": "Sandbox testing not yet implemented",
            "ticks_run": 0,
            "output_valid": False,
        }


# Singleton
skill_adapter = SkillAdapter()
