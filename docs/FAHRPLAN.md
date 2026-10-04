# ✦ Funkelpost – Fahrplan

**Stand: 4. Oktober 2026 (Version 0.9).** Diese Datei sagt, was als Nächstes kommt, was vor einem Verkauf fehlt und
was bewusst **nicht** gebaut wird. Wer (Mensch oder KI) weiterarbeitet, liest zuerst [`CLAUDE.md`](../CLAUDE.md), dann
das [Handbuch](handbuch/README.md), dann diese Datei.

Pflege: Erledigtes hier streichen und unter „Neu in Version …“ in `src/app/(app)/infos/page.tsx` eintragen.
Nutzer-sichtbare Ideen stehen zusätzlich unter „Geplant & noch offen“ auf der Infos-Seite.

---

## 1. Vor einem Verkauf (Pflicht, nicht technisch)

Keine Rechtsberatung – vor dem Verkauf von einer Anwältin oder einem Anwalt prüfen lassen.

| # | Was | Stand |
|---|---|---|
| 1 | **Lizenz für Funkelpost selbst:** [PolyForm Noncommercial 1.0.0](../LICENSE.md) – nicht-kommerziell frei, kommerziell nur mit Erlaubnis. Für jeden Verkauf eine eigene schriftliche Erlaubnis bzw. kommerzielle Lizenz ausstellen (Vorlage noch offen). | ✅ seit 0.9 |
| 2 | **Impressum** und **Datenschutzerklärung** als Seiten in der App (inkl. Hinweis, dass Texte an Google bzw. OpenRouter gehen) | ❌ fehlt |
| 3 | **Nutzungsbedingungen / AGB** für Käufer | ❌ fehlt |
| 4 | **AVV** (Auftragsverarbeitung), falls du für Kunden einen Server betreibst | ❌ fehlt |
| 5 | **Kinder & Altersgrenze:** Google erlaubt die Gemini-API nur ab 18 und nicht in Apps, die sich an Minderjährige richten (Details: [`KI-PLAN.md`](KI-PLAN.md), Abschnitt 7). Texte wie „Kinder machen am besten gemeinsam mit einem Erwachsenen mit“ entsprechend klären. | ⚠️ offen |
| 6 | **Fremd-Lizenzen** mitliefern: [`LIZENZEN-DRITTANBIETER.md`](LIZENZEN-DRITTANBIETER.md), neu erzeugen mit `npm run lizenzen` | ✅ Liste da, Seite in der App fehlt noch |
| 7 | Gewerbeanmeldung, Steuer | ❌ deine Sache |

## 2. Technisch als Nächstes (nach Wirkung sortiert)

| # | Was | Warum | Aufwand |
|---|---|---|---|
| 1 | **Auf echtem iPhone/Safari testen** (App ab iOS 15, Karten ab iOS 11) | Bisher nur im Chromium-Browser geprüft | klein |
| 2 | **KI modernisieren, Rest** (`KI-PLAN.md`, Phase 1): OpenRouter mit fester Gratis-Liste statt `openrouter/free`; bei Gemini „Thinking-Level“ + JSON-Schema. Erledigt (0.9): fest `gemini-3.8-flash` mit Rückfall auf `gemini-flash-latest`, keine `temperature` mehr bei Gemini | `openrouter/free` würfelt auch ungeeignete Modelle | 1 Tag |
| 3 | **Seiten „Impressum“, „Datenschutz“, „Lizenzen“** in der App (Texte aus Abschnitt 1) | Pflicht für Verkauf | klein, sobald Texte da sind |
| 4 | **KI-Wahl einfach:** „Gratis / Günstig / Beste Qualität“ statt Modell-IDs (`KI-PLAN.md`, Phase 2) | Einstellungen sind für Laien zu technisch | 1–2 Tage |
| 5 | **Mehrere Benutzer** mit eigenem Login (Server-Version) | Voraussetzung, um die Server-Version an Familien/Firmen zu verkaufen | groß |
| 6 | Ideen aus „Geplant & noch offen“ (Fotos auf allen Seiten, Sprachnachricht, Druckversion, Sprachen) und „Funkeljagd“ (`KI-PLAN.md`, Abschnitt 8) | Mehrwert | je nach Idee |

## 3. Bewusst NICHT bauen

- **Keine KI-Schlüssel in Code, Build, Links oder GitHub-Workflow** – Schlüssel nur auf dem Gerät bzw. in der `.env` des Servers.
- **Kein freier JavaScript-Code von der KI** in verschickten Karten – nur geprüfte Rezepte, SVG und Animations-Sprache (Sicherheit).
- **Name der beschenkten Person und Gutscheine gehen nie an die KI.**
- **Keine Unterstützung unter iOS 15** für die App bzw. iOS 11 für Karten.
- **Kein zentrales Konto/Cloud in der Browser-Version** – Daten bleiben auf dem Gerät; wer Sync will, nimmt die Server-Version.

## 4. Übergabe an eine neue KI oder einen neuen Entwickler

1. [`CLAUDE.md`](../CLAUDE.md) – Regeln, die bei jeder Änderung gelten (Handbuch pflegen, Tests, beide Builds).
2. [`docs/handbuch/`](handbuch/README.md) – Aufbau, Sicherheit, Stolperfallen, Liste aller Dateien.
3. Diese Datei – was als Nächstes kommt.
4. [`KI-PLAN.md`](KI-PLAN.md) – Modelle, Kosten, große Ideen.
5. Prüfen vor jedem Merge: `npm run typecheck && npm test`, bei Oberflächen-Änderungen zusätzlich `npm run build` und `npm run build:server`.
