"""Self-contained HTML report generator for Verifily."""

from __future__ import annotations

import html
import json
import webbrowser
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Union

_CSS = """
:root {
    --bg: #0f0f1a;
    --surface: #1a1a2e;
    --card: #16213e;
    --text: #e0e0e0;
    --text-dim: #888;
    --accent: #00d4ff;
    --ship: #00e676;
    --dont-ship: #ff5252;
    --investigate: #ffd740;
    --border: #2a2a4a;
    --error: #ff5252;
    --warning: #ffa726;
    --info: #42a5f5;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
    background: var(--bg); color: var(--text);
    line-height: 1.6; padding: 0;
}
.container { max-width: 960px; margin: 0 auto; padding: 24px; }
header {
    padding: 32px 0; text-align: center;
    border-bottom: 1px solid var(--border); margin-bottom: 24px;
}
header h1 { font-size: 28px; margin-bottom: 8px; }
header .subtitle { color: var(--text-dim); font-size: 14px; }
.decision-ship { border-bottom-color: var(--ship); }
.decision-ship h1 { color: var(--ship); }
.decision-dont_ship { border-bottom-color: var(--dont-ship); }
.decision-dont_ship h1 { color: var(--dont-ship); }
.decision-investigate { border-bottom-color: var(--investigate); }
.decision-investigate h1 { color: var(--investigate); }
.gauges {
    display: flex; justify-content: center; gap: 40px;
    margin: 32px 0; flex-wrap: wrap;
}
.gauge { text-align: center; }
.gauge svg text { font-family: inherit; }
.section {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 20px; margin-bottom: 20px;
}
.section h2 {
    font-size: 16px; color: var(--accent); margin-bottom: 12px;
    text-transform: uppercase; letter-spacing: 1px;
    cursor: pointer; user-select: none;
}
.section h2::after { content: ' \\25BC'; font-size: 10px; opacity: 0.5; }
.section.collapsed h2::after { content: ' \\25B6'; }
.section.collapsed .section-body { display: none; }
table { width: 100%; border-collapse: collapse; }
th {
    text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border);
    color: var(--text-dim); font-size: 12px; text-transform: uppercase;
}
td { padding: 8px 12px; border-bottom: 1px solid var(--border); font-size: 14px; }
.sortable th { cursor: pointer; }
.sortable th:hover { color: var(--accent); }
.badge {
    display: inline-block; padding: 2px 10px; border-radius: 12px;
    font-size: 12px; font-weight: 600;
}
.badge-pass { background: #1b5e20; color: var(--ship); }
.badge-fail { background: #b71c1c; color: var(--dont-ship); }
.badge-warn { background: #e65100; color: var(--investigate); }
.badge-clean { background: #1b5e20; color: var(--ship); }
.issue { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
.issue:last-child { border-bottom: none; }
.issue-icon { display: inline-block; width: 20px; font-weight: bold; }
.issue-error .issue-icon { color: var(--error); }
.issue-warning .issue-icon { color: var(--warning); }
.issue-info .issue-icon { color: var(--info); }
.filter-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.filter-btn { padding: 4px 12px; border-radius: 4px; border: 1px solid var(--border);
              background: transparent; color: var(--text); cursor: pointer; font-size: 12px; }
.filter-btn.active { background: var(--accent); color: var(--bg); border-color: var(--accent); }
.bar-row { display: flex; align-items: center; margin: 4px 0; font-size: 13px; }
.bar-label { width: 120px; color: var(--text-dim); flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; }
.bar-track { flex: 1; height: 16px; background: var(--bg); border-radius: 3px; margin: 0 8px; }
.bar-fill { height: 100%; background: var(--accent); border-radius: 3px; min-width: 2px; }
.bar-value { width: 40px; text-align: right; color: var(--text-dim); flex-shrink: 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; }
.stat-card { background: var(--bg); border-radius: 6px; padding: 12px; text-align: center; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--accent); }
.stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; }
.search-box { width: 100%; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border);
              border-radius: 6px; color: var(--text); font-size: 14px; margin-bottom: 20px;
              outline: none; }
.search-box:focus { border-color: var(--accent); }
.search-box::placeholder { color: var(--text-dim); }
.sample-table { max-height: 400px; overflow-y: auto; }
.sample-table td { max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sample-table td:hover { white-space: normal; overflow: visible; }
.expand-btn { background: transparent; border: 1px solid var(--border); color: var(--accent);
              padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 8px; }
.expand-btn:hover { background: var(--accent); color: var(--bg); }
.hidden { display: none; }
footer {
    text-align: center; padding: 24px 0; color: var(--text-dim);
    font-size: 12px; border-top: 1px solid var(--border); margin-top: 24px;
}
@media (max-width: 600px) {
    .container { padding: 12px; }
    .gauges { gap: 16px; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
"""

