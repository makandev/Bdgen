# 11 · Dateiverzeichnis

Jede Datei in einem Satz. **Neue Datei → hier eintragen** (sonst schlägt `tests/docs.test.ts` fehl).

## App-Seiten (`src/app/`)

| Datei | Inhalt |
|---|---|
| `src/app/layout.tsx` | Grundgerüst aller Seiten: Metadaten, Manifest, Apple-Icons, Installieren-Knopf |
| `src/app/globals.css` | gesamtes CSS der App (nicht der Karten) |
| `src/app/icon.svg` | Favicon |
| `src/app/(app)/layout.tsx` | legt `<Gate>` um alle App-Seiten |
| `src/app/(app)/page.tsx` | Übersicht/Startseite: Erinnerungen an nahe Termine, Schnell-Karte, Personen, Beispiel-Vorschauen, Funkeln |
| `src/app/(app)/kalender/page.tsx` | Geburtstags-Organizer: alle Termine nach Monaten, Countdown, Alter, Filter, „Datum vormerken“, Kalender-Export (.ics) |
| `src/app/(app)/kontakt/page.tsx` | Person anlegen/bearbeiten, Beziehung, Stichworte, Design, Karte erstellen |
| `src/app/(app)/karte/page.tsx` | Karten-Editor: Texte, Design, Teilen, Bewerten, Autosave, Rückgängig |
| `src/app/(app)/schnell/page.tsx` | Schnell-Karte mit zwei Fragen |
| `src/app/(app)/beispiele/page.tsx` | Galerie der Beispielkarten, `?zeige=<id>` |
| `src/app/(app)/infos/page.tsx` | Neuigkeiten, Pläne, KI-Leitfaden |
| `src/app/(app)/einstellungen/page.tsx` | KI-Schlüssel, Geräte-Passwort, Sicherung, Lernen, Installieren, Hilfe |
| `src/app/login/page.tsx` | Login der Server-Version mit sicherer Weiterleitung |
| `src/app/start/page.tsx` | leitet die frühere Adresse `/start/` auf die Übersicht |
| `src/app/k/[slug]/route.server.ts` | Empfänger-Ansicht der Server-Version |
| `src/proxy.server.ts` | Login-Schutz der Server-Version (öffentliche Pfade) |

## API der Server-Version (`src/app/api/`)

| Datei | Inhalt |
|---|---|
| `src/app/api/login/route.server.ts` | Anmelden mit Limits |
| `src/app/api/logout/route.server.ts` | Abmelden |
| `src/app/api/status/route.server.ts` | eingerichtete KI-Anbieter |
| `src/app/api/health/route.server.ts` | Gesundheitscheck (öffentlich) |
| `src/app/api/contacts/route.server.ts` | Personen auflisten/anlegen |
| `src/app/api/contacts/[id]/route.server.ts` | Person lesen/ändern/löschen |
| `src/app/api/cards/route.server.ts` | Karte erstellen (Vorlage oder KI) |
| `src/app/api/cards/[id]/route.server.ts` | Karte lesen/speichern/löschen |
| `src/app/api/cards/[id]/generate/route.server.ts` | alle Texte neu schreiben |
| `src/app/api/cards/[id]/reactions/route.server.ts` | Reaktionen einer Karte |
| `src/app/api/ai/scene/route.server.ts` | eine Seite per KI neu |
| `src/app/api/ai/style/route.server.ts` | Design per Wunsch |
| `src/app/api/ai/test/route.server.ts` | KI testen |
| `src/app/api/ratings/route.server.ts` | Bewertungen |
| `src/app/api/reactions/route.server.ts` | neueste Reaktionen |
| `src/app/api/backup/route.server.ts` | Sicherung |
| `src/app/api/react/[slug]/route.server.ts` | öffentliche Reaktion der beschenkten Person |

## Bausteine (`src/components/`)

