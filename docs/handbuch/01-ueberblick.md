# 1 · Überblick

## Was Funkelpost macht

Funkelpost erstellt **persönliche, animierte Überraschungskarten** – für Familie, Freunde, Kolleginnen.
Man gibt keine fertigen Texte ein, sondern **Situationen, Gefühle und Kleinigkeiten** („backt den besten
Apfelkuchen“). Eine KI schreibt daraus eine kleine Geschichte über mehrere Seiten; Design und Effekte
lassen sich per Wunsch („wie in einem Videospiel“) oder per Vorlage einstellen. Verschickt wird die Karte
als Link oder als einzelne HTML-Datei. Die beschenkte Person braucht nichts zu installieren.

Ursprung: eine handgebaute Geburtstagskarte als einzelne HTML-Datei. Ihr Aufbau (Begrüßung mit Uhr,
augenzwinkerndes Quiz, „Für heute gestrichen“-Liste, ehrlicher Teil, Schein-Ende, Finale mit
Kino-Abspann) ist bis heute das Grundgerüst. **Die Namen aus der Originaldatei dürfen nirgends im Projekt
auftauchen** – ein Test (`tests/render.test.ts`) prüft das.

## Für wen

- **Erstellende:** Erwachsene (die Gemini-Bedingungen verlangen 18+), oft wenig technikaffin.
  Kinder gestalten gemeinsam mit einem Erwachsenen. Deshalb: Einführung beim ersten Start, große
  Knöpfe, Schnell-Karte mit nur zwei Fragen, KI zuerst – selbst schreiben ist optional.
- **Empfangende:** jedes Handy, auch alte iPhones (die Kartenansicht läuft ab iOS 11), oft geöffnet
  aus WhatsApp heraus.

## Begriffe

| Begriff | Bedeutung |
|---|---|
| **Person / Kontakt** | Wer beschenkt wird: Name, Beziehung (z. B. „Oma“), du/Sie, Anlass, Datum, Stichworte |
| **Karte** | Eine Überraschung für eine Person. Enthält `CardData` (Texte, Design, Effekte) |
| **Szene / Seite** | Ein Bildschirm der Karte: `greeting`, `text`, `quiz`, `list`, `check`, `gift`, `finale` |
| **Kino-Finale** | Vollbild-Abspann am Ende (`cinema`) |
| **Vorlage / Preset** | Fertiges Design (Farben, Kartenstil, Hintergrund, Konfetti) – `src/lib/presets.ts` |
| **Beispiel** | Fertige Karte für die Galerie – `src/lib/examples.ts` |
| **Brief** | Was die KI über die Person erfährt – **ohne Namen** |
| **Effekt-Rezept** | Von der KI erfundener Effekt: Emoji + Bewegung (`effects.particles`) |
| **Gutschein** | Optional auf der Geschenkseite: Code, Foto oder PDF, mit Feuerwerk-Show |
| **Reaktion** | Antwort der beschenkten Person per Knopf (❤️, 😂 …) |
| **Bewertung** | 👍/👎 der erstellenden Person – daraus lernt Funkelpost |
| **Browser-Version** | Statische Seite (GitHub Pages), Daten nur im Gerät |
| **Server-Version** | Eigener Server mit SQLite, Login, kurzen Links |
| **Geräte-Passwort** | Optional: verschlüsselt die KI-Schlüssel auf dem Gerät |

## Hauptabläufe

1. **Person anlegen** (`/kontakt/`) → **Karte erstellen** (mit KI oder aus Vorlage) → **Editor** (`/karte/`):
   Texte (pro Seite per KI änderbar), Design (Vorlage, Wunsch an die KI, Feineinstellungen), Teilen.
2. **Schnell-Karte** (`/schnell/`): Name + Beziehung + zwei passende Fragen → fertige Karte → 👍/👎.
3. **Empfangen:** Link öffnen → Karte durchklicken → am Ende Reaktion schicken.
