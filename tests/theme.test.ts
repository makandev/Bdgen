import { test } from "node:test";
import assert from "node:assert/strict";
import { contrast } from "../src/lib/color";
import { fixContrast } from "../src/lib/prompts";
import { presetTheme } from "../src/lib/presets";

test("light background with leftover dark card gets a readable light card", () => {
  const t = fixContrast({ ...presetTheme("nacht"), bg: "#e8f0ff", bg2: "#c9dafc" });
  assert.equal(t.dark, false);
  assert.ok(contrast(t.text2, t.card) >= 4.5);
});

test("every preset is readable", () => {
  for (const id of ["gold", "nacht", "rose", "party", "salbei", "minimal"]) {
    const t = presetTheme(id);
    assert.ok(contrast(t.text2, t.card) >= 4.5, id);
    assert.deepEqual(fixContrast(t), t, `${id} unchanged`);
  }
});
