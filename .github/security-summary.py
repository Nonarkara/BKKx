#!/usr/bin/env python3
"""Turn Semgrep and Trivy SARIF into a GitHub Actions job summary.

Secret findings are listed as file:line and rule id only. Matched values are
stripped from the SARIF before code scanning upload. This script never prints
a matched secret.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

SEVERITY_ORDER = ("critical", "high", "medium", "low", "unknown")
SEVERITY_TAGS = {"CRITICAL": "critical", "HIGH": "high", "MEDIUM": "medium", "LOW": "low", "UNKNOWN": "unknown"}
LEVEL_TO_SEVERITY = {"error": "high", "warning": "medium", "note": "low", "none": "unknown"}
TOP_LIMIT = 20
SAFE_MESSAGE_KEYS = ("Package", "Installed Version", "Fixed Version")


def main(argv: list[str]) -> int:
    specs = argv[1:] or ["semgrep:semgrep.sarif", "trivy:trivy.sarif"]
    sections: list[str] = ["## Security scan (report only)", ""]
    sections.append("Findings do not fail this workflow. Secret values are omitted.")
    sections.append("")
    for spec in specs:
        label, path = _split_spec(spec)
        sections.extend(_summarize(label, Path(path)))
        sections.append("")
    text = "\n".join(sections).rstrip() + "\n"
    sys.stdout.write(text)
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as handle:
            handle.write(text)
    return 0


def _split_spec(spec: str) -> tuple[str, str]:
    if ":" in spec:
        label, path = spec.split(":", 1)
        return label, path
    return Path(spec).stem, spec


def _summarize(label: str, path: Path) -> list[str]:
    lines = [f"### {label}", ""]
    if not path.is_file():
        lines.append(f"No SARIF file at `{path}`.")
        counts = {name: 0 for name in SEVERITY_ORDER}
        lines.extend(_count_table(counts))
        return lines
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        lines.append(f"Could not read SARIF (`{exc.__class__.__name__}`).")
        return lines

    counts = {name: 0 for name in SEVERITY_ORDER}
    ranked: list[tuple[str, str, str, str]] = []
    secrets: list[tuple[str, str]] = []
    notes: list[str] = []

    for run in data.get("runs") or []:
        rules = _rules(run)
        version = ((run.get("tool") or {}).get("driver") or {}).get("semanticVersion")
        if version:
            lines.append(f"Tool version `{version}`.")
            lines.append("")
        for invocation in run.get("invocations") or []:
            for note in invocation.get("toolExecutionNotifications") or []:
                if note.get("level") in {"error", "warning"}:
                    text = ((note.get("message") or {}).get("text") or "").strip()
                    if text:
                        notes.append(text.splitlines()[0][:240])
        for result in run.get("results") or []:
            rule = rules.get(result.get("ruleId") or "", {})
            secret = _is_secret(result, rule)
            severity = _severity(result, rule)
            counts[severity] = counts.get(severity, 0) + 1
            path_text, line_no = _location(result)
            where = f"{path_text}:{line_no}" if line_no else path_text
            rule_id = str(result.get("ruleId") or "unknown-rule")
            if secret:
                secrets.append((where, rule_id))
                _redact_result(result)
                _redact_rule(rule)
                if severity in {"critical", "high"}:
                    ranked.append((severity, where, rule_id, ""))
            elif severity in {"critical", "high"}:
                ranked.append((severity, where, rule_id, _safe_detail(result, rule)))
            _ensure_level(result, severity)
            _normalize_location(result)

    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    lines.extend(_count_table(counts))
    lines.append("")
    lines.append("#### Critical and high")
    lines.append("")
    if not ranked:
        lines.append("None.")
    else:
        ranked.sort(key=lambda item: (0 if item[0] == "critical" else 1, item[1], item[2]))
        shown = ranked[:TOP_LIMIT]
        for severity, where, rule_id, detail in shown:
            extra = f" — {detail}" if detail else ""
            lines.append(f"- **{severity}** `{where}` `{rule_id}`{extra}")
        remaining = len(ranked) - len(shown)
        if remaining:
            lines.append(f"- {remaining} more critical/high findings omitted from this summary.")
    lines.append("")
    lines.append("#### Secrets")
    lines.append("")
    if not secrets:
        lines.append("None. A secret would be listed as file:line and rule id only.")
    else:
        for where, rule_id in secrets:
            lines.append(f"- `{where}` `{rule_id}`")
    if notes:
        lines.append("")
        lines.append("#### Scanner notes")
        lines.append("")
        for note in notes[:10]:
            lines.append(f"- {note}")
    return lines


def _rules(run: dict) -> dict:
    found = {}
    driver = (run.get("tool") or {}).get("driver") or {}
    for rule in driver.get("rules") or []:
        if rule.get("id"):
            found[rule["id"]] = rule
    for extension in (run.get("tool") or {}).get("extensions") or []:
        for rule in extension.get("rules") or []:
            if rule.get("id"):
                found[rule["id"]] = rule
    return found


def _severity(result: dict, rule: dict) -> str:
    for source in (rule.get("properties") or {}, result.get("properties") or {}):
        for tag in source.get("tags") or []:
            mapped = SEVERITY_TAGS.get(str(tag).upper())
            if mapped:
                return mapped
    score = (result.get("properties") or {}).get("security-severity")
    if score is None:
        score = (rule.get("properties") or {}).get("security-severity")
    if score is not None:
        try:
            value = float(score)
        except (TypeError, ValueError):
            value = None
        if value is not None:
            if value >= 9.0:
                return "critical"
            if value >= 7.0:
                return "high"
            if value >= 4.0:
                return "medium"
            if value > 0:
                return "low"
            return "unknown"
    level = result.get("level") or (rule.get("defaultConfiguration") or {}).get("level") or ""
    return LEVEL_TO_SEVERITY.get(str(level), "unknown")


def _is_secret(result: dict, rule: dict) -> bool:
    rule_id = str(result.get("ruleId") or "").lower()
    if "secret" in rule_id:
        return True
    tags: list[str] = []
    for source in (rule.get("properties") or {}, result.get("properties") or {}):
        tags.extend(str(tag).lower() for tag in source.get("tags") or [])
    return any(tag == "secret" or tag == "secrets" or "secret" in tag for tag in tags)


def _location(result: dict) -> tuple[str, str]:
    locations = result.get("locations") or []
    if not locations:
        return "unknown", ""
    physical = (locations[0].get("physicalLocation") or {})
    artifact = physical.get("artifactLocation") or {}
    region = physical.get("region") or {}
    uri = _display_path(str(artifact.get("uri") or "unknown"))
    line = region.get("startLine")
    return uri, str(line) if line else ""


def _display_path(uri: str) -> str:
    path = uri.replace("\\", "/")
    if path.startswith("file://"):
        path = path[len("file://") :]
    if path.startswith("/"):
        for marker in ("/site/", "/.github/", "/scripts/", "/edge-proxy/", "/shophouse-proxy/", "/public/", "/docs/"):
            index = path.find(marker)
            if index != -1:
                return path[index + 1 :]
        return path.lstrip("/")
    return path[2:] if path.startswith("./") else path


def _safe_detail(result: dict, rule: dict) -> str:
    title = ((rule.get("shortDescription") or {}).get("text") or "").strip()
    rule_id = str(result.get("ruleId") or "")
    if not title or title == rule_id or title.startswith("Semgrep Finding:"):
        title = ((rule.get("fullDescription") or {}).get("text") or "").strip().splitlines()[0][:180]
    bits = []
    message = ((result.get("message") or {}).get("text") or "")
    parsed = {}
    for raw in message.splitlines():
        if ":" not in raw:
            continue
        key, value = raw.split(":", 1)
        key = key.strip()
        if key in SAFE_MESSAGE_KEYS:
            parsed[key] = value.strip()[:80]
    if parsed.get("Package"):
        bits.append(parsed["Package"])
    if parsed.get("Installed Version"):
        bits.append(f"installed {parsed['Installed Version']}")
    if parsed.get("Fixed Version"):
        bits.append(f"fixed in {parsed['Fixed Version']}")
    detail = title[:180]
    if bits:
        suffix = ", ".join(bits)
        detail = f"{detail} ({suffix})" if detail else suffix
    return detail


def _redact_rule(rule: dict) -> None:
    if not rule:
        return
    generic = {"text": "Secret rule. See the result location and rule id."}
    for key in ("shortDescription", "fullDescription"):
        if key in rule:
            rule[key] = dict(generic)
    if "help" in rule:
        rule["help"] = dict(generic)
    props = rule.get("properties") or {}
    tags = []
    for tag in props.get("tags") or []:
        text = str(tag)
        if len(text) <= 80:
            tags.append(text)
    kept = {}
    if tags:
        kept["tags"] = tags
    if "security-severity" in props:
        kept["security-severity"] = props["security-severity"]
    rule["properties"] = kept


def _redact_result(result: dict) -> None:
    result["message"] = {"text": "Secret finding redacted. Location and rule id only."}
    result.pop("fingerprints", None)
    kept = {}
    for key, value in (result.get("properties") or {}).items():
        if key == "security-severity":
            kept[key] = value
    result["properties"] = kept
    result.pop("codeFlows", None)
    result.pop("stacks", None)
    result.pop("attachments", None)
    result.pop("relatedLocations", None)
    for location in result.get("locations") or []:
        physical = location.get("physicalLocation") or {}
        region = physical.get("region") or {}
        region.pop("snippet", None)
        physical.pop("contextRegion", None)


def _ensure_level(result: dict, severity: str) -> None:
    if result.get("level"):
        return
    result["level"] = {
        "critical": "error",
        "high": "error",
        "medium": "warning",
        "low": "note",
    }.get(severity, "warning")


def _normalize_location(result: dict) -> None:
    for location in result.get("locations") or []:
        physical = location.get("physicalLocation") or {}
        artifact = physical.get("artifactLocation") or {}
        uri = str(artifact.get("uri") or "")
        if artifact.get("uriBaseId") == "%SRCROOT%" and not uri.startswith(("/", "file:")):
            artifact.pop("uriBaseId", None)


def _count_table(counts: dict[str, int]) -> list[str]:
    lines = ["| Severity | Count |", "| --- | ---: |"]
    for name in SEVERITY_ORDER:
        lines.append(f"| {name} | {counts.get(name, 0)} |")
    return lines


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except Exception:
        sys.stdout.write("## Security scan (report only)\n\nSummary step hit an unexpected error and recorded no finding text.\n")
        summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
        if summary_path:
            with open(summary_path, "a", encoding="utf-8") as handle:
                handle.write("## Security scan (report only)\n\nSummary step hit an unexpected error and recorded no finding text.\n")
        sys.exit(0)
