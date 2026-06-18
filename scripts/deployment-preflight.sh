#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

status=0

fail() {
  printf 'FAIL: %s\n' "$1"
  status=1
}

warn() {
  printf 'WARN: %s\n' "$1"
}

ok() {
  printf 'OK: %s\n' "$1"
}

check_file() {
  local path="$1"
  if [[ -f "$path" ]]; then ok "$path exists"; else fail "$path is missing"; fi
}

check_dir() {
  local path="$1"
  if [[ -d "$path" ]]; then ok "$path exists"; else fail "$path is missing"; fi
}

ts_projects=(
  'resources/[Scripts]/fw-hud/project'
  'resources/[Scripts]/fw-books/project'
  'resources/[Scripts]/fw-arcade/project'
  'resources/[Scripts]/fw-polaroid/project'
  'resources/[Scripts]/fw-racing/project'
  'resources/[Scripts]/fw-sync/project'
  'resources/[Scripts]/fw-config/project'
  'resources/[Scripts]/fw-boosting/project'
  'resources/[Scripts]/fw-businesses/project'
  'resources/[Scripts]/fw-medical/project'
  'resources/[Scripts]/fw-prison/project'
)

web_projects=(
  'resources/[Scripts]/fw-ui/web'
  'resources/[Scripts]/fw-emotes/web'
  'resources/[Scripts]/fw-mdw/web'
  'resources/[Scripts]/fw-phone/web'
  'resources/[Scripts]/fw-laptop/web'
)

for project in "${ts_projects[@]}"; do
  check_file "$project/package-lock.json"
  check_file "$project/dist/client.js"
  check_file "$project/dist/server.js"
  [[ -d "$project/node_modules" ]] || warn "$project/node_modules is not installed; run npm install before building"
done

check_file 'resources/[Scripts]/fw-ui/web/dist/index.html'
for project in "${web_projects[@]}"; do
  check_file "$project/package-lock.json"
  [[ -d "$project/node_modules" ]] || warn "$project/node_modules is not installed; run npm install before building"
done

check_file private.cfg
check_file database.sql

if [[ -f private.cfg ]]; then
  if grep -Eq 'sv_licenseKey[[:space:]]+""' private.cfg; then
    fail 'private.cfg contains an empty sv_licenseKey'
  else
    ok 'private.cfg does not contain an empty sv_licenseKey'
  fi
else
  warn 'copy private.example.cfg to private.cfg and fill in real secrets before deployment'
fi

if [[ -f resources.cfg ]]; then
  assets_line=$(awk '/^[[:space:]]*ensure[[:space:]]+fw-assets([[:space:]]|$)/ { print NR; exit }' resources.cfg)
  hud_line=$(awk '/^[[:space:]]*ensure[[:space:]]+fw-hud([[:space:]]|$)/ { print NR; exit }' resources.cfg)
  if [[ -n "${assets_line:-}" && -n "${hud_line:-}" && "$assets_line" -lt "$hud_line" ]]; then
    ok 'fw-assets is ensured before dependent script resources'
  else
    fail 'fw-assets must be ensured before resources that import @fw-assets files'
  fi
fi

exit "$status"
