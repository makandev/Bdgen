#!/usr/bin/env bash
# Sicherung der Datenbank nach ./backups/ (die letzten 14 bleiben erhalten).
# Wiederherstellen: siehe docs/SERVER.md → „Sicherung zurückspielen“.
set -euo pipefail
cd "$(dirname "$0")"
DOCKER="docker"; docker info >/dev/null 2>&1 || DOCKER="sudo docker"
mkdir -p backups
FILE="backups/funkelpost-$(date +%Y-%m-%d-%H%M).db"
$DOCKER compose exec -T funkelpost node -e "
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
try { fs.unlinkSync('/app/data/.backup.db'); } catch {}
new DatabaseSync(process.env.DATABASE_PATH).exec(\"VACUUM INTO '/app/data/.backup.db'\");
" 2>/dev/null
$DOCKER compose cp funkelpost:/app/data/.backup.db "$FILE" >/dev/null
$DOCKER compose exec -T funkelpost rm -f /app/data/.backup.db
ls -1t backups/funkelpost-*.db 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "✔ Sicherung gespeichert: $FILE"
