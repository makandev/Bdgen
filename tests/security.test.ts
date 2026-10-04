import { test } from "node:test";
import assert from "node:assert/strict";
import { deflateSync, strToU8 } from "fflate";
import { extractJSON } from "../src/lib/ai";
import { EXAMPLES, exampleCard } from "../src/lib/examples";
import { renderCardHTML } from "../src/lib/render";
import { decodeCard, encodeCard, MAX_CARD_BYTES } from "../src/lib/share";
import { defaultCardData } from "../src/lib/templates";
import type { CardData } from "../src/lib/types";
import { normalizeCardData } from "../src/lib/validate";

// Attack collection: everything an attacker could put into a link, a backup or an AI answer.
// The card HTML must stay inert whatever arrives.

/** Small seeded random generator, so a failure can be reproduced. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

const PAYLOADS = [
  "<script>alert(1)</script>",
  "</script><script>alert(1)</script>",
  '"><img src=x onerror=alert(1)>',
  "' onmouseover='alert(1)",
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "</style><svg onload=alert(1)>",
  "<iframe src=https://evil.example>",
  "<a href=\"https://evil.example\">x</a>",
  "url(https://evil.example/x.png)",
  "expression(alert(1))",
  "@import 'https://evil.example/x.css';",
  "{{constructor.constructor('alert(1)')()}}",
  "\u2028\u2029</script>",
  "data:text/html,<script>alert(1)</script>",
  "<!--",
  "]]>",
  "&lt;script&gt;",
  "%3Cscript%3E",
  "<base href=https://evil.example/>",
  "<meta http-equiv=refresh content=0;url=https://evil.example>",
  "#ff0000;background:url(https://evil.example)",
  "red\" style=\"x",
];

const WEIRD: unknown[] = [null, undefined, 0, -1, 1e309, NaN, true, [], {}, [[["x"]]], { __proto__: { polluted: 1 } }, "x".repeat(100_000)];

/** Replaces values deep inside a card with attack strings and odd types. */
function mutate(v: unknown, r: () => number, depth = 0): unknown {
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  if (typeof v === "string") {
    const roll = r();
    if (roll < 0.45) return pick(PAYLOADS);
    if (roll < 0.6) return v + pick(PAYLOADS);
    if (roll < 0.68) return pick(WEIRD);
    return v;
  }
  if (typeof v === "number" || typeof v === "boolean") return r() < 0.2 ? pick([...WEIRD, ...PAYLOADS]) : v;
  if (Array.isArray(v)) {
    const out = v.map((x) => mutate(x, r, depth + 1));
    if (r() < 0.1) out.push(pick(PAYLOADS));
    return out;
  }
  if (v && typeof v === "object" && depth < 8) {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) o[k] = mutate(x, r, depth + 1);
    if (r() < 0.05) o[pick(["__proto__", "constructor", "onload", "style"])] = pick(PAYLOADS);
    return o;
  }
  return v;
}

