from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _optional_path(value: str | None) -> Path | None:
    if not value:
        return None
    return Path(value).expanduser().resolve()


@dataclass(frozen=True)
class Settings:
    dbt_project_dir: Path
    dbt_path: str = "dbt"
    dbt_profiles_dir: Path | None = None
    dbt_target: str | None = None
    default_limit: int = 100
    command_timeout_seconds: int = 120
    allow_dbt_run: bool = False

    @classmethod
    def from_env(cls) -> "Settings":
        project_dir = os.getenv("DBT_PROJECT_DIR")
        if not project_dir:
            raise RuntimeError("DBT_PROJECT_DIR must point to a folder containing dbt_project.yml")

        default_limit = int(os.getenv("DBT_DEFAULT_LIMIT", "100"))
        timeout = int(os.getenv("DBT_COMMAND_TIMEOUT_SECONDS", "120"))
        allow_dbt_run = os.getenv("ALLOW_DBT_RUN", "false").lower() in {"1", "true", "yes"}

        return cls(
            dbt_project_dir=Path(project_dir).expanduser().resolve(),
            dbt_path=os.getenv("DBT_PATH", "dbt"),
            dbt_profiles_dir=_optional_path(os.getenv("DBT_PROFILES_DIR")),
            dbt_target=os.getenv("DBT_TARGET"),
            default_limit=default_limit,
            command_timeout_seconds=timeout,
            allow_dbt_run=allow_dbt_run,
        )

    def validate(self) -> None:
        project_file = self.dbt_project_dir / "dbt_project.yml"
        if not project_file.exists():
            raise RuntimeError(f"DBT_PROJECT_DIR does not contain dbt_project.yml: {self.dbt_project_dir}")

        if self.dbt_profiles_dir and not self.dbt_profiles_dir.exists():
            raise RuntimeError(f"DBT_PROFILES_DIR does not exist: {self.dbt_profiles_dir}")
