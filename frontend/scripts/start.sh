#!/bin/sh
set -e

API_URL="${VITE_API_URL:-${API_URL:-https://dt-server.wonderprotect.net/api}}"
PORT="${PORT:-3000}"

mkdir -p dist
printf 'window.__APP_CONFIG__ = { apiUrl: "%s" };\n' "$API_URL" > dist/config.js

exec npx --yes serve -s dist -l "tcp://0.0.0.0:${PORT}"
