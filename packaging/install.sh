#!/usr/bin/env bash
set -euo pipefail

PREFIX="${PREFIX:-/opt/aileun/aileun-agents}"
BIN_DIR="${BIN_DIR:-/usr/local/bin}"
RUNTIME="${AILEUN_AGENTS_RUNTIME:-/srv/aileun/runtime/agents}"

mkdir -p "$RUNTIME"
node "$PREFIX/bin/agentctl.js" init --json
ln -sf "$PREFIX/bin/agentctl.js" "$BIN_DIR/agentctl"

echo "installed agentctl -> $BIN_DIR/agentctl"
echo "runtime: $RUNTIME"
