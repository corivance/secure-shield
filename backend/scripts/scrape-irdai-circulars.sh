#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  scrape-irdai-circulars.sh
#  NO API KEY NEEDED. Fetches the latest circulars directly from IRDAI's own
#  public site (irdai.gov.in/circulars) — the authoritative source — and prints
#  a JSON envelope: {ok, mode:"scrape", source, fetchedAt, items:[{title,url,health}]}.
#
#  This scrapes the regulator's own published list (server-rendered HTML), which
#  is legitimate — unlike scraping Google. Results are titles + official PDF
#  links for a human to review; nothing is auto-applied.
#
#  Requires: curl, python3.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

URL="${IRDAI_CIRCULARS_URL:-https://irdai.gov.in/circulars}"

command -v curl    >/dev/null 2>&1 || { echo '{"ok":false,"error":"curl is not installed."}'; exit 0; }
command -v python3 >/dev/null 2>&1 || { echo '{"ok":false,"error":"python3 is required for parsing."}'; exit 0; }

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

if ! curl -sS -m 30 -A "Mozilla/5.0 (SecureShield compliance reviewer)" -o "$TMP" "$URL" 2>/dev/null; then
  echo '{"ok":false,"error":"Could not reach irdai.gov.in (network/blocked)."}'
  exit 0
fi

python3 - "$TMP" "$URL" <<'PYEOF'
import sys, re, json, urllib.parse, datetime

html = open(sys.argv[1], encoding='utf-8', errors='ignore').read()
src = sys.argv[2]

HEALTH = re.compile(r'health|mediclaim|hospital|cashless|pre-?existing|\bped\b|moratorium|\btpa\b|ayush|wellness|senior\s*citizen', re.I)

# Capture the FULL href (including the /{uuid}?query suffix) so the link resolves;
# the title is taken from the ".pdf" path segment.
links = re.findall(r'href="(https://irdai\.gov\.in/documents/[^"]+?\.pdf[^"]*)"', html, re.I)
seen, items = set(), []
for url in links:
    path = urllib.parse.urlparse(url).path
    m = re.search(r'/([^/]+\.pdf)(?:/|$)', path)
    fn = m.group(1) if m else path.split('/')[-1]
    title = urllib.parse.unquote(fn[:-4].replace('+', ' ')).strip()
    # Bilingual filenames are "Hindi _ English"; keep the English part.
    if ' _ ' in title:
        eng = [p.strip() for p in title.split(' _ ') if re.search(r'[A-Za-z]', p)]
        if eng:
            title = eng[-1]
    title = re.sub(r'\s+', ' ', title).strip(' _-')
    key = url.split('?')[0]
    if not title or len(title) < 6 or key in seen:
        continue
    seen.add(key)
    items.append({"title": title[:160], "url": url, "health": bool(HEALTH.search(title))})

# Surface health-relevant circulars first, keep a sane cap.
items.sort(key=lambda x: (not x["health"],))
items = items[:25]

print(json.dumps({
    "ok": True,
    "mode": "scrape",
    "source": src,
    "fetchedAt": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    "items": items,
}))
PYEOF
