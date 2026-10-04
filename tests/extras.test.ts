import { test } from "node:test";
import assert from "node:assert/strict";
import { withGenerated } from "../src/lib/cardbase";
import { exampleCard, EXAMPLES } from "../src/lib/examples";
import { hasVoucher, legacyInset, renderCardHTML } from "../src/lib/render";
import { restyleOffline } from "../src/lib/prompts";
import { decodeCard, encodeCard } from "../src/lib/share";
import { defaultCardData, giftScene, withGift } from "../src/lib/templates";
import type { GiftScene, Voucher } from "../src/lib/types";
import { normalizeCardData, normalizeParticles, normalizeVoucher } from "../src/lib/validate";
import { detectPlatform } from "../src/components/Install";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const code: Voucher = { kind: "code", label: "50 € Wellness", code: "SPA-1234", image: "", pdf: "", note: "bis 31.12.", show: true };

function withVoucher(v: Voucher | null) {
  const d = defaultCardData({ recipientName: "Alex", address: "du", occasion: "neujahr", preset: "silvester" });
  d.scenes = withGift(d.scenes, { ...giftScene("du", "Wellness-Tag"), voucher: v });
  return d;
}

test("vouchers only accept codes or real base64 pictures", () => {
  assert.deepEqual(normalizeVoucher(code), code);
  assert.equal(normalizeVoucher({ kind: "image", image: "https://example.com/x.png" }), null);
  assert.equal(normalizeVoucher({ kind: "image", image: "javascript:alert(1)" }), null);
  assert.equal(normalizeVoucher({ kind: "image", image: 'data:image/png;base64,AA" onerror="x' }), null);
  assert.equal(normalizeVoucher({ kind: "image", image: "data:image/svg+xml;base64,PHN2Zz4=" }), null);
  assert.equal(normalizeVoucher({ kind: "code", code: "   " }), null);
  const img = normalizeVoucher({ kind: "image", image: PNG, pdf: "data:text/html;base64,PGI+" })!;
  assert.equal(img.image, PNG);
  assert.equal(img.pdf, "", "only real PDFs may be attached");
  assert.equal(img.show, true, "the fireworks show is on by default");
});

test("voucher card renders the show, escapes the code and survives the share link", async () => {
  const d = withVoucher({ ...code, code: '<img src=x onerror="alert(1)">' });
  const html = renderCardHTML(d);
  assert.match(html, /id="vshow"/);
  assert.ok(!html.includes('<img src=x onerror'), "voucher code must be escaped");
  assert.match(html, /class="voucher" data-show="1"/);
  const back = await decodeCard(await encodeCard(d));
  const g = back!.scenes.find((s) => s.type === "gift") as GiftScene;
  assert.equal(g.voucher!.code, '<img src=x onerror="alert(1)">');

  const plain = renderCardHTML(withVoucher(null));
  assert.ok(!plain.includes('id="vshow"'), "no show without a voucher");
  const empty = withVoucher({ ...code, code: "" });
  assert.equal(hasVoucher(empty.scenes.find((s) => s.type === "gift")!), false);
  assert.ok(!renderCardHTML(empty).includes('class="voucher"'));
});

test("links made by the old CompressionStream version still open", async () => {
  const d = withVoucher(code);
  const raw = new TextEncoder().encode(JSON.stringify(d));
  const out = new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(out).arrayBuffer());
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  const legacy = "1" + btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  assert.deepEqual(await decodeCard(legacy), normalizeCardData(d, d));
});

test("new AI texts keep the voucher; examples never hand out their demo code", () => {
  const d = withVoucher(code);
  const fresh = withGift(defaultCardData({ recipientName: "Alex", address: "du", occasion: "neujahr" }).scenes, giftScene("du", "Neu"));
  const merged = withGenerated(d, { scenes: fresh, cinema: d.cinema, topLine: "x", reactions: d.reactions, variant: "A", provider: "gemini" });
  assert.deepEqual((merged.scenes.find((s) => s.type === "gift") as GiftScene).voucher, code);

  const ex = EXAMPLES.find((e) => e.voucher)!;
  assert.ok(hasVoucher(exampleCard(ex).scenes.find((s) => s.type === "gift")!), "gallery shows the voucher");
});

