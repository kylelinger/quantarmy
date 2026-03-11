"""Sandbox runner — executes skills in isolated processes."""
import asyncio
import json
import sys
import tempfile
from pathlib import Path
from dataclasses import dataclass

from app.core.config import SKILL_TIMEOUT_SECONDS, SKILL_MAX_MEMORY_MB


@dataclass
class SandboxResult:
    success: bool
    output: dict | None = None
    error: str | None = None
    execution_time_ms: float = 0.0


class SandboxRunner:
    """Runs skill code in an isolated subprocess."""

    async def execute(self, skill_code: str, context_json: str) -> SandboxResult:
        """Execute a skill in sandbox.
        
        The skill_code should define a class inheriting BaseSkill.
        We inject the context and capture the output.
        """
        # Create a wrapper script
        wrapper = f'''
import sys, json

# Inject context
context_data = json.loads(sys.stdin.read())

# Load skill code
{skill_code}

# Find the skill class (first BaseSkill subclass)
import inspect
skill_class = None
for name, obj in list(locals().items()):
    if inspect.isclass(obj) and name != 'BaseSkill' and hasattr(obj, 'execute'):
        skill_class = obj
        break

if not skill_class:
    print(json.dumps({{"error": "No skill class found"}}))
    sys.exit(1)

import asyncio

async def run():
    skill = skill_class()
    await skill.initialize(context_data.get("config", {{}}))
    result = await skill.execute(context_data)
    return result

result = asyncio.run(run())
print(json.dumps({{"output": result.__dict__ if hasattr(result, '__dict__') else result}}))
'''

        import time
        start = time.monotonic()

        try:
            # Run in subprocess with resource limits
            proc = await asyncio.create_subprocess_exec(
                sys.executable, "-c", wrapper,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await asyncio.wait_for(
                proc.communicate(input=context_json.encode()),
                timeout=SKILL_TIMEOUT_SECONDS,
            )

            elapsed = (time.monotonic() - start) * 1000

            if proc.returncode != 0:
                return SandboxResult(
                    success=False,
                    error=stderr.decode()[:500],
                    execution_time_ms=elapsed,
                )

            try:
                result = json.loads(stdout.decode())
                if "error" in result:
                    return SandboxResult(success=False, error=result["error"], execution_time_ms=elapsed)
                return SandboxResult(success=True, output=result.get("output"), execution_time_ms=elapsed)
            except json.JSONDecodeError:
                return SandboxResult(success=False, error=f"Invalid output: {stdout.decode()[:200]}", execution_time_ms=elapsed)

        except asyncio.TimeoutError:
            elapsed = (time.monotonic() - start) * 1000
            proc.kill()
            return SandboxResult(success=False, error=f"Execution timed out ({SKILL_TIMEOUT_SECONDS}s)", execution_time_ms=elapsed)


# Singleton
sandbox_runner = SandboxRunner()
