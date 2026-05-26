from __future__ import annotations

from typing import Any, Literal

from mcp.server.fastmcp import FastMCP

from .config import Settings
from .dbt_runner import DbtRunner

mcp = FastMCP("dbt-analysis")

_settings: Settings | None = None
_runner: DbtRunner | None = None


def get_runner() -> DbtRunner:
    global _settings, _runner

    if _runner is None:
        _settings = Settings.from_env()
        _runner = DbtRunner(_settings)
    return _runner


def _result_payload(result: Any) -> dict[str, Any]:
    if result.returncode == 0:
        return result.as_dict()
    return {
        **result.as_dict(),
        "error": "dbt command failed",
    }


@mcp.tool()
def dbt_list_resources(
    resource_type: Literal["model", "source", "seed", "snapshot", "test", "metric", "exposure", "all"] = "model",
    select: str | None = None,
    exclude: str | None = None,
) -> dict[str, Any]:
    """List dbt resources as structured JSON for discovery and lineage analysis."""
    runner = get_runner()
    args = [
        "ls",
        *runner.base_flags(),
        "--output",
        "json",
        *runner.build_selector_flags(select, exclude),
    ]
    if resource_type != "all":
        args.extend(["--resource-type", resource_type])

    result = runner.run(args)
    payload = _result_payload(result)
    payload["resources"] = runner.parse_json_lines(result.stdout)
    return payload


@mcp.tool()
def dbt_compile(select: str | None = None, exclude: str | None = None) -> dict[str, Any]:
    """Compile dbt SQL without running models, useful for inspecting generated SQL."""
    runner = get_runner()
    result = runner.run([
        "compile",
        *runner.base_flags(),
        *runner.build_selector_flags(select, exclude),
    ])
    return _result_payload(result)


@mcp.tool()
def dbt_show(select: str, limit: int | None = None) -> dict[str, Any]:
    """Preview a model, source, or SQL analysis with dbt show."""
    runner = get_runner()
    row_limit = limit or runner.settings.default_limit
    result = runner.run([
        "show",
        *runner.base_flags(),
        "--select",
        select,
        "--limit",
        str(row_limit),
    ])
    return _result_payload(result)


@mcp.tool()
def dbt_test(select: str | None = None, exclude: str | None = None) -> dict[str, Any]:
    """Run dbt tests for selected resources to validate data quality during analysis."""
    runner = get_runner()
    result = runner.run([
        "test",
        *runner.base_flags(),
        *runner.build_selector_flags(select, exclude),
    ])
    return _result_payload(result)


@mcp.tool()
def dbt_source_freshness(select: str | None = None, exclude: str | None = None) -> dict[str, Any]:
    """Check freshness for dbt sources used in analysis."""
    runner = get_runner()
    result = runner.run([
        "source",
        "freshness",
        *runner.base_flags(),
        *runner.build_selector_flags(select, exclude),
    ])
    return _result_payload(result)


@mcp.tool()
def read_dbt_project_file(relative_path: str) -> dict[str, Any]:
    """Read a dbt project SQL, YAML, or Markdown file by path relative to DBT_PROJECT_DIR."""
    runner = get_runner()
    return {
        "relative_path": relative_path,
        "content": runner.read_project_file(relative_path),
    }


@mcp.tool()
def dbt_run_analysis(select: str, exclude: str | None = None) -> dict[str, Any]:
    """Optionally run dbt analysis resources; disabled unless ALLOW_DBT_RUN=true."""
    runner = get_runner()
    if not runner.settings.allow_dbt_run:
        return {
            "error": "dbt run is disabled",
            "hint": "Set ALLOW_DBT_RUN=true only if you want this MCP server to execute dbt run.",
        }

    result = runner.run([
        "run",
        *runner.base_flags(),
        "--select",
        select,
        *runner.build_selector_flags(exclude=exclude),
    ])
    return _result_payload(result)


def main() -> None:
    mcp.run(transport="streamable-http")


if __name__ == "__main__":
    main()
