import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJSON } from "../src/lib/ai";
import { fmt, renderCardHTML } from "../src/lib/render";
import { addr, defaultCardData } from "../src/lib/templates";
import { normalizeCardData } from "../src/lib/validate";

test("du/Sie markers resolve", () => {
  assert.equal(addr("[[Sie haben|Du hast]] es", "sie"), "Sie haben es");
  assert.equal(addr("[[Sie haben|Du hast]] es", "du"), "Du hast es");
});

test("fmt escapes HTML before applying markup", () => {
  const out = fmt("**Hi** {{name}} <script>alert(1)</script>", "<b>X</b>");
  assert.equal(out, "<strong>Hi</strong> &lt;b&gt;X&lt;/b&gt; &lt;script&gt;alert(1)&lt;/script&gt;");
});

test("rendered card contains no raw user HTML and cannot break out of the config script", () => {
  const d = defaultCardData({ recipientName: "</script><img src=x onerror=alert(1)>", address: "du", occasion: "geburtstag" });
  d.scenes[0] = { ...d.scenes[0], note: '"><svg onload=alert(2)>' } as typeof d.scenes[0];
  const html = renderCardHTML(d);
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes("<svg onload"));
  assert.equal(html.match(/<\/script>/g)?.length, 2);
});

test("all templates render for every occasion and address", () => {
  for (const occasion of ["geburtstag", "danke", "besserung", "jubilaeum", "einfach"] as const) {
    for (const address of ["du", "sie"] as const) {
      const d = defaultCardData({ recipientName: "Testperson", address, occasion });
      const html = renderCardHTML(d);
      assert.ok(!html.includes("[["), `${occasion}/${address} has unresolved marker`);
      assert.ok(html.includes('data-step="7"'));
    }
  }
});

test("normalizeCardData drops junk and clamps values", () => {
  const fb = defaultCardData({ recipientName: "A", address: "du", occasion: "geburtstag" });
  const out = normalizeCardData(
    { theme: { bg: "red", accent: "#ABC" }, effects: { confetti: 99, speed: -3 }, scenes: [{ type: "evil" }, { type: "text", title: "Hallo" }] },
    fb,
  );
  assert.equal(out.theme.bg, fb.theme.bg);
  assert.equal(out.theme.accent, "#aabbcc");
  assert.equal(out.effects.confetti, 2);
  assert.equal(out.effects.speed, 0.5);
  assert.equal(out.scenes.length, 1);
  assert.equal(out.scenes[0].type, "text");
});

test("extractJSON handles fences, prose and trailing commas", () => {
  assert.deepEqual(extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJSON('Hier: {"a":[1,2,],} fertig'), { a: [1, 2] });
});

test("the original card's personal names are nowhere in the source", async () => {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const walk = (d: string): string[] =>
    readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const forbidden = ["gro" + "sche", "02. okt" + "ober"];
  for (const f of [...walk("src"), "README.md"]) {
    const s = readFileSync(f, "utf8").toLowerCase();
    for (const w of forbidden) assert.ok(!s.includes(w), `${f} contains a name from the original file`);
  }
});
