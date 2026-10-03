# ✦ Funkelpost – persönliche Überraschungen, mit KI gezaubert

Funkelpost macht aus ein paar Stichworten eine animierte, interaktive Überraschungskarte – für Familie,
Freunde, Kolleginnen und Kollegen. Statt fertiger Texte gibst du **Situationen, Gefühle und
Kleinigkeiten** ein; die KI macht daraus eine kleine Geschichte in sieben Seiten:

1. **Begrüßung** – passt sich der Tageszeit an, mit Live-Uhr
2. **Kurzer Hinweis** – augenzwinkernd
3. **Quiz** – eine „fachliche Prüfung“ mit Sonderregelung
4. **Liste** – „Für heute offiziell gestrichen“
5. **Der ehrliche Teil** – hier zählen deine Stichworte am meisten
6. **Schein-Ende** – „Protokoll erfolgreich abgeschlossen“ …
7. **Finale** – Wunsch, Signatur und ein **Kino-Finale**

**12 Designs:** Gold-Eleganz · Schwarz & Gold · Rosé-Gold · Holo-Glanz · Sternennacht · Matrix (mit Zeichenregen) ·
Block-Welt (Roblox-Stil) · Neon-Party · Rosé-Pastell · Bunte Party · Salbei & Natur · Schlicht – dazu fünf Kartenstile,
fünf Hintergrund-Effekte und Konfetti als Streifen, Herzen, Sterne, Quadrate oder Zeichen. Alles per KI-Wunsch
änderbar („wie in einem Videospiel“, „schwarz-gold und luxuriös“) – selbst schreiben ist optional.

In der App: **👀 Beispiele** (zwölf fertige Karten zum Anschauen) und **ℹ️ Infos** (Neuigkeiten, Pläne, KI-Leitfaden).

## Zwei Versionen – eine Codebasis

| | **Browser-Version** (GitHub Pages) | **Server-Version** (eigener Server) |
|---|---|---|
| Daten | im Browser des jeweiligen Geräts | zentral in SQLite – auf jedem Gerät dieselben Personen & Karten |
| KI-Schlüssel | im verschlüsselten Zugang (Passwort) | nur auf dem Server, nie im Browser |
| Passwort | entschlüsselt den Zugang | Login mit Session-Cookie (30 Tage), Schutz gegen Durchprobieren |
| Link teilen | Karte steckt im Link (`/k/#…`) | kurzer Link `/k/abc123/` – abschaltbar, Änderungen sofort sichtbar |
| Bauen | `npm run build` (automatisch per GitHub Actions) | `npm run build:server` bzw. Docker |

Oberfläche, Karten, Vorlagen und KI-Prompts sind identisch. Eine Sicherung aus der Browser-Version
lässt sich in die Server-Version einspielen (⚙ Einstellungen → Sicherung).

## Server-Version installieren

```bash
git clone https://github.com/makandev/Bdgen.git funkelpost && cd funkelpost
./install.sh
```

Das Skript installiert bei Bedarf Docker, fragt Passwort, KI-Schlüssel und (optional) eine Domain ab,
richtet bei Domain automatisch HTTPS ein und startet alles. Danach: `./update.sh` zum Aktualisieren,
`./backup.sh` für Sicherungen. **Ausführliche Anleitung für Einsteiger: [docs/SERVER.md](docs/SERVER.md)**
(inkl. Heimnetz, Raspberry Pi, ohne Docker, Fehlerbehebung).

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `APP_PASSWORD` | ja | Passwort für die App |
| `AUTH_SECRET` | empfohlen | Zufallswert zum Signieren der Anmeldung |
| `GEMINI_API_KEY` / `OPENROUTER_API_KEY` | mind. einer | KI-Schlüssel |
| `GEMINI_MODEL`, `OPENROUTER_MODEL`, `AI_PROVIDER` | nein | Modellwahl / Reihenfolge |
| `DATABASE_PATH` | nein | Standard `./data/funkelpost.db` |
| `COOKIE_SECURE` | nein | `false`, wenn ohne HTTPS (Heimnetz) betrieben |
| `NEXT_PUBLIC_BASE_PATH` | nein | falls unter einem Unterpfad betrieben (beim Bauen setzen) |

## Browser-Version: so funktioniert’s

