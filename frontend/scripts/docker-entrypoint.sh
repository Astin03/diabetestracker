#!/bin/sh
set -e

API_URL="${VITE_API_URL:-${API_URL:-https://dt-server.wonderprotect.net/api}}"

printf 'window.__APP_CONFIG__ = { apiUrl: "%s" };\n' "$API_URL" > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
