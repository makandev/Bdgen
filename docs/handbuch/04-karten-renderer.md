# 4 · Karten-Renderer (`src/lib/render.ts`)

`renderCardHTML(data, options)` erzeugt **eine vollständige, eigenständige HTML-Datei**: CSS, HTML und
ein kleines Skript, ohne externe Dateien, ohne Bilder (außer einem Gutschein-Foto). Dieselbe Funktion
liefert die Editor-Vorschau, die Galerie, den Link-Viewer, die Server-Ansicht `/k/<slug>/` und den
Datei-Export.

## Aufbau

```
renderCardHTML
├─ css(d)        = legacyClamp(legacyInset(baseCss(d)))   ← Fallbacks für alte iPhones
│   ├─ baseCss   Grundgestaltung aus Theme-Farben (color.ts: mix, rgba, contrast)
│   └─ styleCss  Kartenstil: glass | luxe | holo | terminal | pixel  (+ Hintergrund „aurora“)
├─ renderScene   je Szene eine <section class="screen" data-type=…>
│   └─ voucherHtml  Gutschein-Ticket auf der Geschenkseite (hasVoucher)
├─ Kino-Finale    #cinema (wenn effects.cinema)
├─ Feuerwerk-Show #vshow  (wenn ein Gutschein mit show=true existiert)
├─ <script id="cfg" type="application/json">  Konfiguration (Effekte, Farben, Tageszeit-Texte …)
└─ <script>CLIENT_JS</script>                 das Verhalten der Karte
```

### Unterschrift und Musik

- Die Unterschrift steht als **Inline-SVG** im Finale (`inkSvg`): `viewBox` auf die Striche zugeschnitten,
  Pfade nur aus geprüften Zahlen (`inkPath`), Farbe aus dem Theme. Ohne JavaScript oder mit reduzierter
  Bewegung ist sie sofort ganz zu sehen.
- Die Melodien stehen als Notenlisten im Kartenskript (keine Dateien, keine Lizenzen); in den Daten steht
  nur der Name (`effects.music`). Im Stumm-Modus des iPhones bleibt Web Audio still – so gewollt.

### Texte und Escaping

- `esc()` maskiert `& < > " '`. **Jeder** Text geht durch `fmt()`: erst maskieren, dann die kleine
  Auszeichnung anwenden: `{{name}}` → Name, `**fett**`, `*kursiv*`, Zeilenumbruch.
- Die Konfiguration landet als JSON in einem `<script type="application/json">`; `<` sowie U+2028/2029
  werden dabei maskiert, damit nichts aus dem Skript ausbrechen kann.
- `[[Sie-Form|du-Form]]` gibt es nur in Vorlagen (`templates.ts → addr()`); in gespeicherten Karten
  steht bereits die passende Form.

## CLIENT_JS – das Skript in jeder Karte

Bewusst **altes, einfaches JavaScript** (ES5-Stil, `var`, keine Module): Es läuft beim Empfänger
auf dem Handy, auch auf alten Geräten. Bausteine:

| Funktion | Aufgabe |
|---|---|
| `go(n)` | zur Seite n wechseln, Fortschritt, kleine Effekte |
| `revealList`, Quiz-Handler | Liste nacheinander einblenden, Quiz-Antworten |
| `time()` | Uhr, Datum und Begrüßung nach Tageszeit (morgens/tagsüber/abends) |
| `ambient()` | Hintergrund auf Canvas: Lichtpunkte, Funkelsterne, Matrix-Regen, Blöcke, **Feuerwerk** (`makeFW`) |
| Partikel-Schleife | Effekt-Rezepte (`effects.particles`): Emoji werden einmal vorgerendert und dann gezeichnet |
| `burst`, `miniBurst`, `ribbonRain`, `sparkBurst` | Konfetti, Bänder, Funken |
| `startCinema` / `closeCinema` | Kino-Finale |
| `openGift` → `startShow` | Päckchen öffnen → Countdown 3-2-1 → Feuerwerk → Gutschein fliegt herein |
| `drawInk` | Handschrift-Unterschrift im Finale Strich für Strich nachzeichnen (`stroke-dashoffset`) |
| Musik (`SONGS`) | Hintergrundmelodie mit Web Audio (`webkitAudioContext` auf alten iPhones): startet beim ersten Antippen, Knopf 🔇/🔊 unten rechts, pausiert im Hintergrund-Tab; bei `prefers-reduced-motion` erst auf Knopfdruck |
| `copyText`, `savePdf` | Gutschein-Code kopieren (mit Ersatzweg ohne Clipboard-API), PDF speichern |
| Reaktionen | `reactionMode`: `send` (Server: POST; sonst Teilen/WhatsApp) oder `preview` |
| `onRealResize` | reagiert nur auf echte Größenwechsel – nicht auf die ein-/ausfahrende Browserleiste |
| `lockScroll` | sperrt das Scrollen unter Vollbild-Overlays |

Barrierefreiheit/Rücksicht: `prefers-reduced-motion` schaltet Animationen ab; ohne JavaScript zeigt
die Klasse `nojs` alle Seiten untereinander.

## Kompatibilität (wichtig!)

- Karten müssen auf **iOS 11+** laufen: `inset` und `clamp()` werden automatisch mit Ersatzwerten
  davor ausgegeben (`legacyInset`, `legacyClamp`), `-webkit-`-Präfixe wo nötig.
- Ein Test (`tests/extras.test.ts`) prüft, dass das Kartenskript für **jedes Beispiel** gültiges
  JavaScript ist (`new Function`). Achtung bei regulären Ausdrücken in `CLIENT_JS`: Das Skript steht in
  einem TypeScript-Template-String – ein Backslash muss **doppelt** geschrieben werden (`\\/`).
- Eigene Funktionen *im Kartenskript* immer vor der ersten Verwendung als `var f = function(){}`
  oder auf oberster Ebene deklarieren: im strikten Modus sind Funktionen in Blöcken blockweit gültig.

## Optionen

```ts
renderCardHTML(data, {
  startScene?: number,          // Editor-Vorschau: mit Seite n beginnen
  exportFile?: boolean,         // Datei-Export: iPhone-Hinweis darunter
  reactUrl?: string,            // Server: wohin Reaktionen gehen
  reactionMode?: "send" | "preview",
})
```

## Wo Karten angezeigt werden

Immer in einem **iframe mit `sandbox`** (ohne `allow-same-origin`), damit eine präparierte Karte nicht
an die Daten der App kommt – Ausnahme: der Viewer auf iOS < 13 (siehe Kapitel 6). Vorschau-iframes
erlauben zusätzlich `allow-downloads allow-popups` (PDF speichern, Teilen).
