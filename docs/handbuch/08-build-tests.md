# 8 · Build, Tests & Veröffentlichung

## Skripte (`package.json`)

| Befehl | Was passiert |
|---|---|
| `npm run dev` / `dev:server` | Entwicklungsserver (vorher `prepare-public`) |
| `npm run build` | `prebuild` → `scripts/prepare-public.mjs`, dann `next build` (statischer Export nach `out/`), dann `postbuild` → `scripts/check-compat.mjs` |
| `npm run build:server` | dasselbe für die Server-Version (`.next/`) |
| `npm run start:server` | Server-Version starten |
| `npm test` | alle `tests/*.test.ts` mit dem Node-Testrunner über `tsx` |
| `npm run typecheck` | `tsc --noEmit --incremental false` |

### `scripts/prepare-public.mjs` (läuft vor jedem dev/build)

1. baut die Empfänger-Ansicht `public/k/index.html` aus `scripts/viewer/` (esbuild, ES2017, alles in
   einer Datei) und prüft, dass keine zu neuen Browser-Funktionen enthalten sind;
2. kopiert **pdf.js** (Legacy-Build) nach `public/vendor/pdfjs/`, stuft es mit esbuild auf Safari 15
   herunter und setzt einen kleinen `structuredClone`-Ersatz davor.

Beides ist erzeugt und steht in `.gitignore` – nie von Hand bearbeiten.

### `scripts/check-compat.mjs` (nach dem Browser-Build)

Bricht ab, wenn im Ergebnis Dinge stehen, die auf iOS 15 nicht laufen (Class-Static-Blocks,
`structuredClone(`, `crypto.randomUUID`). Zielbrowser stehen in `package.json → browserslist`.

## Tests (`tests/`)

| Datei | Prüft |
|---|---|
| `render.test.ts` | Renderer: Escaping, Szenen, **keine Namen aus der Originaldatei im Code** |
| `theme.test.ts` | Farben, Kontraste, Design-Prompt-Reparatur |
| `designs.test.ts` | jedes Design hat ein Beispiel, alle Beispiele rendern |
| `browser.test.ts` | Links (Hin- und Rückweg, Länge), Tresor-Verschlüsselung, Speicher |
| `learning.test.ts` | Lernen aus Bewertungen |
| `extras.test.ts` | Gutscheine, Effekt-Rezepte, alte Links, iOS-Fallbacks, Geräte-Erkennung, Kartenskript-Syntax, Geschenkseite bleibt |
| `keys.test.ts` | KI-Schlüssel: nur Chiffretext mit Geräte-Passwort, Entsperren, Sperren |
| `server-limit.test.ts` | Login-Limits (parallel, gefälschte Adressen) |
| `docs.test.ts` | **dieses Handbuch** ist vollständig und verweist nur auf vorhandene Dateien |

### Browser-Tests (Ende-zu-Ende)

Die großen Abläufe wurden mit **playwright-core** gegen den gebauten Stand geprüft (Chromium):
statische Version unter einem kleinen Server mit Präfix `/Bdgen`, Server-Version mit `next start` und
einer Attrappe der KI-Schnittstelle (OpenRouter-Format, `OPENROUTER_BASE_URL`). Tipp: Playwright-
Screenshots stören die Klick-Zuordnung in sandbox-iframes – Klicks dort nach Screenshots über das DOM
auslösen. WebKit (echtes Safari) steht in der Testumgebung nicht zur Verfügung; iPhone-Verhalten wurde
über User-Agent + Viewport und dokumentiertes WebKit-Verhalten geprüft.

## Veröffentlichung (GitHub Pages)

`.github/workflows/pages.yml` bei jedem Push auf `main`: `npm ci` → Typecheck → Tests → Server-Build
(nur zur Prüfung) → Browser-Build mit `NEXT_PUBLIC_BASE_PATH=/<repo>` → **Schlüssel-Suche im Build**
→ Deploy. Der Workflow bekommt absichtlich keine Secrets.

Voraussetzung einmalig: *Settings → Pages → Source: GitHub Actions*.
