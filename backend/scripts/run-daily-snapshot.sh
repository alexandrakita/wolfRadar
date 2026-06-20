#!/usr/bin/env bash
# Daily screener + Wolf Rating snapshot for wolfRadar.
# Usage:
#   ./scripts/run-daily-snapshot.sh
#   ./scripts/run-daily-snapshot.sh --force
#
# Cron example (see scripts/crontab.example):
#   0 11 * * 1-5  /Users/you/wolfRadar/backend/scripts/run-daily-snapshot.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOG_DIR="$ROOT/logs"
DATA_DIR="$ROOT/data"
LOCK_DIR="$DATA_DIR/.snapshot.lock"
mkdir -p "$LOG_DIR" "$DATA_DIR"

STAMP="$(date +%Y-%m-%d)"
LOG_FILE="$LOG_DIR/snapshot-${STAMP}.log"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "SKIP — snapshot job already running (lock: $LOCK_DIR)"
  exit 0
fi

cleanup() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

log "=== wolfRadar daily snapshot start ==="
log "Root: $ROOT"

export PATH="/usr/local/bin:/opt/homebrew/bin:${PATH:-}"

if ! command -v node >/dev/null 2>&1; then
  log "ERROR — node not found in PATH"
  exit 1
fi

log "Node: $(node -v)"

ARGS=()
for arg in "$@"; do
  ARGS+=("$arg")
done

set +e
npm run build-snapshot -- "${ARGS[@]}" >>"$LOG_FILE" 2>&1
EXIT=$?
set -e

if [[ $EXIT -eq 0 ]]; then
  log "=== snapshot finished OK ==="
else
  log "=== snapshot FAILED (exit $EXIT) — see $LOG_FILE ==="
fi

exit "$EXIT"
