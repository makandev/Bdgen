import { test } from "node:test";
import assert from "node:assert/strict";
import { EXAMPLES, exampleCard } from "../src/lib/examples";
import { PRESETS, presetEffects, presetTheme, relationEmoji } from "../src/lib/presets";
import { renderCardHTML } from "../src/lib/render";
import { defaultCardData } from "../src/lib/templates";
import { normalizeCardData } from "../src/lib/validate";

test("every design renders with its style and backdrop", () => {
  for (const id of Object.keys(PRESETS)) {
    const d = defaultCardData({ recipientName: "Test", address: "du", occasion: "geburtstag", preset: id });
    const html = renderCardHTML(d);
    assert.ok(html.includes(`st-${d.theme.style}`), id);
    assert.ok(html.includes(`bd-${d.effects.backdrop}`), id);
  }
});

test("cards saved before the new design options still render and get defaults", () => {
  const old = defaultCardData({ recipientName: "Alt", address: "sie", occasion: "danke" }) as unknown as Record<string, Record<string, unknown>>;
  delete old.theme.style;
  delete old.effects.backdrop;
  delete old.effects.confettiShape;
  const html = renderCardHTML(old as never);
  assert.ok(html.includes("st-glass") && html.includes("bd-dots"));
  const fixed = normalizeCardData(old, { ...defaultCardData({ recipientName: "x", address: "sie", occasion: "danke" }), theme: old.theme as never, effects: old.effects as never });
  assert.equal(fixed.theme.style, "glass");
  assert.equal(fixed.effects.backdrop, "dots");
  assert.equal(fixed.effects.confettiShape, "strip");
});

test("design presets are self-consistent", () => {
  assert.equal(presetTheme("matrix").style, "terminal");
  assert.equal(presetEffects("matrix").backdrop, "matrix");
  assert.equal(presetEffects("blocks").confettiShape, "square");
  assert.equal(presetTheme("gibtsnicht").preset, "gold");
});

test("one example per design, all render", () => {
  assert.deepEqual(new Set(EXAMPLES.map((e) => e.preset)), new Set(Object.keys(PRESETS)));
  for (const e of EXAMPLES) assert.ok(renderCardHTML(exampleCard(e)).includes(e.list[0].replace(/[„“…]/g, "").slice(0, 8)));
});

test("relations get fitting emojis", () => {
  assert.equal(relationEmoji("Tochter"), "👧");
  assert.equal(relationEmoji("meine Oma"), "👵");
  assert.equal(relationEmoji("Lieblingsmensch"), "💛");
  assert.equal(relationEmoji(""), "💛");
});