_JS = """
document.addEventListener('DOMContentLoaded', function() {
    // --- Collapsible sections ---
    document.querySelectorAll('.section h2').forEach(function(h2) {
        h2.addEventListener('click', function() {
            this.parentElement.classList.toggle('collapsed');
        });
    });

    // --- Sortable tables ---
    document.querySelectorAll('.sortable').forEach(function(table) {
        var headers = table.querySelectorAll('th');
        headers.forEach(function(th, colIdx) {
            th.addEventListener('click', function() {
                var tbody = table.querySelector('tbody') || table;
                var rows = Array.from(tbody.querySelectorAll('tr')).filter(function(r) {
                    return r.querySelector('td');
                });
                var asc = th.dataset.sortDir !== 'asc';
                th.dataset.sortDir = asc ? 'asc' : 'desc';
                // Reset other headers
                headers.forEach(function(h) {
                    h.textContent = h.textContent.replace(/ [\\u25B2\\u25BC]$/, '');
                });
                th.textContent += asc ? ' \\u25B2' : ' \\u25BC';
                rows.sort(function(a, b) {
                    var aVal = a.cells[colIdx] ? a.cells[colIdx].textContent.trim() : '';
                    var bVal = b.cells[colIdx] ? b.cells[colIdx].textContent.trim() : '';
                    var aNum = parseFloat(aVal.replace(/[,%]/g, ''));
                    var bNum = parseFloat(bVal.replace(/[,%]/g, ''));
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return asc ? aNum - bNum : bNum - aNum;
                    }
                    return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                });
                rows.forEach(function(row) { tbody.appendChild(row); });
            });
        });
    });

    // --- Issue severity filters ---
    var filterBar = document.getElementById('issue-filters');
    if (filterBar) {
        filterBar.querySelectorAll('.filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                btn.classList.toggle('active');
                var activeFilters = [];
                filterBar.querySelectorAll('.filter-btn.active').forEach(function(b) {
                    activeFilters.push(b.dataset.severity);
                });
                var issues = btn.closest('.section').querySelectorAll('.issue');
                issues.forEach(function(issue) {
                    if (activeFilters.length === 0) {
                        issue.classList.remove('hidden');
                    } else {
                        var sev = issue.className.match(/issue-(error|warning|info)/);
                        sev = sev ? sev[1] : '';
                        issue.classList.toggle('hidden', activeFilters.indexOf(sev) === -1);
                    }
                });
            });
        });
    }

    // --- Search ---
    var searchBox = document.getElementById('verifily-search');
    if (searchBox) {
        searchBox.addEventListener('input', function() {
            var query = this.value.toLowerCase().trim();
            document.querySelectorAll('.section').forEach(function(section) {
                if (!query) {
                    section.classList.remove('hidden');
                    section.classList.remove('collapsed');
                    return;
                }
                var text = section.textContent.toLowerCase();
                var match = text.indexOf(query) !== -1;
                section.classList.toggle('hidden', !match);
                if (match) section.classList.remove('collapsed');
            });
        });
    }

    // --- Sample rows expand ---
    var expandBtn = document.getElementById('expand-rows-btn');
    if (expandBtn) {
        expandBtn.addEventListener('click', function() {
            document.querySelectorAll('.sample-row-hidden').forEach(function(row) {
                row.classList.remove('hidden');
                row.classList.remove('sample-row-hidden');
            });
            expandBtn.classList.add('hidden');
        });
    }
});
"""


def _esc(value: Any) -> str:
    return html.escape(str(value))


