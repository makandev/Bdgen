#!/usr/bin/env bash
# Funkelpost – Installation der Server-Version mit Docker.
#   ./install.sh          Fragen beantworten, fertig.
#   ./install.sh --neu    Konfiguration (.env) neu anlegen.
# Ohne Rückfragen (z. B. für Automatisierung):
#   FP_PASSWORD=… FP_GEMINI=… FP_OPENROUTER=… FP_DOMAIN=… ./install.sh --ja
set -euo pipefail
cd "$(dirname "$0")"

bold=$'\e[1m'; gold=$'\e[33m'; green=$'\e[32m'; red=$'\e[31m'; off=$'\e[0m'
say()  { printf '%s\n' "${gold}✦${off} $*"; }
ok()   { printf '%s\n' "${green}✔${off} $*"; }
fail() { printf '%s\n' "${red}✘ $*${off}" >&2; exit 1; }

YES=0; NEW=0
for a in "$@"; do
  case "$a" in
    --ja|--yes|-y) YES=1 ;;
    --neu|--new) NEW=1 ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
  esac
done

ask() { # ask "Frage" "Standard" -> Antwort
  local q="$1" def="${2:-}" ans=""
  if [ "$YES" = 1 ]; then printf '%s' "$def"; return; fi
  read -r -p "  $q${def:+ [$def]}: " ans </dev/tty || true
  printf '%s' "${ans:-$def}"
}
ask_secret() {
  local q="$1" ans=""
  if [ "$YES" = 1 ]; then printf ''; return; fi
  read -r -s -p "  $q: " ans </dev/tty || true; printf '\n' >/dev/tty
  printf '%s' "$ans"
}
random_hex() { openssl rand -hex "$1" 2>/dev/null || head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; }
random_pw() { LC_ALL=C tr -dc 'A-HJ-NP-Za-km-z2-9' </dev/urandom 2>/dev/null | head -c 16 || random_hex 8; }
quote() { # single-quoted .env value; single quotes are not allowed inside
  case "$1" in *"'"*) fail "Bitte keine einfachen Anführungszeichen (') in Passwort oder Schlüsseln verwenden." ;; esac
  printf "'%s'" "$1"
}

printf '\n%s\n\n' "${bold}${gold}✦ Funkelpost – Server-Installation${off}"

# 1) Docker
if ! command -v docker >/dev/null 2>&1; then
  say "Docker ist nicht installiert."
  if [ "$YES" = 1 ] || [ "$(ask 'Docker jetzt automatisch installieren? (j/n)' 'j')" = "j" ]; then
    command -v curl >/dev/null 2>&1 || fail "curl fehlt. Bitte zuerst installieren (z. B. sudo apt install curl)."
    curl -fsSL https://get.docker.com | sh || fail "Docker-Installation fehlgeschlagen. Anleitung: https://docs.docker.com/engine/install/"
  else
    fail "Ohne Docker geht es nicht weiter. Anleitung: https://docs.docker.com/engine/install/"
  fi
fi
docker compose version >/dev/null 2>&1 || fail "„docker compose“ fehlt. Bitte Docker aktualisieren (Docker Compose v2)."
DOCKER="docker"
if ! docker info >/dev/null 2>&1; then
  if command -v sudo >/dev/null 2>&1 && sudo docker info >/dev/null 2>&1; then DOCKER="sudo docker"; else fail "Docker läuft nicht oder du hast keine Berechtigung (sudo?)."; fi
fi
ok "Docker gefunden"

# 2) Konfiguration
if [ -f .env ] && [ "$NEW" = 0 ]; then
  ok "Vorhandene Konfiguration (.env) wird verwendet – mit ./install.sh --neu neu anlegen"
else
  [ -f .env ] && cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)" && say "Alte .env gesichert."
  say "Ein paar Fragen – Enter übernimmt den Vorschlag in [Klammern]."
  PW="${FP_PASSWORD:-}"
  if [ -z "$PW" ]; then PW="$(ask_secret 'Passwort für die App (leer = automatisch erzeugen)')"; fi
  GEN_PW=0; if [ -z "$PW" ]; then PW="$(random_pw)"; GEN_PW=1; fi
  [ "${#PW}" -ge 10 ] || say "Hinweis: Ein Passwort mit mindestens 12 Zeichen ist deutlich sicherer."
  GEMINI="${FP_GEMINI:-$(ask_secret 'Google-Gemini-Schlüssel (kostenlos: https://aistudio.google.com/apikey, leer = später)')}"
  OPENROUTER="${FP_OPENROUTER:-$(ask_secret 'OpenRouter-Schlüssel (optional, leer = keiner)')}"
  DOMAIN="${FP_DOMAIN-}"
  if [ -z "${FP_DOMAIN+x}" ]; then DOMAIN="$(ask 'Domain für HTTPS, z. B. karten.meinname.de (leer = nur im Heimnetz per IP)' '')"; fi
  PORT="${FP_PORT:-3000}"

  umask 077
  {
    echo "# Funkelpost – erstellt von install.sh am $(date '+%d.%m.%Y %H:%M')"
    echo "APP_PASSWORD=$(quote "$PW")"
    echo "AUTH_SECRET=$(random_hex 32)"
    echo "GEMINI_API_KEY=$(quote "$GEMINI")"
    echo "OPENROUTER_API_KEY=$(quote "$OPENROUTER")"
    echo "# GEMINI_MODEL=gemini-flash-latest"
    echo "# OPENROUTER_MODEL=openrouter/free"
    echo "PORT=$PORT"
    if [ -n "$DOMAIN" ]; then
      echo "DOMAIN=$DOMAIN"
      echo "COMPOSE_PROFILES=https"
      echo "BIND_ADDRESS=127.0.0.1"
    else
      echo "# Ohne HTTPS (Heimnetz): Login-Cookie auch über http erlauben"
      echo "COOKIE_SECURE=false"
    fi
  } > .env
  ok "Konfiguration gespeichert (.env, nur für dich lesbar)"
  [ "$GEN_PW" = 1 ] && printf '%s\n' "  ${bold}Dein Passwort: ${gold}$PW${off}  ← bitte notieren!"
fi

# 3) Starten
say "Baue und starte Funkelpost … (beim ersten Mal 2–5 Minuten)"
$DOCKER compose up -d --build
PORT="$(grep -E '^PORT=' .env | cut -d= -f2 || true)"; PORT="${PORT:-3000}"
DOMAIN="$(grep -E '^DOMAIN=' .env | cut -d= -f2 || true)"

printf '  Warte auf den Start '
for _ in $(seq 1 60); do
  if $DOCKER compose exec -T funkelpost wget -qO- http://127.0.0.1:3000/api/health/ >/dev/null 2>&1; then printf '\n'; ok "Funkelpost läuft!"; break; fi
  printf '.'; sleep 2
done

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
printf '\n%s\n' "${bold}Fertig! Öffne:${off}"
if [ -n "$DOMAIN" ]; then
  printf '  %s\n' "${gold}https://$DOMAIN${off}  (das HTTPS-Zertifikat kommt beim ersten Aufruf automatisch – die Domain muss auf diesen Server zeigen)"
else
  printf '  %s\n' "${gold}http://${IP:-<server-ip>}:$PORT${off}  (im Heimnetz)"
fi
printf '\n%s\n' "Nützlich: ./update.sh (aktualisieren) · ./backup.sh (Sicherung) · $DOCKER compose logs -f (Protokoll)"