| Datei | Inhalt |
|---|---|
| `src/components/Gate.tsx` | Geräte-Passwort-Sperre, Einführung, Kontext (`useApp`) |
| `src/components/TopBar.tsx` | Kopfleiste mit Logo, Beispiele, Infos, Hilfe, Einstellungen, Sperren |
| `src/components/Intro.tsx` | Einführung in 5 Schritten |
| `src/components/Sparkles.tsx` | sanft funkelnde Sterne (nur CSS) |
| `src/components/Install.tsx` | „App installieren“: Geräte-Erkennung, Anleitungen, Knopf, Einstellungs-Abschnitt |
| `src/components/DesignPanel.tsx` | Design-Tab: KI-Wunsch, Vorlagen, Feineinstellungen, Effekt-Rezepte |
| `src/components/SceneEditor.tsx` | Felder je Seitentyp, KI-Knöpfe pro Seite |
| `src/components/VoucherFields.tsx` | Gutschein: Code, Foto oder PDF |
| `src/components/RatingBar.tsx` | 👍/👎 mit Gründen und Neuversuch |
| `src/components/RelationPicker.tsx` | Beziehung mit Emoji auswählen |
| `src/components/Swatch.tsx` | Design-Vorschau-Kacheln (`PresetGrid`) |
| `src/components/Thumb.tsx` | lebende Mini-Vorschau einer Beispielkarte |
| `src/components/fields.tsx` | Eingabefelder `Text`, `List` |
| `src/components/client.ts` | `errText`, `download` (iPhone-App: Teilen-Menü), `copyText` |
| `src/components/ExtraDates.tsx` | Weitere Termine einer Person (Hochzeitstag …) und Datumswahl mit optionalem Jahr |
| `src/components/dates.ts` | Datumsanzeige und Tage bis zum Termin |

## Kernlogik (`src/lib/`)

| Datei | Inhalt |
|---|---|
| `src/lib/types.ts` | alle Datentypen |
| `src/lib/uploads.ts` | Prüfung gewählter Dateien: Größenlimits (Foto, PDF, Sicherung), Bildformat an den ersten Bytes |
| `src/lib/validate.ts` | Prüfung/Bereinigung aller Daten von außen |
| `src/lib/render.ts` | Karten-Renderer (HTML/CSS/JS der Karte) |
| `src/lib/templates.ts` | Standardtexte je Anlass, du/Sie, Geschenkseite, Reaktionen |
| `src/lib/presets.ts` | Anlässe, Beziehungen mit Emoji, Designs, Effekt-Standards, Beschriftungen |
| `src/lib/examples.ts` | Beispielkarten der Galerie |
| `src/lib/cardbase.ts` | Startdaten einer Karte, KI-Ergebnisse übernehmen (`withGenerated`) |
| `src/lib/prompts.ts` | KI-Prompts: Karte, Seite, Design, Offline-Design |
| `src/lib/ai.ts` | Gemini/OpenRouter-Aufrufe mit Ausweichen |
| `src/lib/learning.ts` | Lernen aus Bewertungen |
| `src/lib/questions.ts` | Fragen der Schnell-Karte |
| `src/lib/repo.ts` | Weiche Browser/Server (`Repo`) |
| `src/lib/store.ts` | Speicher der Browser-Version, Sicherung |
| `src/lib/organizer.ts` | Organizer-Logik: Termine aller Personen, Alter/Jahre, Erinnerungstexte, Kalender-Datei (iCalendar) |
| `src/lib/records.ts` | Eingaben für Personen, Sicherungsformat |
| `src/lib/settings.ts` | KI-Schlüssel auf dem Gerät, Geräte-Passwort, kleine Einstellungen |
| `src/lib/vault.ts` | Verschlüsselung (PBKDF2 + AES-GCM) |
| `src/lib/share.ts` | Karte ⇄ Link (fflate) |
| `src/lib/postcard.ts` | Vorschaubild der Karte (Canvas) zum Teilen zusammen mit dem Link |
| `src/lib/media.ts` | Bilder verkleinern, PDF → Bild (pdf.js) |
| `src/lib/csp.ts` | Content-Security-Policy für App, Karten und Server; Start-Skript, das die Regel als `<meta>` setzt |
| `src/lib/color.ts` | Farbrechnen, Kontrast |
| `src/lib/id.ts` | `newId`, `clone` (iOS-15-tauglich) |
| `src/lib/base.ts` | `BASE` (Unterordner), `HOME` |

