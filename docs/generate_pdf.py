#!/usr/bin/env python3
"""
Generate Project_Report.pdf from Project_Report.md
Structure:
  Page 1  — Cover  (logo + title)
  Page 2  — Index
  Page 3  — 1. Title Page
  Page 4  — 2. Executive Summary
  ... each ## heading starts on its own page
"""

import base64, os, re, shutil, subprocess, sys, tempfile
import markdown as md_lib

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MD_PATH    = os.path.join(SCRIPT_DIR, "Project_Report.md")
HTML_PATH  = os.path.join(SCRIPT_DIR, "Project_Report.html")
PDF_PATH   = os.path.join(SCRIPT_DIR, "Project_Report.pdf")

# ─────────────────────────────────────────────────────────────
# 1. Read markdown
# ─────────────────────────────────────────────────────────────
with open(MD_PATH, encoding="utf-8") as f:
    md_text = f.read()

# ─────────────────────────────────────────────────────────────
# 2. Embed all images as base64 so HTML is self-contained
#    Handles both `src="..."` attributes in HTML-in-markdown
# ─────────────────────────────────────────────────────────────
def embed_src(match):
    src = match.group(1)
    abs_path = os.path.join(SCRIPT_DIR, src)
    if not os.path.exists(abs_path):
        # try resolving from repo root
        abs_path = os.path.join(SCRIPT_DIR, "..", src)
    if not os.path.exists(abs_path):
        return match.group(0)
    with open(abs_path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    ext  = os.path.splitext(src)[1].lower().lstrip(".")
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "gif": "image/gif", "svg": "image/svg+xml"}.get(ext, "image/png")
    return f'src="data:{mime};base64,{data}"'

md_embedded = re.sub(r'src="([^"]+)"', embed_src, md_text)

# ─────────────────────────────────────────────────────────────
# 3. Split out the cover block (logo + h1) from the rest
#    The markdown starts with:
#      <p align="center"><img …/></p>
#      <h1 align="center">…</h1>
#      ---
#      ## Index
#    We want that block on the cover page (no page-break before it)
#    and every subsequent ## section to start a new page.
# ─────────────────────────────────────────────────────────────
# Convert the full markdown → HTML body
extensions = ["tables", "fenced_code", "attr_list", "md_in_html"]
body_html = md_lib.markdown(md_embedded, extensions=extensions)

# Inject page-break-before on every h2 EXCEPT the very first one
# (Index is the first h2 — it should break away from the cover, which is fine)
# Actually we want ALL h2s to break — cover ends at the <hr> before ## Index
first_h2 = True
def add_page_break(m):
    global first_h2
    tag   = m.group(0)
    # Don't add break before the very first h2 (Index comes right after cover)
    # Actually user wants Index on its own page too — so break ALL h2
    return f'<h2 class="page-start">{tag[4:]}'  # replace <h2> with classed version

body_html = re.sub(r'<h2>', lambda m: '<h2 class="page-start">', body_html)

# ─────────────────────────────────────────────────────────────
# 4. CSS — clean, professional, print-ready
# ─────────────────────────────────────────────────────────────
CSS = """
/* ── System fonts only (no network requests in headless) ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --text:    #1a1a2e;
  --muted:   #4a4a6a;
  --accent:  #4a6cf7;
  --border:  #dee2e6;
  --bg:      #ffffff;
  --code-bg: #f4f6fb;
  --stripe:  #f0f4ff;
}

@page {
  size: A4;
  margin: 22mm 20mm 22mm 20mm;
}

body {
  font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.8;
  color: var(--text);
  background: var(--bg);
  max-width: 100%;
}

/* ── Cover page ── */
.cover {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240mm;
  text-align: center;
  page-break-after: always;
  break-after: page;
}

.cover img {
  width: 200px;
  height: auto;
  margin-bottom: 24pt;
  border-radius: 0;
}

.cover h1 {
  font-size: 26pt;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  letter-spacing: -0.5px;
  margin-bottom: 10pt;
}

.cover .subtitle {
  font-size: 13pt;
  color: var(--muted);
  margin-top: 8pt;
}

/* ── Page-break before every major section ── */
h2.page-start {
  page-break-before: always;
  break-before: page;
  font-size: 17pt;
  font-weight: 700;
  color: var(--text);
  border-bottom: 2.5px solid var(--accent);
  padding-bottom: 5pt;
  padding-top: 6pt;
  margin-bottom: 12pt;
}

h3 {
  font-size: 13pt;
  font-weight: 600;
  color: #2c3e50;
  margin-top: 18pt;
  margin-bottom: 8pt;
  page-break-after: avoid;
  break-after: avoid;
}

h4 {
  font-size: 11.5pt;
  font-weight: 600;
  color: var(--accent);
  margin-top: 12pt;
  margin-bottom: 5pt;
  page-break-after: avoid;
  break-after: avoid;
}

/* ── Paragraphs & lists ── */
p { margin: 0 0 9pt; }

ul, ol {
  padding-left: 22pt;
  margin: 0 0 9pt;
}
li { margin-bottom: 4pt; }

/* ── Tables ── */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
  margin: 12pt 0 18pt;
  page-break-inside: avoid;
  break-inside: avoid;
}

thead tr {
  background: var(--accent);
  color: #fff;
}
thead th {
  padding: 7pt 9pt;
  text-align: left;
  font-weight: 600;
  font-size: 10pt;
}
tbody tr:nth-child(even) { background: var(--stripe); }
tbody tr:nth-child(odd)  { background: var(--bg); }
tbody td {
  padding: 6pt 9pt;
  border: 1px solid var(--border);
  vertical-align: top;
}

/* ── Code ── */
pre {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 11pt;
  font-family: 'Courier New', Courier, monospace;
  font-size: 8.5pt;
  line-height: 1.55;
  page-break-inside: avoid;
  break-inside: avoid;
  margin: 8pt 0 14pt;
}
code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 9.5pt;
  background: #eef0fb;
  padding: 1.5pt 4pt;
  border-radius: 3px;
}
pre code { background: none; padding: 0; font-size: inherit; }

/* ── Horizontal rule ── */
hr {
  border: none;
  border-top: 1.5px solid var(--border);
  margin: 14pt 0;
}

/* ── Images: must fit on one page, never split ── */
img {
  display: block;
  max-width: 100%;
  max-height: 190mm;        /* fits inside A4 with margins */
  width: auto;
  height: auto;
  object-fit: contain;
  margin: 14pt auto 18pt;
  border-radius: 6px;
  page-break-inside: avoid;
  break-inside: avoid;
  page-break-before: avoid;
  break-before: avoid;
}

/* Wrap images in avoid-break container */
p:has(img) {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* ── Links ── */
a { color: var(--accent); text-decoration: none; }

/* ── Blockquote ── */
blockquote {
  border-left: 3px solid var(--accent);
  margin: 9pt 0;
  padding: 5pt 14pt;
  color: var(--muted);
  background: var(--stripe);
  border-radius: 0 6px 6px 0;
  page-break-inside: avoid;
  break-inside: avoid;
}
"""