test("AI effect recipes are bounded and contain no markup or words", () => {
  assert.deepEqual(normalizeParticles({ emoji: ["🎈", "<b>", "balloon", "❄️"], motion: "rise", amount: 9, size: 0.1 }), {
    emoji: ["🎈", "❄️"], motion: "rise", amount: 2, size: 0.5,
  });
  assert.equal(normalizeParticles({ emoji: ["abc"] }), null);
  assert.equal(normalizeParticles({ emoji: ["⚽"], motion: "explode" })!.motion, "float");
  const d = defaultCardData({ recipientName: "Alex", address: "du", occasion: "geburtstag" });
  const r = restyleOffline(d, "Ballons, die aufsteigen");
  assert.equal(r.effects.particles!.motion, "rise");
  assert.equal(restyleOffline(d, "Silvester mit Feuerwerk").effects.backdrop, "fireworks");
  assert.match(renderCardHTML({ ...d, effects: r.effects }), /id="pfx"/);
});

test("cards avoid CSS that old iPhones do not understand", () => {
  assert.equal(legacyInset(".a{position:fixed;inset:0}"), ".a{position:fixed;top:0;right:0;bottom:0;left:0}");
  assert.equal(legacyInset(".b{inset:-70% -35%}"), ".b{top:-70%;right:-35%;bottom:-70%;left:-35%}");
  assert.equal(legacyInset(".c{box-shadow:inset 0 1px 0 #fff}"), ".c{box-shadow:inset 0 1px 0 #fff}");
  for (const ex of EXAMPLES) {
    const css = renderCardHTML(exampleCard(ex)).split("<style>")[1].split("</style>")[0];
    assert.ok(!/[;{\s]inset:/.test(css), `${ex.id} still uses inset:`);
  }
});

test("install help picks the right instructions per device", () => {
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
  assert.equal(detectPlatform(iphone), "ios-safari");
  assert.equal(detectPlatform(iphone.replace("Version/18.2", "CriOS/140.0")), "ios-other");
  assert.equal(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0 Mobile/15E148 Safari/604.1"), "ios-old");
  assert.equal(detectPlatform(iphone + " Instagram 300.0"), "inapp");
  const ipad = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15";
  assert.equal(detectPlatform(ipad, 5, "MacIntel"), "ios-safari", "iPadOS pretends to be a Mac");
  assert.equal(detectPlatform(ipad, 0, "MacIntel"), "mac-safari");
  assert.equal(detectPlatform("Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36"), "android-samsung");
  assert.equal(detectPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36"), "inapp");
  assert.equal(detectPlatform("Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0"), "android-firefox");
  assert.equal(detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0"), "desktop-firefox");
});

test("the card script is valid JavaScript for every design", () => {
  for (const ex of EXAMPLES) {
    const html = renderCardHTML(exampleCard(ex));
    const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    assert.ok(js.length, ex.id);
    for (const code of js) assert.doesNotThrow(() => new Function(code), `${ex.id}: card script does not parse`);
  }
});

test("rewriting all texts keeps a gift page the AI left out", () => {
  const d = withVoucher(code);
  const noGift = defaultCardData({ recipientName: "Alex", address: "du", occasion: "neujahr" }).scenes;
  const merged = withGenerated(d, { scenes: noGift, cinema: d.cinema, topLine: "x", reactions: d.reactions, variant: "A", provider: "gemini" });
  const g = merged.scenes.find((s) => s.type === "gift") as GiftScene;
  assert.ok(g, "gift page still there");
  assert.deepEqual(g.voucher, code);
  assert.equal(merged.scenes[merged.scenes.length - 1].type, "finale", "finale stays last");
});

test("too many pages never drop the finale", () => {
  const d = defaultCardData({ recipientName: "Alex", address: "du", occasion: "geburtstag" });
  const many = [...Array(25)].map(() => d.scenes[1]).concat(d.scenes[d.scenes.length - 1]);
  const n = normalizeCardData({ ...d, scenes: many }, d);
  assert.equal(n.scenes.length, 20);
  assert.equal(n.scenes[19].type, "finale");
});
