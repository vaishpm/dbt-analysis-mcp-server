from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import Settings


@dataclass(frozen=True)
class CommandResult:
    command: list[str]
    returncode: int
    stdout: str
    stderr: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "command": self.command,
            "returncode": self.returncode,
            "stdout": self.stdout,
            "stderr": self.stderr,
        }


class DbtRunner:
    def __init__(self, settings: Settings):
        settings.validate()
        self.settings = settings

    def run(self, args: list[str], timeout_seconds: int | None = None) -> CommandResult:
        command = [self.settings.dbt_path, *args]

        completed = subprocess.run(
            command,
            cwd=self.settings.dbt_project_dir,
            text=True,
            capture_output=True,
            timeout=timeout_seconds or self.settings.command_timeout_seconds,
            check=False,
        )

        return CommandResult(
            command=command,
            returncode=completed.returncode,
            stdout=completed.stdout,
            stderr=completed.stderr,
        )

    def base_flags(self) -> list[str]:
        flags: list[str] = []
        if self.settings.dbt_profiles_dir:
            flags.extend(["--profiles-dir", str(self.settings.dbt_profiles_dir)])
        if self.settings.dbt_target:
            flags.extend(["--target", self.settings.dbt_target])
        return flags

    def build_selector_flags(self, select: str | None = None, exclude: str | None = None) -> list[str]:
        flags: list[str] = []
        if select:
            flags.extend(["--select", select])
        if exclude:
            flags.extend(["--exclude", exclude])
        return flags

    @staticmethod
    def parse_json_lines(output: str) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for line in output.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return rows

    def read_project_file(self, relative_path: str) -> str:
        path = (self.settings.dbt_project_dir / relative_path).resolve()
        project_root = self.settings.dbt_project_dir.resolve()

        if project_root not in path.parents and path != project_root:
            raise ValueError("Path must stay inside DBT_PROJECT_DIR")
        if path.suffix.lower() not in {".sql", ".yml", ".yaml", ".md"}:
            raise ValueError("Only .sql, .yml, .yaml, and .md files can be read")
        if not path.exists() or not path.is_file():
            raise FileNotFoundError(f"File does not exist: {relative_path}")

        return path.read_text(encoding="utf-8")