/** The card page may only contain its own two scripts and no way to run or load anything else. */
function assertInert(html: string, label: string) {
  const scripts = html.match(/<script\b/gi) ?? [];
  assert.equal(scripts.length, 2, `${label}: only the two own <script> tags`);
  // The JSON block must not be able to close its own <script>.
  const cfg = /<script type="application\/json" id="cfg">([\s\S]*?)<\/script>/.exec(html)![1];
  assert.doesNotMatch(cfg, /<|\u2028|\u2029/, `${label}: config cannot break out`);
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  assert.doesNotMatch(styles, /url\(\s*['"]?\s*(https?:|\/\/|javascript:)|@import|expression\(|<\//i, `${label}: CSS loads nothing`);
  // Every tag outside the own scripts: allowed name, no event handlers, no script or outside URLs.
  const markup = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, "");
  for (const tag of markup.match(/<[a-zA-Z][^>]*>/g) ?? []) {
    const name = /^<([a-zA-Z0-9]+)/.exec(tag)![1].toLowerCase();
    assert.ok(!["script", "iframe", "object", "embed", "base", "link", "form", "frame", "svg", "math"].includes(name), `${label}: <${name}>`);
    for (const m of tag.matchAll(/\s([^\s=>]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g)) {
      const attr = m[1].toLowerCase();
      const value = (m[2] ?? "").replace(/^["']|["']$/g, "");
      assert.ok(!attr.startsWith("on"), `${label}: event handler ${attr} in ${tag.slice(0, 80)}`);
      assert.doesNotMatch(value, /[<>]/, `${label}: unescaped bracket in ${attr}`);
      if (["href", "src", "action", "formaction", "xlink:href", "srcset", "poster"].includes(attr)) {
        assert.match(value, /^(#|data:image\/|data:application\/pdf;base64,|$)/, `${label}: ${attr}=${value.slice(0, 60)}`);
      }
      if (attr === "style") assert.doesNotMatch(value, /url\(|expression|javascript:/i, `${label}: style attribute`);
      if (attr === "http-equiv") assert.equal(value, "Content-Security-Policy", `${label}: meta`);
    }
  }
}

const BASES: CardData[] = [
  defaultCardData({ recipientName: "Test", address: "du", occasion: "geburtstag" }),
  ...EXAMPLES.slice(0, 8).map((e) => exampleCard(e)),
];

test("fuzz: 3000 manipulated cards stay inert", () => {
  const r = rng(20261004);
  for (let i = 0; i < 3000; i++) {
    const base = BASES[i % BASES.length];
    const raw = mutate(JSON.parse(JSON.stringify(base)), r);
    const d = normalizeCardData(raw, base);
    assertInert(renderCardHTML(d), `card ${i}`);
    if (i % 10 === 0) assertInert(renderCardHTML(d, { reactUrl: "/api/react/x/", exportFile: true }), `card ${i} (server)`);
  }
});

test("fuzz: AI answers with attacks are cleaned the same way", () => {
  const r = rng(7);
  const base = BASES[0];
  for (let i = 0; i < 500; i++) {
    const answer = "Hier ist die Karte:\n```json\n" + JSON.stringify(mutate(JSON.parse(JSON.stringify(base)), r)) + "\n```";
    const d = normalizeCardData(extractJSON(answer), base);
    assertInert(renderCardHTML(d), `ai ${i}`);
  }
});

test("links: garbage, oversize and zip bombs are refused quickly", async () => {
  const r = rng(99);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=+/%<>\"' ";
  for (let i = 0; i < 1000; i++) {
    const len = Math.floor(r() * 400);
    let s = r() < 0.5 ? "1" : "0";
    for (let j = 0; j < len; j++) s += chars[Math.floor(r() * chars.length)];
    const d = await decodeCard(s);
    if (d) assertInert(renderCardHTML(d), `link ${i}`);
  }
  const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const t = Date.now();
  const bomb = "1" + b64(deflateSync(strToU8(`{"recipientName":"${"A".repeat(200_000_000)}"}`), { level: 9 }));
  assert.ok(bomb.length < 300_000, "the bomb itself is a short link");
  assert.equal(await decodeCard(bomb), null);
  assert.ok(Date.now() - t < 10_000, "stopped early");
  assert.equal(await decodeCard("0" + "A".repeat(MAX_CARD_BYTES * 2)), null);
  assert.equal(await decodeCard("1" + "A".repeat(400_000)), null);
  // Normal cards, also with a photo, still work.
  const ok = await encodeCard(BASES[1]);
  assert.deepEqual(await decodeCard(ok), BASES[1]);
});

test("prototype pollution through a link has no effect", async () => {
  const evil = '{"recipientName":"x","__proto__":{"polluted":1},"theme":{"__proto__":{"polluted":2}},"constructor":{"prototype":{"polluted":3}}}';
  const b64 = Buffer.from(evil).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await decodeCard("0" + b64);
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});
