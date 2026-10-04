# Funkelpost – Arbeitsregeln

Persönliche, KI-gestützte Überraschungskarten. Next.js 16 · React 19 · TypeScript. Zwei Versionen aus
einer Codebasis: statische Browser-Version (GitHub Pages) und Server-Version (SQLite).

**Zuerst lesen:** [`docs/handbuch/README.md`](docs/handbuch/README.md) – vollständiges Entwickler-Handbuch.

**Offener Auftrag:** [`docs/AUFTRAG-SICHERHEIT.md`](docs/AUFTRAG-SICHERHEIT.md) – Sicherheits-Härtung,
Schritt für Schritt abzuarbeiten (mit Anweisungen, wie du dabei vorgehst).

## Pflichten bei jeder Änderung

1. **Handbuch aktuell halten** (`docs/handbuch/`): Neue/umbenannte/gelöschte Dateien in
   `11-dateien.md`, geänderte Abläufe im passenden Kapitel, Fehler aus denen man lernen kann in
   `10-stolperfallen.md`. `tests/docs.test.ts` prüft Vollständigkeit.
2. `npm run typecheck && npm test` müssen grün sein; bei UI-Änderungen beide Builds
   (`npm run build`, `npm run build:server`) – der Browser-Build prüft danach die iOS-15-Kompatibilität.
3. Nutzer-sichtbare Neuerungen in `src/app/(app)/infos/page.tsx` („Neu in Version …“) und ggf. `README.md`.

## Nicht verhandelbar

- **Keine KI-Schlüssel oder Secrets** in Code, Build, Links, Logs oder dem GitHub-Workflow. Schlüssel
  gibt es nur auf dem Gerät (`src/lib/settings.ts`) bzw. in der `.env` des eigenen Servers.
- **Die Namen aus der ursprünglichen HTML-Karte** kommen nirgends vor (Test in `tests/render.test.ts`).
- Der **Name** der beschenkten Person und **Gutscheine** gehen nie an die KI.
- Alles von außen (Links, KI-Antworten, Sicherungen, API) läuft durch `src/lib/validate.ts`;
  Texte im Karten-HTML nur über `esc()`/`fmt()`.
- Karten müssen auf alten iPhones laufen (Viewer ab iOS 11, App ab iOS 15): kein `structuredClone`,
  kein `crypto.randomUUID` (→ `src/lib/id.ts`); im Kartenskript (`CLIENT_JS`) nur ES5-Stil und
  Backslashes doppelt.

## Sprache

Oberfläche, Doku und Commit-Nachrichten auf Deutsch; Code-Bezeichner und Code-Kommentare auf Englisch.