| | |
|---|---|
| **Speicher** | Personen und Karten liegen nur im Browser des jeweiligen Geräts. Unter ⚙ Einstellungen gibt es eine Sicherung zum Herunterladen/Einspielen (auch zum Übertragen auf ein anderes Gerät). |
| **Teilen** | Die ganze Karte steckt im Link (hinter dem `#`) – sie wird nirgends hochgeladen. Empfänger brauchen kein Passwort. Alternativ: Karte als einzelne HTML-Datei, die offline funktioniert. |
| **KI** | Google Gemini oder OpenRouter (beide mit Gratis-Modellen). Ist einer ausgelastet, wird automatisch der andere versucht. Ohne KI entstehen Karten aus Vorlagen. |
| **Datenschutz** | Der Name der Person wird **nie** an die KI geschickt – sie arbeitet mit dem Platzhalter `{{name}}`. |
| **Sicherheit** | Geteilte Karten laufen in einer abgeschotteten Umgebung (Sandbox) und können nicht auf gespeicherte Daten oder Schlüssel zugreifen. Alle Inhalte aus Links werden geprüft und bereinigt. |

## Browser-Version: Passwortsperre & KI für die ganze Familie (einmalig einrichten)

Die KI-Schlüssel werden beim Veröffentlichen **mit deinem Passwort verschlüsselt** (AES-256, PBKDF2 mit
600 000 Runden) und als `zugang.json` mit ausgeliefert. Wer das Passwort kennt, kann die App auf jedem
Gerät mit KI nutzen – ohne selbst Schlüssel einzutragen. Ohne Passwort ist die Datei nutzlos.

1. Auf GitHub im Repository: **Settings → Secrets and variables → Actions → New repository secret**
2. Diese Secrets anlegen:
   - `BDGEN_PASSWORD` – das Familien-Passwort (**mindestens 12 Zeichen**, kein einfaches Wort)
   - `GEMINI_API_KEY` – kostenlos unter https://aistudio.google.com/apikey
   - `OPENROUTER_API_KEY` – optional, https://openrouter.ai/keys
3. **Actions → „Veröffentlichen (GitHub Pages)“ → Run workflow** (oder einfach den nächsten Push abwarten)

Danach fragt die App beim Öffnen nach dem Passwort; ein Gerät bleibt 30 Tage entsperrt.
Ohne diese Secrets ist die App offen, und jede Person kann unter ⚙ Einstellungen einen eigenen
Schlüssel nur für ihr Gerät eintragen.

Optional als *Variables* (nicht Secrets): `GEMINI_MODEL`, `OPENROUTER_MODEL`, `AI_PROVIDER` (`gemini`/`openrouter`).

> Hinweis: Die Sperre schützt die KI-Schlüssel. Die Webseite selbst (HTML/JavaScript) ist wie jede
> Webseite öffentlich abrufbar – sie enthält aber weder Schlüssel noch persönliche Daten.

## Browser-Version veröffentlichen

Jeder Push auf `main` prüft beide Versionen, führt die Tests aus und veröffentlicht die Browser-Version automatisch
(`.github/workflows/pages.yml`). Adresse: `https://<benutzer>.github.io/<repository>/`

Voraussetzung (einmalig): **Settings → Pages → Source: „GitHub Actions“**.

## Entwickeln

```bash
npm install
npm run dev          # Browser-Version, http://localhost:3000
npm run dev:server   # Server-Version (braucht .env)
npm test             # Unit-Tests
npm run typecheck
npm run build        # Browser-Version → ./out
npm run build:server # Server-Version → .next
```

## Aufbau

```
src/
  app/(app)/           App-Seiten: Übersicht, Person (kontakt), Karten-Editor (karte), Einstellungen
  app/k/               Empfänger-Ansicht für geteilte Links
  components/          Sperre (Gate), Einführung (Intro), Editor-Bausteine
  lib/render.ts        Karten-Renderer: erzeugt die komplette, eigenständige HTML-Karte
  lib/templates.ts     Textvorlagen (du/Sie, verschiedene Anlässe)
  lib/presets.ts       Design-Vorlagen und Effekt-Standards
  lib/prompts.ts       KI-Prompts (ganze Karte, einzelne Seite, Design)
  lib/ai.ts            Gemini/OpenRouter-Anbindung mit Fallback
  lib/share.ts         Karte ⇄ Link (komprimiert)
  lib/vault.ts         verschlüsselter Zugang
  lib/examples.ts      Beispielkarten für die Galerie
  lib/repo.ts          Weiche: Browser-Speicher oder Server-API (gleiche Schnittstelle)
  lib/store.ts         Speicher im Browser, Sicherung
  lib/validate.ts      prüft und begrenzt alle Daten (auch KI-Antworten und Links)
  app/**/*.server.ts   API-Routen und Login-Schutz – nur im Server-Build enthalten
  server/              SQLite-Datenbank, Session, Server-Hilfen
scripts/build-vault.ts erzeugt zugang.json beim Veröffentlichen
install.sh, update.sh, backup.sh, docker-compose.yml, deploy/   Server-Betrieb
```

Texte unterstützen `{{name}}` (Anrede), `**fett**`, `*betont*` und Zeilenumbrüche.
