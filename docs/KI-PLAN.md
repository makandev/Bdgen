# ✦ Funkelpost – KI-Übersicht & Plan

**Stand: 3. Oktober 2026.** Recherchiert von zwei Agenten: einem „Gelehrten“ für Modelle und Kosten und einem
„Visionär“ für die große Idee. Die wichtigsten Aussagen sind in den offiziellen Google-Quellen gegengeprüft.
Preise ändern sich oft – dieses Dokument ist eine Momentaufnahme.

---

## 1. Das Wichtigste in 60 Sekunden

| | |
|---|---|
| **Reicht „nur Gemini Flash“?** | **Ja.** Funkelpost braucht kurze, warmherzige Texte als JSON – genau dafür ist Flash gemacht. Pro-Modelle bringen hier kaum etwas. |
| **Aber:** | Unser Standard `gemini-flash-latest` zeigt laut Google seit 19.05.2026 auf **`gemini-3.5-flash`** – das ältere Modell, und im Bezahltarif das *teuerste* Flash (1,50 $ / 9,00 $ pro 1 Mio. Tokens). Besser: fest **`gemini-3.8-flash`** (neuer, bis 31.12.2026 halb so teuer). |
| **Gratis-Kontingent** | Die großen Flash-Modelle haben nur ca. **20 Anfragen/Tag** gratis, Flash-Lite ca. **500/Tag** (Drittquellen, Google nennt keine Zahlen mehr). Das reicht für ~4–6 Karten pro Tag. |
| **Sofort anpassen** | Google hat `temperature` am 21.07.2026 für veraltet erklärt. Unser Code schickt sie noch mit (funktioniert, sollte aber ersetzt werden durch „Thinking-Level“ + festes JSON-Schema). |
| **OpenRouter** | `openrouter/free` würfelt aus 18 Gratis-Modellen – darunter Programmier-, Medizin- und Filter-Modelle, die keine Karten schreiben können. Besser: feste Liste mit **`google/gemma-4-31b-it:free`** vorn. |
| **Bilder** | Nirgends gratis. Ca. **3–13 Cent pro Bild**. |
| **Video** | Nirgends gratis. Ca. **10–50 Cent pro kurzem Clip**. |
| **„KI schreibt Code“** | Ja, aber gezielt: **SVG-Sticker** und eine **kleine Animations-Sprache**, die unser Renderer ausführt. **Kein freier JavaScript-Code** in verschickten Karten (Sicherheit!). |
| **⚠️ Kinder** | Google-Bedingungen: Nutzung **ab 18** und **nicht in Apps, die wahrscheinlich von unter 18-Jährigen genutzt werden.** Funkelpost wirbt mit „auch für Kinder“ → muss geklärt werden (siehe Abschnitt 7). |
| **Datenschutz Deutschland** | Gute Nachricht: Für Nutzer in EWR/Schweiz/UK gelten bei Gemini auch im Gratis-Tarif die Regeln des Bezahltarifs → **kein Training mit unseren Daten.** |
| **Die große Idee** | **„Funkeljagd“** – die Karte wird zur echten Schatzsuche mit gedruckten QR-Kärtchen (Abschnitt 8). |

---

## 2. Gemini – alle Modelle

Preise in US-Dollar pro 1 Mio. Tokens (Eingabe / Ausgabe). „Denk-Tokens“ (Thinking) zählen als Ausgabe.

### 2.1 Text

| Modell-ID | Gratis? | Preis bezahlt | Für Funkelpost |
|---|---|---|---|
| **`gemini-3.8-flash`** (seit 02.09.2026) | ja (~20/Tag) | 0,75 / 3,75 bis 31.12.26, danach 1,50 / 7,50 | ⭐ **Beste Wahl für die Kartentexte** |
| `gemini-3.7-flash` | ja | wie 3.8 | gut, von 3.8 überholt |
| `gemini-3.6-flash` | ja | wie 3.8 | gut, knapper |
| `gemini-3.5-flash` ← *Ziel von `gemini-flash-latest`* | ja | **1,50 / 9,00** | gut, aber im Bezahltarif zu teuer |
| **`gemini-3.5-flash-lite`** | ja (~500/Tag) | 0,30 / 2,50 | ⭐ **Für viele kleine Aufrufe** (Design-Wunsch, Einzelseite, Test) |
| `gemini-3.1-flash-lite` | ja | 0,25 / 1,50 | sehr günstig, etwas schwächer |
| `gemini-3.1-pro-preview` | **nein** | 2,00 / 12,00 | überdimensioniert |
| `gemini-2.5-*` | nur für Altkunden | – | nicht mehr verwenden |

