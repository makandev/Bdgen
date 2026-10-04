# Funkelpost – Entwickler-Handbuch

Dieses Handbuch ist die **Übergabe an die nächste Person, die am Code arbeitet** – und gleichzeitig ein
Lernmittel: Es erklärt nicht nur *was* wo liegt, sondern *warum* es so gebaut ist.

> **Regel:** Wer Code ändert, ändert das Handbuch im selben Commit mit. Ein Test (`tests/docs.test.ts`)
> schlägt fehl, wenn eine Quelldatei hier nicht beschrieben ist oder das Handbuch auf eine Datei
> verweist, die es nicht mehr gibt.

## Lesereihenfolge (ca. 60 Minuten)

| # | Kapitel | Worum es geht |
|---|---|---|
| 1 | [Überblick](01-ueberblick.md) | Was Funkelpost ist, für wen, die wichtigsten Begriffe |
| 2 | [Architektur](02-architektur.md) | Zwei Versionen aus einer Codebasis, Ordner, Datenfluss |
| 3 | [Datenmodell & Speicher](03-datenmodell.md) | Typen, Prüfung (`validate.ts`), Speicher, Links, Sicherungen |
| 4 | [Karten-Renderer](04-karten-renderer.md) | Wie aus Daten eine eigenständige, animierte HTML-Karte wird |
| 5 | [KI & Lernen](05-ki.md) | Prompts, Anbieter, Datenschutz, Effekt-Rezepte, Lernen aus Bewertungen |
| 6 | [Sicherheit](06-sicherheit.md) | Bedrohungsmodell und die Schutzmaßnahmen dagegen |
| 7 | [Server-Version](07-server.md) | API, Datenbank, Login, Betrieb |
| 8 | [Build, Tests & Veröffentlichung](08-build-tests.md) | Skripte, Prüfungen, CI, Browser-Tests |
| 9 | [Rezepte](09-rezepte.md) | Schritt für Schritt: Design, Anlass, Seitentyp, Effekt, Beispiel hinzufügen |
| 10 | [Stolperfallen](10-stolperfallen.md) | Was schon einmal schiefging – und wie man es vermeidet |
| 11 | [Dateiverzeichnis](11-dateien.md) | Jede Datei in einem Satz |

Offener Auftrag: [`../AUFTRAG-SICHERHEIT.md`](../AUFTRAG-SICHERHEIT.md) (Sicherheits-Härtung).

Weitere Dokumente: [`../SERVER.md`](../SERVER.md) (Installation für Einsteiger),
[`../KI-PLAN.md`](../KI-PLAN.md) (Modelle, Kosten, Ausbaustufen), [`../../README.md`](../../README.md) (Projektseite).

## In 5 Minuten startklar

```bash
npm install
npm run dev          # Browser-Version auf http://localhost:3000
npm test             # Unit-Tests (Node-Testrunner + tsx)
npm run typecheck    # TypeScript, immer vollständig (ohne Zwischenspeicher)
npm run build        # Browser-Version → ./out (danach läuft der iOS-15-Kompatibilitäts-Check)
npm run build:server # Server-Version → .next
```

Node 22 oder neuer ist nötig (die Server-Version nutzt das eingebaute `node:sqlite`).