## Nur Server (`src/server/`)

| Datei | Inhalt |
|---|---|
| `src/server/db.ts` | SQLite-Datenbank |
| `src/server/http.ts` | Antwort-Helfer, KI aus `.env`, Brief, Lern-Optionen |
| `src/server/session.ts` | Passwortprüfung, signierte Sitzung |
| `src/server/limit.ts` | Ratenbegrenzung, Client-Adresse |

## Skripte (`scripts/`)

| Datei | Inhalt |
|---|---|
| `scripts/prepare-public.mjs` | baut `public/k/` und `public/vendor/pdfjs/` |
| `scripts/check-compat.mjs` | iOS-15-Prüfung nach dem Build |
| `scripts/viewer/entry.ts` | Empfänger-Ansicht für `/k/#…` |
| `scripts/viewer/index.html` | HTML-Hülle der Empfänger-Ansicht |

## Tests (`tests/`)

| Datei | Inhalt |
|---|---|
| `tests/render.test.ts` | Renderer und Namensverbot |
| `tests/uploads.test.ts` | Präparierte PDFs (versteckte Skripte in Objekt-Streams, Zip-Bomben), Bild-Erkennung, Limits |
| `tests/theme.test.ts` | Farben und Kontraste |
| `tests/designs.test.ts` | Designs und Beispiele |
| `tests/browser.test.ts` | Links, Verschlüsselung, Speicher |
| `tests/learning.test.ts` | Lernen |
| `tests/organizer.test.ts` | Organizer: Reihenfolge, Alter, „Jahr unbekannt“, Prüfung der Termine, Kalender-Export ohne Einschleusung |
| `tests/extras.test.ts` | Gutscheine, Rezepte, Kompatibilität, Geräte, Geschenkseite |
| `tests/keys.test.ts` | KI-Schlüssel und Geräte-Passwort |
| `tests/server-limit.test.ts` | Login-Limits |
| `tests/docs.test.ts` | Vollständigkeit dieses Handbuchs |

## Wurzel & Betrieb

| Datei | Inhalt |
|---|---|
| `package.json` | Abhängigkeiten, Skripte, `browserslist` |
| `next.config.ts` | Export/Server-Weiche, `basePath`, `trailingSlash`, `pageExtensions` |
| `tsconfig.json` | TypeScript-Einstellungen, Pfad-Alias `@/` |
| `public/manifest.webmanifest` | PWA-Manifest |
| `.github/workflows/pages.yml` | Prüfen, bauen, veröffentlichen (ohne Secrets, `npm ci --ignore-scripts`) |
| `.github/workflows/codeql.yml` | automatische Sicherheitsanalyse des Codes (CodeQL) |
| `.github/dependabot.yml` | wöchentliche Sicherheits-Updates für npm-Pakete und Actions als PR |
| `Dockerfile`, `docker-compose.yml` | Server-Version als Container (optional mit Caddy) |
| `deploy/Caddyfile`, `deploy/funkelpost.service` | HTTPS-Proxy, systemd-Dienst |
| `install.sh`, `update.sh`, `backup.sh` | Server einrichten, aktualisieren, sichern |
| `.env.example` | Vorlage der Server-Einstellungen |
| `CLAUDE.md` | Arbeitsregeln für KI-Assistenten in diesem Projekt |
| `docs/bilder/` | Screenshots für die Projektseite (`README.md`) – bei sichtbaren Änderungen neu aufnehmen |
