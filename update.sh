#!/usr/bin/env bash
# Funkelpost aktualisieren: neueste Version holen und neu starten. Daten bleiben erhalten.
set -euo pipefail
cd "$(dirname "$0")"
DOCKER="docker"; docker info >/dev/null 2>&1 || DOCKER="sudo docker"
./backup.sh || echo "Hinweis: Sicherung vor dem Update fehlgeschlagen – weiter geht's trotzdem."
git pull --ff-only
# Since the security update AUTH_SECRET is required – add one if it is missing or too short.
if [ -f .env ] && ! grep -qE '^AUTH_SECRET=.{32,}' .env; then
  sed -i '/^AUTH_SECRET=/d' .env
  echo "AUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')" >> .env
  echo "Hinweis: AUTH_SECRET wurde ergänzt – alle Geräte müssen sich einmal neu anmelden."
fi
$DOCKER compose up -d --build
$DOCKER image prune -f >/dev/null
echo "✔ Funkelpost ist aktuell."
