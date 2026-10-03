# ✦ Bdgen – persönliche Überraschungskarten

Bdgen macht aus ein paar Stichworten eine animierte, interaktive Überraschungskarte – für Familie,
Freunde, Kolleginnen und Kollegen. Statt fertiger Texte gibst du **Situationen, Gefühle und
Kleinigkeiten** ein; die KI macht daraus eine kleine Geschichte in sieben Seiten:

1. **Begrüßung** – passt sich der Tageszeit an, mit Live-Uhr
2. **Kurzer Hinweis** – augenzwinkernd
3. **Quiz** – eine „fachliche Prüfung“ mit Sonderregelung
4. **Liste** – „Für heute offiziell gestrichen“
5. **Der ehrliche Teil** – hier zählen deine Stichworte am meisten
6. **Schein-Ende** – „Protokoll erfolgreich abgeschlossen“ …
7. **Finale** – Wunsch, Signatur und ein **Kino-Finale** mit Sternenhimmel

Jede Seite, Farbe und jeder Effekt lässt sich einzeln ändern – von Hand oder per Wunsch an die KI.

**Die App läuft komplett im Browser** und wird über **GitHub Pages** veröffentlicht – ohne Server,
ohne Datenbank, ohne Kosten.

## So funktioniert’s

| | |
|---|---|
| **Speicher** | Personen und Karten liegen nur im Browser des jeweiligen Geräts. Unter ⚙ Einstellungen gibt es eine Sicherung zum Herunterladen/Einspielen (auch zum Übertragen auf ein anderes Gerät). |
| **Teilen** | Die ganze Karte steckt im Link (hinter dem `#`) – sie wird nirgends hochgeladen. Empfänger brauchen kein Passwort. Alternativ: Karte als einzelne HTML-Datei, die offline funktioniert. |
| **KI** | Google Gemini oder OpenRouter (beide mit Gratis-Modellen). Ist einer ausgelastet, wird automatisch der andere versucht. Ohne KI entstehen Karten aus Vorlagen. |
| **Datenschutz** | Der Name der Person wird **nie** an die KI geschickt – sie arbeitet mit dem Platzhalter `{{name}}`. |
| **Sicherheit** | Geteilte Karten laufen in einer abgeschotteten Umgebung (Sandbox) und können nicht auf gespeicherte Daten oder Schlüssel zugreifen. Alle Inhalte aus Links werden geprüft und bereinigt. |

## Passwortsperre & KI für die ganze Familie (einmalig einrichten)

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

## Veröffentlichen

Jeder Push auf `main` baut die App, führt die Tests aus und veröffentlicht sie automatisch
(`.github/workflows/pages.yml`). Adresse: `https://<benutzer>.github.io/<repository>/`

Voraussetzung (einmalig): **Settings → Pages → Source: „GitHub Actions“**.

## Entwickeln

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Unit-Tests
npm run typecheck
npm run build        # statische Seite nach ./out
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
  lib/store.ts         Speicher im Browser, Sicherung
  lib/validate.ts      prüft und begrenzt alle Daten (auch KI-Antworten und Links)
scripts/build-vault.ts erzeugt zugang.json beim Veröffentlichen
```

Texte unterstützen `{{name}}` (Anrede), `**fett**`, `*betont*` und Zeilenumbrüche.