def _svg_gauge(value: float, max_val: float, label: str, color: str) -> str:
    radius = 45
    circ = 2 * 3.14159 * radius
    frac = min(1.0, max(0.0, value / max_val)) if max_val else 0
    offset = circ * (1 - frac)
    return f'''<div class="gauge"><svg width="120" height="140" viewBox="0 0 120 140">
<circle cx="60" cy="60" r="{radius}" fill="none" stroke="#2a2a4a" stroke-width="8"/>
<circle cx="60" cy="60" r="{radius}" fill="none" stroke="{color}" stroke-width="8"
  stroke-dasharray="{circ:.1f}" stroke-dashoffset="{offset:.1f}"
  transform="rotate(-90 60 60)" stroke-linecap="round"/>
<text x="60" y="65" text-anchor="middle" fill="white" font-size="22" font-weight="bold">{int(value)}</text>
<text x="60" y="130" text-anchor="middle" fill="#888" font-size="12">{_esc(label)}</text>
</svg></div>'''


def _score_color(score: int) -> str:
    if score >= 80:
        return "#00e676"
    if score >= 50:
        return "#ffd740"
    return "#ff5252"


def _render_decision(result: Dict[str, Any]) -> str:
    decision = result.get("decision", {})
    if not decision:
        return '<header><h1>Verifily Report</h1></header>'
    rec = decision.get("recommendation", "UNKNOWN")
    css_class = rec.lower().replace(" ", "_")
    confidence = decision.get("confidence", 0)
    exit_code = decision.get("exit_code", "?")
    return f'''<header class="decision-{_esc(css_class)}">
<h1>{_esc(rec)}</h1>
<p class="subtitle">Confidence: {confidence:.0%} | Exit code: {exit_code}</p>
</header>'''


def _render_gauges(result: Dict[str, Any]) -> str:
    parts = []
    report = result.get("report", {})
    q = report.get("quality", {})
    quality_score = q.get("quality_score", 0)
    if quality_score or report:
        parts.append(_svg_gauge(quality_score, 100, "Quality", _score_color(quality_score)))

    risk = result.get("risk_score", {})
    if risk:
        total = risk.get("total", 0)
        c = "#00e676" if total <= 25 else "#ffd740" if total <= 50 else "#ff5252"
        parts.append(_svg_gauge(total, 100, "Risk", c))

    health = result.get("health_index", {})
    if health:
        total = health.get("total", 0)
        c = "#00e676" if total >= 76 else "#ffd740" if total >= 51 else "#ff5252"
        parts.append(_svg_gauge(total, 100, "Health", c))

    if not parts:
        return ""
    return f'<div class="gauges">{"".join(parts)}</div>'


def _render_stats(report: Dict[str, Any]) -> str:
    row_count = report.get("row_count", 0)
    schema = report.get("schema", "unknown")
    pii_clean = report.get("pii_clean", True)
    pii_hits = report.get("pii_total_hits", 0)
    q = report.get("quality", {})
    score = q.get("quality_score", 0)

    pii_badge = '<span class="badge badge-clean">CLEAN</span>' if pii_clean else f'<span class="badge badge-fail">{pii_hits} HITS</span>'

    return f'''<div class="section">
<h2>Dataset Overview</h2>
<div class="section-body"><div class="stats-grid">
<div class="stat-card"><div class="stat-value">{row_count:,}</div><div class="stat-label">Rows</div></div>
<div class="stat-card"><div class="stat-value">{_esc(schema)}</div><div class="stat-label">Schema</div></div>
<div class="stat-card"><div class="stat-value" style="color:{_score_color(score)}">{score}</div><div class="stat-label">Quality</div></div>
<div class="stat-card"><div class="stat-value">{pii_badge}</div><div class="stat-label">PII</div></div>
</div></div></div>'''


def _render_pii(report: Dict[str, Any]) -> str:
    pii_scan = report.get("pii_scan", {})
    hits = {k: v for k, v in pii_scan.items() if isinstance(v, dict) and v.get("count", 0) > 0}
    if not hits:
        return ""
    rows_html = "".join(
        f'<tr><td>{_esc(pii_type)}</td><td>{data["count"]}</td></tr>'
        for pii_type, data in hits.items()
    )
    return f'''<div class="section">
<h2>PII Detections</h2>
<div class="section-body"><table class="sortable"><tr><th>Type</th><th>Count</th></tr>{rows_html}</table></div></div>'''


