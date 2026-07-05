#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  fetch-irdai-updates.sh
#  Fetch the latest IRDAI health-insurance regulatory updates using the Gemini
#  API with Google Search grounding — the legitimate equivalent of "Google AI
#  mode" (Google's AI answering, grounded in live Google Search). Prints a JSON
#  envelope to stdout: {ok, model, generatedAt, text, sources[]}.
#
#  Standalone use:
#     GEMINI_API_KEY=xxxx ./scripts/fetch-irdai-updates.sh
#  The SecureShield admin button runs this same script via the API.
#
#  Requires: curl, jq, and a Gemini API key (GEMINI_API_KEY or GOOGLE_API_KEY).
#  Results are AI-generated — VERIFY against irdai.gov.in before relying on them.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

emit_err() { printf '%s' "{\"ok\":false,\"error\":$(printf '%s' "$1" | jq -Rs . 2>/dev/null || printf '"%s"' "$1")}"; }

command -v curl >/dev/null 2>&1 || { echo '{"ok":false,"error":"curl is not installed."}'; exit 0; }
command -v jq   >/dev/null 2>&1 || { echo '{"ok":false,"error":"jq is not installed (sudo apt install jq)."}'; exit 0; }

KEY="${GEMINI_API_KEY:-${GOOGLE_API_KEY:-}}"
MODEL="${GEMINI_MODEL:-gemini-2.0-flash}"
if [ -z "$KEY" ]; then
  emit_err "No Gemini API key. Export GEMINI_API_KEY, or configure it in ai_key_configs (Admin → API Keys)."
  exit 0
fi

TODAY="$(date -u +%Y-%m-%d)"
PROMPT="You are a compliance research assistant for Indian health insurance. Using current web information, summarise the CURRENT IRDAI (Insurance Regulatory and Development Authority of India) health-insurance regulations and any changes within the last 12 months as of ${TODAY}. For each item give: the rule/title, a one-line plain-English summary, the effective date if known, and the official source or circular reference. Cover at least: the moratorium period; pre-existing disease and specific-disease waiting periods; room-rent, sub-limit and co-pay disclosure rules; cashless authorisation timelines; and any 2025-2026 changes (e.g. GST on premiums, Bima-ASBA, entry-age rules). Be concise, use short bullet points, and cite sources. If something is uncertain, say so explicitly."

REQ=$(jq -n --arg p "$PROMPT" '{contents:[{parts:[{text:$p}]}], tools:[{google_search:{}}]}')

RESP=$(curl -sS -m 60 -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}" \
  -H 'Content-Type: application/json' \
  -d "$REQ") || { emit_err "Request to Gemini failed (network or timeout)."; exit 0; }

TEXT=$(printf '%s' "$RESP" | jq -r '[.candidates[0].content.parts[]?.text] | join("\n")' 2>/dev/null || echo "")
SOURCES=$(printf '%s' "$RESP" | jq -c '[.candidates[0].groundingMetadata.groundingChunks[]?.web | {title:.title, uri:.uri}]' 2>/dev/null || echo "[]")

if [ -z "$TEXT" ] || [ "$TEXT" = "null" ]; then
  ERR=$(printf '%s' "$RESP" | jq -r '.error.message // "Empty response from model."' 2>/dev/null || echo "Empty response from model.")
  emit_err "$ERR"
  exit 0
fi

jq -n --arg model "$MODEL" --arg text "$TEXT" --arg at "$(date -u +%FT%TZ)" --argjson sources "$SOURCES" \
  '{ok:true, mode:"ai", model:$model, generatedAt:$at, text:$text, sources:$sources}'
