# ✦ Bdgen – persönliche Überraschungskarten

Bdgen macht aus ein paar Stichpunkten eine animierte, interaktive Überraschungskarte – für Familie,
Freunde, Kolleginnen und Kollegen. Statt fertiger Texte gibst du **Situationen, Gefühle und
Kleinigkeiten** ein; die KI macht daraus eine kleine Geschichte in sieben Seiten:

1. **Begrüßung** – passt sich der Tageszeit an (morgens / tagsüber / abends), mit Live-Uhr
2. **Kurzer Hinweis** – augenzwinkernd
3. **Quiz** – eine „fachliche Prüfung“ mit Sonderregelung
4. **Liste** – „Für heute offiziell gestrichen“, Punkt für Punkt eingeblendet
5. **Der ehrliche Teil** – hier zählen deine Stichpunkte am meisten
6. **Schein-Ende** – „Protokoll erfolgreich abgeschlossen“ …
7. **Finale** – Wunsch, Signatur und ein **Kino-Finale** mit Sternenhimmel

Jede Seite, jede Farbe und jeder Effekt lässt sich einzeln ändern – von Hand oder per Wunsch an die
KI („kürzer“, „witziger“, „erwähne den Urlaub“, „Farben wie Lavendel, mehr Konfetti“).

## Funktionen

- **Kontakte** mit Beziehung, du/Sie, Anlass, Datum, Stimmung und Stichpunkten; „Demnächst“-Hinweis
- **KI-Texte** über **Google Gemini** oder **OpenRouter** (beide mit Gratis-Modellen) – ist ein Anbieter
  ausgelastet, wird automatisch der andere versucht
- **Datenschutz:** Der Name der Person wird **nie** an die KI geschickt – sie arbeitet mit dem Platzhalter
  `{{name}}`, der erst beim Anzeigen ersetzt wird
- **6 Design-Vorlagen** (Gold-Eleganz, Sternennacht, Rosé-Pastell, Bunte Party, Salbei & Natur, Schlicht),
  frei anpassbare Farben/Schrift, Effekt-Regler (Konfetti, Bänder, Lichtpartikel, Tempo …)
- **Live-Vorschau** im iPhone-Rahmen, Rückgängig für KI-Änderungen, automatisches Speichern
- **Teilen per Link** (`/k/…`, ohne Passwort, jederzeit deaktivierbar) oder als **einzelne HTML-Datei**,
  die auch offline und auf dem iPhone funktioniert
- **Ohne KI-Schlüssel** nutzbar: Karten entstehen dann aus der Vorlage, Design-Wünsche werden per
  Stichwort erkannt
- **Passwortschutz** für den gesamten Editor

## Schnellstart

Voraussetzung: **Node.js 22.5 oder neuer** (nutzt das eingebaute SQLite – keine Datenbank nötig).

```bash
npm install
cp .env.example .env      # Passwort und KI-Schlüssel eintragen
npm run build
npm start                 # http://localhost:3000
```

Entwicklung mit Hot-Reload: `npm run dev`

### Umgebungsvariablen (`.env`)

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `APP_PASSWORD` | ja | Passwort für den Editor |
| `AUTH_SECRET` | empfohlen | Zufallswert zum Signieren der Anmeldung (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `GEMINI_API_KEY` | eins von beiden | Kostenloser Schlüssel: https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | nein | Standard: `gemini-flash-latest` |
| `OPENROUTER_API_KEY` | eins von beiden | https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | nein | Standard: `openrouter/free` (wählt automatisch ein Gratis-Modell) |
| `AI_PROVIDER` | nein | `gemini` oder `openrouter` zuerst probieren (Standard: Gemini) |
| `DATABASE_PATH` | nein | Standard: `./data/bdgen.db` |

## Hosting

Die App braucht einen Server mit dauerhaftem Speicher für die SQLite-Datei (z. B. ein kleiner VPS,
Railway, Render, Fly.io mit Volume, ein Raspberry Pi). Mit Docker:

```bash
docker build -t bdgen .
docker run -d -p 3000:3000 --env-file .env -v bdgen-data:/app/data bdgen
```

> Rein serverlose Plattformen (z. B. Vercel) speichern keine Dateien dauerhaft – dafür müsste die
> Datenbankschicht (`src/lib/db.ts`) auf Postgres o. Ä. umgestellt werden.

## Aufbau

```
src/
  app/                 Seiten (Übersicht, Kontakt, Karten-Editor, Login) und API-Routen
  app/k/[slug]/        öffentliche Karten-Links
  components/          Editor-Bausteine (Szenen, Design-Panel, Felder)
  lib/render.ts        Karten-Renderer: erzeugt die komplette, eigenständige HTML-Karte
  lib/templates.ts     Textvorlagen (du/Sie, verschiedene Anlässe)
  lib/presets.ts       Design-Vorlagen und Effekt-Standards
  lib/prompts.ts       KI-Prompts (ganze Karte, einzelne Seite, Design)
  lib/ai.ts            Gemini/OpenRouter-Anbindung mit Fallback
  lib/validate.ts      prüft und begrenzt alle Daten (auch KI-Antworten)
  lib/db.ts            SQLite-Speicher
  proxy.ts             Passwortschutz
```

Texte unterstützen `{{name}}` (Anrede), `**fett**`, `*betont*` und Zeilenumbrüche.

## Tests

```bash
npm test          # Unit-Tests (Renderer, Escaping, Validierung, Themes)
npm run typecheck
```