def _render_issues(report: Dict[str, Any]) -> str:
    q = report.get("quality", {})
    issues = q.get("issues", [])
    if not issues:
        return ""

    # Count by severity
    counts: Dict[str, int] = {"error": 0, "warning": 0, "info": 0}
    items = []
    for issue in issues:
        sev = issue.get("severity", "info")
        counts[sev] = counts.get(sev, 0) + 1
        icon = "X" if sev == "error" else "!" if sev == "warning" else "*"
        desc = issue.get("description", "")
        items.append(f'<div class="issue issue-{_esc(sev)}"><span class="issue-icon">{icon}</span> {_esc(desc)}</div>')

    # Filter buttons
    filter_btns = []
    for sev in ("error", "warning", "info"):
        if counts.get(sev, 0) > 0:
            filter_btns.append(f'<button class="filter-btn active" data-severity="{sev}">{sev.title()} ({counts[sev]})</button>')

    filter_bar = f'<div class="filter-bar" id="issue-filters">{"".join(filter_btns)}</div>' if filter_btns else ""

    return f'''<div class="section"><h2>Quality Issues</h2>
<div class="section-body">{filter_bar}{"".join(items)}</div></div>'''


def _render_contamination(result: Dict[str, Any]) -> str:
    contam = result.get("contamination", {})
    if not contam:
        return ""
    status = contam.get("status", "UNKNOWN")
    badge_cls = "badge-pass" if status == "PASS" else "badge-fail" if status == "FAIL" else "badge-warn"
    exact = contam.get("exact_overlaps", 0)
    near = contam.get("near_duplicates", 0)
    exact_frac = contam.get("exact_overlap_fraction", 0)
    near_frac = contam.get("near_duplicate_fraction", 0)
    return f'''<div class="section">
<h2>Contamination <span class="badge {badge_cls}">{_esc(status)}</span></h2>
<div class="section-body"><table class="sortable"><tr><th>Check</th><th>Count</th><th>Fraction</th></tr>
<tr><td>Exact overlaps</td><td>{exact}</td><td>{exact_frac:.1%}</td></tr>
<tr><td>Near duplicates</td><td>{near}</td><td>{near_frac:.1%}</td></tr>
</table></div></div>'''


def _render_field_stats(report: Dict[str, Any]) -> str:
    field_stats = report.get("field_stats", {})
    if not field_stats:
        return ""
    rows_html = "".join(
        f'<tr><td>{_esc(field)}</td><td>{stats["present"]}</td><td>{stats["empty"]}</td><td>{stats.get("avg_len", 0):.1f}</td></tr>'
        for field, stats in field_stats.items()
    )
    return f'''<div class="section">
<h2>Field Statistics</h2>
<div class="section-body"><table class="sortable"><tr><th>Field</th><th>Present</th><th>Empty</th><th>Avg Length</th></tr>{rows_html}</table></div></div>'''


def _render_tags(report: Dict[str, Any]) -> str:
    tags = report.get("tag_distribution", {})
    if not tags:
        return ""
    sections = []
    for tag_key, dist in tags.items():
        max_val = max(dist.values()) if dist else 1
        bars = "".join(
            f'<div class="bar-row"><span class="bar-label">{_esc(v)}</span>'
            f'<div class="bar-track"><div class="bar-fill" style="width:{c / max_val * 100:.0f}%"></div></div>'
            f'<span class="bar-value">{c}</span></div>'
            for v, c in sorted(dist.items(), key=lambda x: -x[1])
        )
        sections.append(f'<h3 style="color:var(--text-dim);font-size:13px;margin:8px 0 4px">{_esc(tag_key)}</h3>{bars}')
    return f'<div class="section"><h2>Tag Distribution</h2><div class="section-body">{"".join(sections)}</div></div>'


