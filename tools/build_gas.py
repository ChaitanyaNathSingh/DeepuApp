#!/usr/bin/env python3
"""Inline CSS/JS into gas/Index.html for Apps Script copy-paste deploy."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "assets" / "styles.css").read_text(encoding="utf-8")
js = (root / "assets" / "app.js").read_text(encoding="utf-8")

html = html.replace(
    '<link rel="stylesheet" href="assets/styles.css" />',
    "<style>\n" + css + "\n</style>",
)
html = html.replace(
    '<script src="assets/app.js"></script>',
    "<script>\n" + js + "\n</script>",
)
# Apps Script HtmlService already wraps a document; keep full HTML anyway.
out = root / "gas" / "Index.html"
out.write_text(html, encoding="utf-8")
print(f"Wrote {out} ({out.stat().st_size} bytes)")