Alle 3.x-Flash-Modelle: 1 Mio. Tokens Kontext, verlässliches JSON per Schema („structured outputs“), Thinking-Stufen.

### 2.2 Bilder („Nano Banana“) – **keine Gratis-Stufe**

| Modell-ID | Preis pro Bild |
|---|---|
| `gemini-3.1-flash-lite-image` (Nano Banana 2 Lite) | **≈ 3,4 ct** (1K) – schnell & günstig |
| `gemini-3.1-flash-image` (Nano Banana 2) | 4,5 ct (0,5K) · **6,7 ct (1K)** · 10 ct (2K) · 15 ct (4K) – kann auch Fotos bearbeiten |
| `gemini-3-pro-image` (Nano Banana Pro) | 13,4 ct (1K/2K) · 24 ct (4K) – Studioqualität, gute Schrift im Bild |
| ~~`gemini-2.5-flash-image`, Imagen 4~~ | abgeschaltet |

### 2.3 Video – **keine Gratis-Stufe**

| Modell-ID | Preis pro Sekunde (mit Ton) |
|---|---|
| `veo-3.1-lite-generate-preview` | **5 ct (720p)** · 8 ct (1080p) |
| `veo-3.1-fast-generate-preview` | 10–30 ct |
| `veo-3.1-generate-preview` | 40–60 ct |
| `gemini-omni-1.1-flash` (seit 27.08.2026) | ≈ 10 ct (720p) – kann Fotos animieren, 3–10 s Clips |

### 2.4 Musik & Sprache

| Modell-ID | Preis | Idee für Funkelpost |
|---|---|---|
| `lyria-3-clip-preview` | 4 ct pro Clip (≤ 30 s) | eigene kleine Melodie zur Karte |
| `lyria-3.5` | 8 ct pro Song | |
| **`gemini-3.8-flash-tts`, `-lite-tts`** | **gratis-Stufe vorhanden** | ⭐ **„Karte vorlesen lassen“ – kostenlos möglich** |

---

## 3. OpenRouter – alle relevanten Modelle

**Rahmen:** Gratis-Modelle: 20 Anfragen/Minute, **50/Tag** (ab 10 $ gekauftem Guthaben: **1.000/Tag**). Datenschutz pro Anfrage
steuerbar (`provider.data_collection: "deny"`), Fallback-Listen (`models: [...]`) und Preisobergrenzen (`max_price`) möglich.

### 3.1 Gratis (`:free`) – welche taugen?

| Modell | Urteil |
|---|---|
| **`google/gemma-4-31b-it:free`** | ⭐ **Erste Wahl** – gutes Deutsch, JSON-Modus |
| `google/gemma-4-26b-a4b-it:free` | gut, schneller |
| `qwen/qwen3.8-27b:free` | gut, viele Anbieter |
| `thinkingmachines/inkling:free` | vielversprechend, ungeprüft, kein JSON-Modus |
| `nvidia/nemotron-3-super-120b-a12b:free` | JSON verlässlich, Stil mittel |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | groß, eher steif |
| `dots-studio/dots-3-note-preview:free` | läuft 31.12.2026 aus |
| ❌ `poolside/laguna-*`, `cohere/north-mini-code` | nur Programmieren |
| ❌ `inclusionai/ling-3.0-flash-sante` | Medizin-Modell |
| ❌ `apodex/apodex-1.1-mini` | Recherche-Modell |
| ❌ `liquid/lfm-2.5-2.6b`, `nemotron-3.5-lightning` | zu klein für schöne Texte |
| ❌ `nvidia/nemotron-3.5-content-safety` | schreibt nichts – ist ein **Filter** (nützlich zum Prüfen von Eingaben!) |
| ⚠️ `openrouter/free` | würfelt aus allen obigen → schwankende Qualität |

**Empfohlene Kette:** `gemma-4-31b-it:free` → `qwen3.8-27b:free` → `gemma-4-26b-a4b-it:free` → `openrouter/free`

### 3.2 Günstig (Ausgabe ≤ ~0,50 $/1M)

