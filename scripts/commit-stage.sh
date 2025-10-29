#!/usr/bin/env bash
set -euo pipefail

FEATURE="$1"   # 예: repeat-event
STAGE="$2"     # Architect | QA-RED | Dev-GREEN | Dev-REFACTOR | QA-VERIFY | CEO
ROLE="$3"      # Architect | QA | Dev | CEO
DETAIL="${4:-}" # 선택 상세
RUNLINE="${5:-}" # 선택 실행 로그 (예: "pnpm test, pnpm lint, pnpm build")

case "$STAGE" in
  Architect)    TYPE="docs";    PREFIX="기능 명세";             OUT_FILE=".cursor/outputs/test-design-review.md" ;;
  QA-RED)       TYPE="test";    PREFIX="테스트 설계";           OUT_FILE=".cursor/outputs/test-design-review.md" ;;
  Dev-GREEN)    TYPE="feat";    PREFIX="기능 구현";             OUT_FILE=".cursor/outputs/code-implementation-review.md" ;;
  Dev-REFACTOR) TYPE="refactor";PREFIX="코드 리팩토링";         OUT_FILE=".cursor/outputs/code-implementation-review.md" ;;
  QA-VERIFY)    TYPE="test";    PREFIX="테스트 통과";           OUT_FILE=".cursor/outputs/feature-verification-review.md" ;;
  CEO)          TYPE="chore";   PREFIX="승인 완료";             OUT_FILE=".cursor/outputs/ceo-approval.md" ;;
  *) echo "[commit-stage] unknown STAGE: $STAGE"; exit 1 ;;
 esac

MSG="$TYPE: $PREFIX [by $ROLE] ($FEATURE)"
if [ -n "$DETAIL" ]; then
  MSG="$TYPE: $PREFIX - $DETAIL [by $ROLE] ($FEATURE)"
fi

git add .
git commit -m "$MSG" || true
HASH=$(git rev-parse --short HEAD)
TS=$(date "+%F %T")

if [ -n "$RUNLINE" ]; then
  echo "commit: $HASH | $MSG | $TS | ran: $RUNLINE" >> "$OUT_FILE"
else
  echo "commit: $HASH | $MSG | $TS" >> "$OUT_FILE"
fi

echo "[commit-stage] committed: $HASH -> $MSG (logged to $OUT_FILE)"
