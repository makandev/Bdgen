#!/usr/bin/env bash
# Funkelpost aktualisieren: neueste Version holen und neu starten. Daten bleiben erhalten.
set -euo pipefail
cd "$(dirname "$0")"
DOCKER="docker"; docker info >/dev/null 2>&1 || DOCKER="sudo docker"
./backup.sh || echo "Hinweis: Sicherung vor dem Update fehlgeschlagen – weiter geht's trotzdem."
git pull --ff-only
$DOCKER compose up -d --build
$DOCKER image prune -f >/dev/null
echo "✔ Funkelpost ist aktuell."