| Modell | Preis (Ein/Aus) | Hinweis |
|---|---|---|
| **`google/gemma-4-31b-it`** | 0,09 / 0,34 | ⭐ Preis-Leistungs-Tipp, ohne Gratis-Limits |
| `deepseek/deepseek-v4-flash` | 0,028 / 0,056 | extrem billig, Anbieter in China (Datenschutz!) |
| `deepseek/deepseek-v4-pro` | 0,21 / 0,42 | stark |
| `openai/gpt-6-luna` | 0,10 / 0,50 | |
| `mistralai/mistral-small-2603` | 0,15 / 0,60 | europäischer Anbieter |

### 3.3 Premium (für „Beste Qualität“)

`google/gemini-3.8-flash` (0,75/3,75) · `anthropic/claude-sonnet-5.5` (2/10) · `openai/gpt-6-sol` (2/10) ·
`google/gemini-3.1-pro-preview` (2/12) · `anthropic/claude-opus-5.5` (4/20).
Bei so kurzen Texten ist der Unterschied zu 3.8 Flash vermutlich klein → höchstens für „Nochmal versuchen“.

### 3.4 Bilder über OpenRouter (59 Modelle, Auswahl)

| Modell | ca. Preis | Besonderheit |
|---|---|---|
| `google/gemini-3.1-flash-lite-image` | 3,4 ct | wie direkt bei Google |
| `google/gemini-3.1-flash-image` | 6,7 ct | Fotos bearbeiten |
| `openai/gpt-image-2`, `gpt-image-1-mini` | Token-Abrechnung | |
| `black-forest-labs/flux.2-*`, `bytedance-seed/seedream-5-*` | Token-Abrechnung | stark bei Fotorealismus |
| **`recraft/recraft-v4(.1)-vector`** | Token-Abrechnung | ⭐ **liefert SVG** – klein, skalierbar, passt in den Link |

### 3.5 Video über OpenRouter (30 Modelle, Auswahl)

| Modell | pro Sekunde |
|---|---|
| `heygen/heygen-video-1` | **2 ct (480p)** – am günstigsten |
| `google/veo-3.1-lite` | 3–8 ct |
| `minimax/hailuo-3-max` | 5–8 ct |
| `kwaivgi/kling-v3.0-std` | 8–13 ct |
| `openai/sora-2-pro` | 30–50 ct |

---

## 4. Was kostet eine Karte?

Annahme: Karte + ein paar Änderungen ≈ 6.000 Eingabe- und 5.000 Ausgabe-Tokens.

| Stufe | Modelle | pro Karte | 100 Karten |
|---|---|---|---|
| **Gratis** | 3.8 Flash + 3.5 Flash-Lite, Fallback Gemma 4 free | **0 €** (Grenze: ~4–6 Karten/Tag) | 0 € |
| **Günstig** | `google/gemma-4-31b-it` (bezahlt) | **0,2 ct** | 22 ct |
| **Qualität** | `gemini-3.8-flash` (bezahlt) | **2,3 ct** | 2,33 $ |
| *zum Vergleich: heutiger Alias* | `gemini-flash-latest` = 3.5 Flash | 5,4 ct | 5,40 $ |
| **Premium-Text** | Claude Sonnet 5.5 / GPT-6 Sol | 6,2 ct | 6,20 $ |
| **+ 2 Bilder** | 3.8 Flash + 2× Nano Banana 2 | **15,7 ct** | 15,70 $ |
| **+ Bild + 6 s Video** | 3.8 Flash + Bild + Veo 3.1 Lite | **39 ct** | 39 $ |

**Fazit:** Texte kosten praktisch nichts. **Bilder vervielfachen, Videos verzehnfachen die Kosten** → nur mit Budget-Schutz.

---

## 5. Bilder & Video einbauen – ja, so geht's

| Zweck | Empfehlung |
|---|---|
| Illustration zur Karte | `gemini-3.1-flash-lite-image` (3,4 ct) oder **Recraft-Vektor (SVG)** |
| Foto bearbeiten („Oma als Comicfigur“) | `gemini-3.1-flash-image` |
| Kurzes Intro-Video | `veo-3.1-lite` (Bild → Video) oder `heygen-video-1` (480p, günstig) |

**Browser-Version:** Bilder passen **nicht in den Link** (60–150 KB vs. 2–3 KB). Deshalb: Bilder im Gerät speichern (IndexedDB)
und nur im **HTML-Export** einbetten – oder **SVG-Sticker**, die klein genug für den Link sind. **Video nur in der Server-Version.**