# ─────────────────────────────────────────────────────────────
# 5. Extract the cover elements from the body HTML
#    (the <p align=center><img/></p> and <h1 align=center>…</h1>)
#    and wrap them in a .cover div; replace remaining body
# ─────────────────────────────────────────────────────────────
# The markdown starts with an HTML <p> image block then an <h1>
# After markdown conversion they appear first in body_html

# Find the logo img paragraph
logo_match = re.match(
    r'\s*(<p[^>]*>\s*<img[^>]*/?>\s*</p>)\s*',
    body_html, re.DOTALL | re.IGNORECASE
)

# Find the h1 title
h1_match = re.search(r'<h1[^>]*>.*?</h1>', body_html, re.DOTALL | re.IGNORECASE)

if logo_match and h1_match:
    logo_html  = logo_match.group(1)
    h1_html    = h1_match.group(0)
    # Remove these from body (they'll go into the .cover div instead)
    body_rest  = body_html[logo_match.end():]
    body_rest  = body_rest.replace(h1_html, '', 1).strip()
    # Strip any leading <hr> elements — the markdown has a "---" divider
    # between the title and the Index section; after the cover gets its own
    # page-break, that orphaned <hr> creates a blank second page.
    body_rest  = re.sub(r'^\s*(<hr\s*/?>\s*)+', '', body_rest, flags=re.IGNORECASE)

    cover_html = f"""
<div class="cover">
  {logo_html}
  {h1_html}
  <p class="subtitle">Vicharanashala Internship Programme (VINS) · IIT Ropar · Team CS29</p>
</div>
"""
    final_body = cover_html + "\n" + body_rest
else:
    # Fallback: use body as-is
    final_body = body_html

# ─────────────────────────────────────────────────────────────
# 6. Write HTML
# ─────────────────────────────────────────────────────────────
html_full = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Crowd Sourcing FAQ Project Report — Team CS29</title>
  <style>{CSS}</style>
</head>
<body>
{final_body}
</body>
</html>"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_full)
print(f"✓  HTML written → {HTML_PATH}")

# ─────────────────────────────────────────────────────────────
# 7. Chrome headless → PDF
# ─────────────────────────────────────────────────────────────
CHROME_CANDIDATES = [
    "/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
]
chrome = next((c for c in CHROME_CANDIDATES if os.path.exists(c)), None)
if not chrome:
    print("✗  No Chrome binary found. HTML saved; convert manually.")
    sys.exit(0)

import time as _time

print(f"Using: {chrome}")
tmp_profile = tempfile.mkdtemp(prefix="chrome_pdf_")
try:
    # Use Popen so we can poll for the PDF file rather than waiting for
    # Chrome to exit (Chrome on macOS headless often never exits cleanly).
    proc = subprocess.Popen([
        chrome,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        f"--user-data-dir={tmp_profile}",
        f"--print-to-pdf={PDF_PATH}",
        "--no-pdf-header-footer",
        f"file://{HTML_PATH}",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Poll until the PDF appears and stops growing, or timeout at 60s
    deadline = _time.time() + 60
    last_size = -1
    stable_count = 0
    while _time.time() < deadline:
        _time.sleep(1)
        if os.path.exists(PDF_PATH):
            cur_size = os.path.getsize(PDF_PATH)
            if cur_size > 10_000 and cur_size == last_size:
                stable_count += 1
                if stable_count >= 2:   # size stable for 2 s → done
                    break
            else:
                stable_count = 0
            last_size = cur_size
    proc.kill()
    proc.wait()
finally:
    shutil.rmtree(tmp_profile, ignore_errors=True)

if os.path.exists(PDF_PATH) and os.path.getsize(PDF_PATH) > 10_000:
    size = os.path.getsize(PDF_PATH)
    print(f"✓  PDF written  → {PDF_PATH}  ({size // 1024} KB)")
else:
    print("✗  Chrome failed or produced an empty file")
    sys.exit(1)
