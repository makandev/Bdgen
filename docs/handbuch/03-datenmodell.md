# 3 · Datenmodell & Speicher

Alle Typen stehen in **`src/lib/types.ts`**. Die wichtigsten:

```ts
Contact   { id, name, relation, address: "du"|"sie", occasion, date, events: ExtraDate[], mood[], notes, … }
ExtraDate { label, date }   – weitere jährliche Termine; Jahr ≤ 1904 heißt „Jahr unbekannt“
Card      { id, contactId, title, data: CardData, slug?, shared?, createdAt, updatedAt }
CardData  { recipientName, address, occasion, topLine, theme, effects, scenes[], cinema,
            iosHint, reactions, meta? }
Scene     = GreetingScene | TextScene | QuizScene | ListScene | CheckScene | GiftScene | FinaleScene
Theme     { preset, Farben…, confetti[], headingFont, style, dark }
Effects   { ambient, confetti, ribbons, sparks, orbit, shine, cinema, progress, clock, speed,
            backdrop, confettiShape, particles? }
Voucher   { kind: "code"|"image", label, code, image (data-URL), pdf (data-URL, nur Server), note, show }
Rating    { value ±1, reasons[], Merkmale (preset, style, variant, …), sample? }   – nie Namen/Stichworte
```

**Organizer:** `date` (zum Anlass) und `events` (bis 12 weitere Termine) ergeben zusammen die
Einträge in `src/lib/organizer.ts`. Der Server legt die Spalte `events` in alten Datenbanken beim
Start automatisch an; im Browser bekommen alte Personen `events: []` beim Lesen.

Anlässe (`Occasion`): `geburtstag`, `danke`, `besserung`, `jubilaeum`, `neujahr`, `einfach`.

## Die wichtigste Regel: alles wird geprüft

**`src/lib/validate.ts`** ist die Grenze zwischen „unsicher“ und „sicher“. Alles, was von außen kommt,
läuft durch `normalizeCardData` & Co.:
- geteilte Links (`share.ts → decodeCard`),
- KI-Antworten (`prompts.ts`),
- Sicherungen (`records.ts → normalizeBackup`),
- jede Speicherung über die Server-API,
- ältere gespeicherte Karten beim Öffnen im Editor (füllt neue Felder mit Standardwerten).

Was die Prüfung garantiert: nur bekannte Szenentypen, Farben nur als `#rrggbb`, Schriften/Stile/
Hintergründe nur aus festen Listen, Zahlen in Grenzen, Texte gekürzt auf großzügige Längen
(2000 Zeichen), höchstens `MAX_SCENES` = 20 Seiten (das Finale bleibt immer), Bilder nur als
base64-`data:image/(jpeg|png|webp)`, PDFs nur als `data:application/pdf`, Effekt-Rezepte nur
Symbole ohne Buchstaben/Markup.

> Wer ein neues Feld einführt, muss es in `validate.ts` aufnehmen – sonst wird es beim nächsten Laden
> **stillschweigend entfernt**.

## Speicher der Browser-Version (`src/lib/store.ts`)

| Schlüssel in `localStorage` | Inhalt |
|---|---|
| `bdgen:v1:contacts` | Personen |
| `bdgen:v1:cards` | Karten |
| `bdgen:v1:ratings` | Bewertungen (höchstens 500) |
| `bdgen:ai` | KI-Schlüssel ohne Geräte-Passwort |
| `bdgen:ai-locked` | KI-Schlüssel verschlüsselt (mit Geräte-Passwort) |
| `bdgen:intro-seen`, `bdgen:learn-samples`, `funkelpost:install-dismissed` | kleine Einstellungen |

`sessionStorage` `bdgen:ai-session`: die entschlüsselten Schlüssel, nur solange Tab/App offen ist.
IDs erzeugt `src/lib/id.ts` (`newId`, funktioniert auch ohne HTTPS und auf iOS 15).

**iPhone-Besonderheit:** Eine zum Home-Bildschirm hinzugefügte App hat einen **eigenen** Speicher.
Darauf weist die Installieren-Anleitung hin; übertragen wird per Sicherung.

## Speicher der Server-Version (`src/server/db.ts`)

SQLite über `node:sqlite` (Tabellen `contacts`, `cards` mit `slug`/`shared`, `reactions`, `ratings`).
Karten-Daten liegen als JSON in einer Spalte. Datei: `DATABASE_PATH`, Standard `./data/funkelpost.db`.

## Link-Format (Browser-Version)

`/k/#` + `"1"` + base64url(**deflate-raw**(JSON von `CardData`)) – siehe `src/lib/share.ts`.
`"0"` + base64url(JSON) ist die unkomprimierte Variante. Komprimiert wird mit **fflate** (früher
`CompressionStream`, das alte iPhones nicht kennen – alte Links bleiben lesbar, ein Test sichert das).
Gutschein-Fotos machen Links lang: das Bild wird dafür klein gerechnet (`src/lib/media.ts`), ab 60 000
Zeichen warnt der Editor (WhatsApp schneidet lange Nachrichten ab).

## Sicherung

`Backup { app: "bdgen", version: 1, exportedAt, contacts[], cards[] }` (`src/lib/records.ts`).
Einspielen **ergänzt** (gleiche IDs werden überschrieben). Eine Sicherung aus der Browser-Version lässt
sich in die Server-Version einspielen.
