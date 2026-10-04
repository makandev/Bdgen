# 9 · Rezepte – typische Erweiterungen Schritt für Schritt

Nach jeder Änderung: `npm run typecheck && npm test`, dann **dieses Handbuch** anpassen.

## Neues Design (Preset)

1. `src/lib/presets.ts` → Eintrag in `PRESETS` (Farben, `style`, `headingFont`, `dark`, Effekte).
2. Für dunkle Hintergründe `dark: true` und helle Textfarben – `theme.test.ts` prüft Kontraste.
3. `tests/designs.test.ts` verlangt **ein Beispiel pro Design** → `src/lib/examples.ts` ergänzen.
4. Optional: Stichwort in `restyleOffline` (`COLOR_WORDS` in `src/lib/prompts.ts`).

## Neuer Anlass

1. `Occasion` in `src/lib/types.ts` erweitern.
2. `OCCASIONS` in `presets.ts` (Label + Emoji).
3. `WORDS` und `REACTIONS` in `src/lib/templates.ts` (TypeScript erzwingt beides über `Record<Occasion,…>`).
   Passen die Standardseiten inhaltlich nicht, eigene Texte wie `applyNewYear()` ergänzen.
4. Fragen in `src/lib/questions.ts`, Design-Vorschlag in `learning.ts → suggestPreset`.
5. `validate.ts` übernimmt neue Anlässe automatisch aus `OCCASIONS`.

## Neuer Seitentyp (Szene)

1. Interface in `types.ts`, in `Scene` aufnehmen.
2. `validate.ts`: `SCENE_TYPES` + Fall in `normalizeScene`.
3. `render.ts`: Fall in `renderScene` (+ CSS, ggf. Verhalten in `CLIENT_JS`).
4. `components/SceneEditor.tsx`: Label + Felder; `templates.ts → blankScene`.
5. Soll die KI ihn schreiben: Schema in `prompts.ts`.

## Neuer Effekt

- **Hintergrund:** `Backdrop` in `types.ts`, `BACKDROPS` in `validate.ts`, `BACKDROP_LABELS` in
  `presets.ts`, Zeichnen in `ambient()` in `CLIENT_JS`, im Design-Prompt (`EFFECTS_RULES`) erwähnen.
- **Neue Bewegung für Effekt-Rezepte:** `ParticleMotion` + `MOTIONS` + Zweig in der Partikel-Schleife +
  `MOTION_LABELS` in `components/DesignPanel.tsx`.

## Neues Beispiel

`src/lib/examples.ts`: Texte so schreiben, wie die KI es aus den `notes` täte. **Erfundene Namen**
verwenden (nie welche aus der Originaldatei). du/Sie muss zur Anrede der Texte passen. Optional `gift`,
`voucher` (Demo-Code wird beim Übernehmen gelöscht) und `particles`.

## Neue API-Route (Server)

Datei `src/app/api/<name>/route.server.ts`, `handle()` aus `src/server/http.ts` benutzen, Eingaben mit
`validate.ts` prüfen. Soll sie öffentlich sein: in `PUBLIC` in `src/proxy.server.ts` aufnehmen **und**
ein Limit (`src/server/limit.ts`) setzen. Im `Repo` (`src/lib/repo.ts`) beide Umsetzungen ergänzen.
