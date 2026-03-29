#!/usr/bin/env bash
set -euo pipefail

API_PORT=$((CONDUCTOR_PORT + 1))

export VITE_API_PORT="$API_PORT"

exec bunx concurrently --raw --kill-others \
  "vite --port $CONDUCTOR_PORT" \
  "wrangler pages dev dist --compatibility-date=2025-03-01 --port $API_PORT"