def _render_vocab(report: Dict[str, Any]) -> str:
    q = report.get("quality", {})
    stats = q.get("stats", {})
    ttr = stats.get("type_token_ratio")
    if ttr is None:
        return ""
    unique = stats.get("unique_tokens", 0)
    total = stats.get("total_tokens", 0)
    hapax = stats.get("hapax_ratio", 0)
    return f'''<div class="section">
<h2>Vocabulary</h2>
<div class="section-body"><div class="stats-grid">
<div class="stat-card"><div class="stat-value">{unique:,}</div><div class="stat-label">Unique tokens</div></div>
<div class="stat-card"><div class="stat-value">{total:,}</div><div class="stat-label">Total tokens</div></div>
<div class="stat-card"><div class="stat-value">{ttr:.3f}</div><div class="stat-label">Type-Token Ratio</div></div>
<div class="stat-card"><div class="stat-value">{hapax:.3f}</div><div class="stat-label">Hapax Ratio</div></div>
</div></div></div>'''


def _render_sample_rows(result: Dict[str, Any]) -> str:
    """Render sample rows drill-down from embedded data."""
    report = result.get("report", {})
    sample_rows: List[Dict[str, Any]] = report.get("sample_rows", [])
    if not sample_rows:
        return ""

    visible_count = min(10, len(sample_rows))
    rows_html_parts = []
    for i, row in enumerate(sample_rows):
        inp = _esc(str(row.get("input", row.get("prompt", "")))[:200])
        out = _esc(str(row.get("output", row.get("completion", "")))[:200])
        hidden_cls = ' class="hidden sample-row-hidden"' if i >= visible_count else ""
        rows_html_parts.append(f"<tr{hidden_cls}><td>{i+1}</td><td>{inp}</td><td>{out}</td></tr>")

    expand_btn = ""
    if len(sample_rows) > visible_count:
        expand_btn = f'<button class="expand-btn" id="expand-rows-btn">Show all {len(sample_rows)} rows</button>'

    return f'''<div class="section">
<h2>Sample Rows</h2>
<div class="section-body"><div class="sample-table">
<table class="sortable"><tr><th>#</th><th>Input</th><th>Output</th></tr>
{"".join(rows_html_parts)}</table></div>{expand_btn}</div></div>'''


def generate_html_report(
    result: Dict[str, Any],
    *,
    title: str = "Verifily Report",
    command: str = "",
    version: str = "",
    live_reload: int = 0,
) -> str:
    """Generate a self-contained interactive HTML report string."""
    if not version:
        try:
            from verifily_cli_v1 import __version__
            version = __version__
        except Exception:
            version = "unknown"

    report = result.get("report", {})
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    refresh_tag = f'\n<meta http-equiv="refresh" content="{live_reload}">' if live_reload > 0 else ""

    body_parts = [
        _render_decision(result),
        '<div class="container">',
        '<input type="text" class="search-box" id="verifily-search" placeholder="Search issues, fields, tags...">',
        _render_gauges(result),
        _render_stats(report),
        _render_pii(report),
        _render_issues(report),
        _render_contamination(result),
        _render_field_stats(report),
        _render_tags(report),
        _render_vocab(report),
        _render_sample_rows(result),
        f'''<footer>
<p>Generated by Verifily v{_esc(version)} at {timestamp}</p>
{"<p>Command: <code>" + _esc(command) + "</code></p>" if command else ""}
</footer>''',
        '</div>',
    ]

    data_json = json.dumps(result, indent=2, default=str).replace("<", "\\u003c").replace(">", "\\u003e")

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">{refresh_tag}
<title>{_esc(title)}</title>
<style>{_CSS}</style>
</head>
<body>
{"".join(body_parts)}
<script type="application/json" id="verifily-data">
{data_json}
</script>
<script>{_JS}</script>
</body>
</html>'''


def write_html_report(
    result: Dict[str, Any],
    output_path: Union[str, Path],
    *,
    open_browser: bool = True,
    command: str = "",
    live_reload: int = 0,
) -> Path:
    """Generate and write HTML report, optionally open in browser."""
    html_str = generate_html_report(result, command=command, live_reload=live_reload)
    p = Path(output_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html_str, encoding="utf-8")
    if open_browser:
        webbrowser.open(f"file://{p.resolve()}")
    return p
