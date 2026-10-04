# 7 · Server-Version

Installation für Einsteiger: [`../SERVER.md`](../SERVER.md). Hier die Technik.

## Ablauf einer Anfrage

1. **`src/proxy.server.ts`** (Next.js „proxy“, früher Middleware): öffentlich sind nur `/login/`,
   `/api/login/`, `/api/health/`, `/api/react/<slug>/`, `/k/…` und Icons/Manifest. Alles andere braucht
   ein gültiges Session-Cookie, sonst Weiterleitung zu `/login/?next=…` bzw. 401 bei `/api/`.
2. Die Route arbeitet mit `src/server/db.ts` und den Helfern in `src/server/http.ts`
   (`json`, `fail`, `body`, `handle` – fängt Fehler ab und gibt deutsche Meldungen zurück).

## API (alle unter `/api/`, Endung `/`)

| Route | Methoden | Zweck |
|---|---|---|
| `login`, `logout` | POST | Anmelden (Limits!), Abmelden |
| `status` | GET | welche KI-Anbieter eingerichtet sind |
| `health` | GET | öffentlich, für Docker-Healthcheck |
| `contacts`, `contacts/[id]` | GET, POST / GET, PUT, DELETE | Personen |
| `cards`, `cards/[id]` | POST / GET, PUT, DELETE | Karten (POST erstellt mit KI/Vorlage) |
| `cards/[id]/generate` | POST | alle Texte neu (nimmt das aktuelle Geschenk mit) |
| `cards/[id]/reactions` | GET | Reaktionen einer Karte |
| `ai/scene`, `ai/style`, `ai/test` | POST | eine Seite neu, Design per Wunsch, KI testen |
| `ratings` | GET, POST, DELETE | Bewertungen fürs Lernen |
| `reactions` | GET | neueste Reaktionen (Übersicht) |
| `backup` | GET, POST | Sicherung herunterladen/einspielen |
| `react/[slug]` | POST | **öffentlich**: Reaktion der beschenkten Person |

Empfänger-Seite: `GET /k/<slug>/` (`src/app/k/[slug]/route.server.ts`) – rendert die Karte mit
`reactUrl`; ist der Link abgeschaltet, gibt es 404.

## Umgebungsvariablen

Siehe `.env.example` (und `docker-compose.yml` für `PORT`, `BIND_ADDRESS`, `DOMAIN`): `APP_PASSWORD` (Pflicht), `AUTH_SECRET` (Pflicht, mind. 32 Zeichen; `update.sh` ergänzt es), `GEMINI_API_KEY` /
`OPENROUTER_API_KEY`, `GEMINI_MODEL`, `OPENROUTER_MODEL`, `AI_PROVIDER`, `OPENROUTER_BASE_URL`,
`DATABASE_PATH`, `COOKIE_SECURE`.

## Betrieb

- `Dockerfile`, `docker-compose.yml` (optional mit Caddy für HTTPS, Profil `https`),
  `deploy/Caddyfile`, `deploy/funkelpost.service` (ohne Docker).
- `install.sh` (fragt alles ab, erzeugt `.env` mit zufälligem `AUTH_SECRET`), `update.sh`, `backup.sh`
  (`VACUUM INTO`).
