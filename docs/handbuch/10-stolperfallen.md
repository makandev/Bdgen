# 10 · Stolperfallen – gelernt auf die harte Tour

Jeder Punkt hier ist schon einmal passiert. Lies das, bevor du an den betroffenen Stellen arbeitest.

## iPhone & alte Browser

- **Next.js zielt standardmäßig auf Safari 16.4.** Ohne `browserslist` in `package.json` lief die App
  auf iOS 15.0–16.3 gar nicht (Seite sichtbar, aber kein Knopf reagierte). `check-compat.mjs` wacht
  jetzt darüber.
- `crypto.randomUUID` und `structuredClone` gibt es erst ab iOS 15.4 – und `randomUUID` nur mit HTTPS.
  Stattdessen `newId()` / `clone()` aus `src/lib/id.ts`.
- Selbst der „Legacy“-Build von pdf.js braucht Safari 16.4 → wird in `prepare-public.mjs` heruntergestuft.
- CSS `inset`, `clamp()`, `gap` in Flexbox, unpräfixiertes `clip-path` fehlen auf alten iPhones →
  Ersatzwerte (`legacyInset`, `legacyClamp`, Margins statt `gap` in Karten).
- `font: 16px/1.4 inherit` ist **ungültig** (`inherit` darf nicht in die Kurzform) → die Angabe fällt
  weg, Eingabefelder werden kleiner als 16 px und **iOS zoomt beim Antippen**.
- Mobile Browser feuern `resize`, wenn die Adressleiste ein-/ausfährt → nur echte Größenwechsel
  beachten (`onRealResize`), sonst springen alle Animationen beim Scrollen.
- Eine Home-Bildschirm-App auf dem iPhone hat **eigenen Speicher** und kann keine Downloads → Hinweis
  in der Installieren-Anleitung, `download()` nutzt dort das Teilen-Menü.
- iOS ≤ 12 dehnt iframes auf ihre Inhaltshöhe → der Viewer rendert dort direkt.

## Code-Fallen

- **Backslashes in `CLIENT_JS`:** steht in einem Template-String, also `\\/` schreiben. Einmal kam
  dadurch kaputtes JavaScript in jede Karte – der Syntax-Test fängt das jetzt.
- **Funktionen in Blöcken** im strikten Kartenskript sind nur im Block sichtbar → `var f = function…`.
- **Neue Felder** ohne Eintrag in `validate.ts` verschwinden beim nächsten Speichern.
- **Veraltete Editor-Daten:** Der Editor hält `card` (Stand beim Öffnen) und `data` (aktuell) getrennt.
  Für KI-Aufrufe immer `{ ...card, data }` übergeben – sonst arbeitete die KI mit altem Stand und hat
  eine frisch angelegte Geschenkseite samt Gutschein gelöscht.
- **Autosave:** Speichern nacheinander (Promise-Kette), beim Verlassen nachholen (`pagehide` +
  Unmount), „Gespeichert“ nur für den neuesten Stand.
- **Eine KI-Aktion zur Zeit**, Seitenumbau währenddessen sperren; Ergebnis einer Seiten-Neufassung nach
  *Objekt* einsetzen, nicht nach Index.
- **Doppelklicks** erzeugen doppelte Personen → Speichern über eine laufende Promise absichern.
- **TypeScript-Zwischenspeicher** (`tsconfig.tsbuildinfo`) hat einmal Fehler verschluckt →
  `typecheck` läuft mit `--incremental false`.
- **Top-Level-`await`** funktioniert in tsx-Skripten/Tests (CommonJS) nicht → `main()`-Funktion.

- **Install-Skripte von Paketen** laufen nicht (`--ignore-scripts`). esbuild funktioniert trotzdem
  (Binärdatei kommt als optionales Paket). Braucht ein neues Paket ein Install-Skript, bewusst prüfen.

## Werkzeuge

- `pkill -f <muster>` in der Shell beendet unter Umständen die eigene Shell, wenn das Muster in der
  Befehlszeile steht → Prozesse über gespeicherte PIDs beenden.
- `npx next start` hinterlässt einen Kindprozess `next-server`; ein alter läuft sonst weiter und blockiert
  den Port (Fehler `EADDRINUSE` steht nur im Log).
- `next start` funktioniert nicht mit `output: export` → Server-Version mit `NEXT_PUBLIC_MODE=server`.

## Inhalt

- Die Namen aus der ursprünglichen HTML-Karte dürfen **nirgends** vorkommen (Test).
- Beispiele: du/Sie muss zu den Texten passen (ein Silvester-Beispiel an „ihr Lieben“ mit du-Texten
  wirkte falsch).

## Kalender-Datei (.ics): Namen escapen, Zeilen falten

Namen landen in der Kalender-Datei des Organizers. Ein Zeilenumbruch im Namen könnte dort sonst
neue Einträge erzeugen. `icsText()` in `src/lib/organizer.ts` ersetzt Steuerzeichen und escaped
`\ ; ,`, `foldLine()` begrenzt Zeilen auf 75 Byte, ohne Emoji zu zerteilen. Der 29. Februar
wiederholt sich als „letzter Tag im Februar“, sonst fehlt er in drei von vier Jahren.

## CSP: Karten-Vorschauen erben die Regel der App

`srcdoc`-iframes übernehmen die Content-Security-Policy der Seite, die sie einbettet – auch mit
`sandbox`. Was eine Karte braucht (Inline-Skript, `data:`/`blob:`-Bilder), muss deshalb auch in
`appCSP()` erlaubt sein. Eine Regel per `<meta>` kann nur verschärfen, nie lockern; mehrere Regeln
gelten gleichzeitig (Schnittmenge). Im Entwicklungsmodus (`next dev`) setzt die App keine Regel,
weil das Neuladen dort `eval` braucht.
## PDFs verstecken Objekte in komprimierten Streams

Ein Textsuche über die rohen PDF-Bytes reicht nicht: Objekt-Streams (`/Type /ObjStm`) packen ganze
Objekte – auch `/JavaScript` oder `/OpenAction` – per FlateDecode zusammen. `pdfIsPlain()` entpackt
deshalb jeden Flate-Stream (gemeinsames Limit gegen Zip-Bomben) und lehnt Objekt-Streams ab, die es
nicht lesen kann.

## Proxy nie auf `runtime: "nodejs"` stellen

`src/proxy.server.ts` läuft als Edge-Middleware. Mit `export const config = { runtime: "nodejs" }`
baut Next 16 ohne Fehler – aber der Proxy fehlt danach komplett, und die API antwortet ohne Anmeldung
mit 200. Der Proxy darf deshalb nichts aus `src/server/db.ts` importieren (SQLite gibt es auf dem Edge
nicht); alles, was die Datenbank braucht (z. B. die Sitzungs-Generation), prüft `handle()` in den
Routen. Nach Änderungen am Proxy immer testen: `curl …/api/contacts/` ohne Cookie muss 401 geben.

## Gefährliche Zeichen ersetzen, nicht löschen

`dataBlock()` hat `<<<`/`>>>` zuerst einfach gelöscht. Aus `DATEN>><<<>` wurde dadurch `DATEN>>>` –
ein echter Schluss-Marker, hinter dem eingeschleuste „Regeln“ standen (gefunden in der unabhängigen
Prüfung). Darum ersetzen (`‹›`), damit sich die Reste links und rechts nie zu etwas Neuem verbinden.
Dasselbe bei Tags: `scrubText()` machte aus `<<b>script>` ein `<script>` (CodeQL-Fund). Jetzt wird
jedes übrige `<`, das noch einen Tag beginnen könnte, zu `‹` (`<3` bleibt).
