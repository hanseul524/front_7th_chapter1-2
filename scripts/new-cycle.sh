#!/usr/bin/env bash
set -euo pipefail

FEATURE="$1"            # 예: repeat-event
DATE="${2:-$(date +%F)}" # 선택: 날짜 오버라이드

mkdir -p .cursor/outputs

copy_tmpl() {
  local TMPL="$1"
  local OUT="$2"
  sed -e "s/{{FEATURE}}/${FEATURE}/g" \
      -e "s/{{DATE}}/${DATE}/g" \
      -e "s/{{PASS}}/0/g" \
      -e "s/{{WARN}}/0/g" \
      -e "s/{{EVIDENCE}}/TBD/g" \
      -e "s/{{SUMMARY}}/TBD/g" \
      -e "s/{{RUN_STATUS}}/TBD/g" \
      ".cursor/templates/${TMPL}" > "${OUT}"
}

copy_tmpl "test-design-review.tmpl.md" ".cursor/outputs/test-design-review.md"
copy_tmpl "test-code-review.tmpl.md" ".cursor/outputs/test-code-review.md"
copy_tmpl "code-implementation-review.tmpl.md" ".cursor/outputs/code-implementation-review.md"
copy_tmpl "feature-verification-review.tmpl.md" ".cursor/outputs/feature-verification-review.md"
copy_tmpl "ceo-approval.tmpl.md" ".cursor/outputs/ceo-approval.md"

echo "[new-cycle] initialized documents for feature: ${FEATURE} on ${DATE}"