**Server-Version:** eigene Routen für Bild (sofort) und Video (Auftrag + Statusabfrage), Dateien im Docker-Volume,
Backup sichert den Medienordner mit, Budget-Grenze in der `.env` (z. B. `AI_MEDIA_BUDGET_USD=5`).

**Pflicht dabei:** Preisschild + Bestätigung vor jedem Bild/Video, Monatsbudget, Eltern-Freigabe (PIN), Einwilligung bei Fotos echter
Personen, Metadaten (EXIF) entfernen, feste Stil-Vorlagen statt freier Bildwünsche, Karte funktioniert immer auch ohne Bild/Video.

---

## 6. „Normale“ Sprachmodelle können coden – was bringt das?

Deine Idee stimmt: Jedes Textmodell kann HTML, SVG und JavaScript schreiben. Die Frage ist, **wie viel Freiheit** wir ihm geben –
denn die Karten werden an **andere Menschen** verschickt, und jeder kann sich einen Link auch selbst basteln.

| Stufe | Was die KI liefert | Nutzen | Risiko | Gratis-tauglich | Aufwand |
|---|---|---|---|---|---|
| **i – heute** | nur Einstellungen (Farben, Effekte) | solide | minimal | ✅ | – |
| **ii – SVG-Sticker** ⭐ | kleine Vektor-Grafiken („Kuchen mit Gartenzwerg“) | **hoch, persönlich, passt in den Link** | gering (Positivliste, Anzeige als Bild ohne Skript) | ✅ (Premium hübscher) | 2–3 Tage |
| **iii – Animations-Sprache** ⭐⭐ | „Rezepte“ für neue Effekte (z. B. „80 Luftballons steigen von unten auf“), die unser Renderer ausführt | **hoch – neue Effekte ohne neuen Code** | gering (nur Bekanntes wird ausgeführt) | ✅✅ | 3–5 Tage |
| **iv – freier JS-Code** ❌ | eigenes Programm in der Karte | selten Spitze, oft kaputt | **hoch**: täuschend echte Login-Seiten (Phishing), Popups, Akku-Killer | ❌ | 5–8 Tage + Pflege |

**Empfehlung:** zuerst **iii** (sicher, für alle, gratis), dann **ii**. **iv nicht umsetzen.**

---

## 7. ⚠️ Offener Punkt: Kinder

Die Gemini-API-Bedingungen (Stand 28.04.2026) sagen wörtlich: *„You must be 18 years of age or older to use the APIs. You also
will not use the Services as part of a website, application, or other service … that is directed towards or is likely to be
accessed by individuals under the age of 18."*

Funkelpost betont aber „auch für Kinder“. Möglichkeiten (keine Rechtsberatung):

1. **Funkelpost richtet sich an Erwachsene**, Kinder nutzen es **nur gemeinsam mit Eltern** – Texte in Einführung/Infos entsprechend anpassen.
2. In einem **Kinder-Modus** die KI abschalten (nur Vorlagen) oder einen Anbieter verwenden, dessen Bedingungen das erlauben.
3. Für die **Server-Version** entscheidet der Betreiber (du) – trotzdem Bedingungen beachten.

Vorschlag: Variante 1 sofort (Texte anpassen, „mit Erwachsenen“), Variante 2 als Option.

---

## 8. Die große Idee: „Funkeljagd“ 🗺️

**Aus der Karte wird eine Schatzsuche in der echten Welt.**

- Man nennt der KI ein paar Verstecke („Kaffeedose, Briefkasten, unterm Sofakissen“) – sie schreibt dazu Rätsel (auf Wunsch gereimt).
- Funkelpost druckt schöne **Kärtchen mit QR-Code** im Kartendesign.
- Jeder gefundene QR-Code **schaltet die nächste Seite frei**; am Ende: Päckchen + Kino-Finale + Reaktion.
- **Geht ohne Server:** Jede Station ist verschlüsselt, der Schlüssel steckt im QR-Code der nächsten Station → kein Vorblättern.
- **Fern-Modus:** Codewörter statt QR, oder „eine Station pro Tag“ als Countdown zum Geburtstag.
- **Server-Version:** Live mitfiebern – *„Oma hat Station 3 gefunden! 🎉“*

**Warum genau das?** Eine E-Card schaut man 30 Sekunden an. Bei der Funkeljagd **steht man auf**, läuft durchs Haus, lacht –
immer vor Zuschauern („Womit hast du das gemacht?“). Wiederkehrende Anlässe (Ostern, Advent, Kindergeburtstag) und
ein **Revanche-Knopf** („Jetzt du!“) sorgen fürs Weitererzählen. Kostet im Kern nichts (reiner Text, Gratis-KI).

**MVP (~2–3 Wochen):** Schalter „Als Schatzsuche“ in der Schnell-Karte · 5 Stationen · Druckbogen in 3 Designs · QR-Freischaltung ·
Codewort-Alternative · Beispiel in der Galerie. **Sicherheit:** nur Verstecke drinnen, Sperrliste (Herd, Steckdose, Straße …),
keine Ortung, Verstecke nie im Lernsystem.

**Bonus-Funken:** Mitmach-Jagd (jedes Familienmitglied füllt eine Station) · Revanche-Knopf · druckbares „Schatzsucher-Diplom“.

**Später** als eigene Marke „Funkeljagd“ auf derselben Codebasis (Kindergeburtstage, Hochzeiten, Firmen-Events) –
natürliches Bezahlmodell: Premium-Kärtchen-Set.

---

## 9. Der Plan – Reihenfolge

| Phase | Was | Kosten für Nutzer | Aufwand |
|---|---|---|---|
| **1 – Sofort** | Gemini modernisieren: feste ID `gemini-3.8-flash` statt Alias, `temperature` raus → Thinking „low“ + JSON-Schema, Flash-Lite für Kleinkram, bei Tageslimit erst auf Flash-Lite ausweichen. OpenRouter: feste Gratis-Liste mit Gemma 4 vorn + JSON-Modus. Kinder-Hinweise anpassen. | gratis | 2 Tage |
| **2 – Einfach wählen** | Einstellungen als 3 große Karten: **Gratis / Günstig (< 1 ct) / Beste Qualität (2–6 ct)** statt Modell-IDs; Modelle mit dem vorhandenen 👍/👎-System vergleichen | – | 1,5–2 Tage |
| **3 – KI gestaltet mit** | **Animations-Sprache** (Stufe iii) + **SVG-Sticker** (Stufe ii) | gratis | 5–8 Tage |
| **4 – Funkeljagd** | MVP wie in Abschnitt 8 | gratis | 2–3 Wochen |
| **5 – Vorlesen** | „Karte vorlesen lassen“ mit `gemini-3.8-flash-tts` | gratis-Stufe | 1–2 Tage |
| **6 – Bilder** | Budget-Schutz + Bilder (Server zuerst, dann Browser mit HTML-Export) | 3–13 ct/Bild | 6–7 Tage |
| **7 – Video (optional)** | nur Server-Version | 10–50 ct/Clip | 3–4 Tage |

---

## 10. Was (noch) nicht geprüft werden konnte

- Wohin `gemini-flash-latest` *heute* genau zeigt (laut Changelog 3.5 Flash; live nur mit Schlüssel prüfbar).
- Offizielle Gemini-Gratis-Limits (Google zeigt sie nur im AI Studio; Zahlen oben aus Drittquellen).
- Deutsche Textqualität der einzelnen Modelle – das testen wir am besten direkt mit dem 👍/👎-System.
- Datenpolitik einzelner Gratis-Anbieter bei OpenRouter; CORS für Video-Downloads.

## Quellen (abgerufen 03.10.2026)

- Google: [Modelle](https://ai.google.dev/gemini-api/docs/models) · [Preise](https://ai.google.dev/gemini-api/docs/pricing) ·
  [Limits](https://ai.google.dev/gemini-api/docs/rate-limits) · [Changelog](https://ai.google.dev/gemini-api/docs/changelog) ·
  [Thinking](https://ai.google.dev/gemini-api/docs/thinking) · [Bedingungen](https://ai.google.dev/gemini-api/terms)
- OpenRouter: [Modelle (API)](https://openrouter.ai/api/v1/models) · [Video-Modelle (API)](https://openrouter.ai/api/v1/videos/models) ·
  [Limits](https://openrouter.ai/docs/api/reference/limits) · [Datenschutz](https://openrouter.ai/docs/guides/privacy/data-collection) ·
  [Fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks) · [Bilder](https://openrouter.ai/docs/guides/overview/multimodal/image-generation) ·
  [Video](https://openrouter.ai/docs/guides/overview/multimodal/video-generation)
- Inoffizielle Gratis-Limits: scriptbyai.com, tinkerllm.com
