import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseVariant, excerpt, learningStats, pickSamples, rankPresets, relationGroup, suggestPreset } from "../src/lib/learning";
import { answersToNotes, questionsFor } from "../src/lib/questions";
import { renderCardHTML } from "../src/lib/render";
import { defaultCardData, defaultReactions, giftScene, withGift } from "../src/lib/templates";
import type { Rating } from "../src/lib/types";
import { normalizeCardData, normalizeRating } from "../src/lib/validate";

const rating = (p: Partial<Rating>): Rating => ({
  id: Math.random().toString(36), cardId: "c", value: 1, reasons: [], attempt: 0, variant: "A", provider: "gemini",
  preset: "gold", occasion: "geburtstag", address: "du", relationGroup: "Familie", mood: [], createdAt: new Date().toISOString(), ...p,
});

test("writing style: alternates while data is thin, then prefers the better one", () => {
  assert.equal(chooseVariant([]), "A");
  assert.equal(chooseVariant([rating({ variant: "A" })]), "B");
  const many = [
    ...Array.from({ length: 6 }, () => rating({ variant: "A", value: -1 })),
    ...Array.from({ length: 6 }, () => rating({ variant: "B", value: 1 })),
  ];
  assert.equal(chooseVariant(many, () => 0.1), "B");
  assert.equal(chooseVariant(many, () => 0.95), "A");
});

test("design suggestion follows ratings, otherwise the relation", () => {
  assert.equal(suggestPreset("Oma", "geburtstag"), "gold");
  assert.equal(suggestPreset("Tochter", "geburtstag"), "party");
  assert.equal(suggestPreset("Kollegin", "besserung"), "salbei");
  const rs = [rating({ preset: "matrix", relationGroup: "Familie" }), rating({ preset: "matrix" }), rating({ preset: "gold", value: -1 })];
  assert.deepEqual(rankPresets(rs, "geburtstag", "Familie"), ["matrix"]);
  assert.equal(suggestPreset("Oma", "geburtstag", rs), "matrix");
  assert.equal(relationGroup("Tochter"), "Familie");
  assert.equal(relationGroup("meine Chefin"), "Arbeit");
});

test("style samples: only liked, same du/Sie, name removed", () => {
  const d = defaultCardData({ recipientName: "Lena", address: "du", occasion: "geburtstag" });
  const ex = excerpt(d);
  assert.ok(!ex.includes("Lena"));
  const rs = [rating({ sample: "gut", address: "du" }), rating({ sample: "förmlich", address: "sie" }), rating({ sample: "schlecht", value: -1 })];
  assert.deepEqual(pickSamples(rs, "geburtstag", "du"), ["gut"]);
  assert.equal(learningStats(rs).likes, 2);
});

test("quick questions fit the relation and never put the name into the AI notes", () => {
  assert.match(questionsFor("Tochter", "geburtstag")[0].q, /liebt/);
  assert.match(questionsFor("Oma", "besserung")[1].q, /wieder/);
  const notes = answersToNotes([{ q: "Was liebt {name} gerade total?", a: "Tanzen" }, { q: "x", a: "" }]);
  assert.equal(notes, "Was liebt die Person gerade total? Tanzen");
});

test("gift page sits before the finale and renders a box to unwrap", () => {
  const d = defaultCardData({ recipientName: "Max", address: "du", occasion: "geburtstag" });
  d.scenes = withGift(d.scenes, giftScene("du", "Konzertkarten"));
  const types = d.scenes.map((s) => s.type);
  assert.equal(types.indexOf("gift"), types.indexOf("finale") - 1);
  const html = renderCardHTML(d);
  assert.ok(html.includes("gift-wrap") && html.includes("Konzertkarten"));
  assert.equal(withGift(d.scenes, giftScene("du", "Buch")).filter((s) => s.type === "gift").length, 1);
});

test("reactions fit the situation and are escaped", () => {
  assert.equal(defaultReactions("besserung", "du").options[1].emoji, "💪");
  assert.equal(defaultReactions("geburtstag", "du", ["witzig"]).options[0].emoji, "😂");
  assert.match(defaultReactions("danke", "sie").question, /Ihnen/);
  const d = defaultCardData({ recipientName: "A", address: "du", occasion: "geburtstag" });
  d.reactions.options = [{ emoji: "<b>", label: '"><img src=x>' }];
  const html = renderCardHTML(d, { reactUrl: "/api/react/abc/" });
  assert.ok(!html.includes("<img src=x") && html.includes("/api/react/abc/"));
  const old = defaultCardData({ recipientName: "A", address: "sie", occasion: "danke" }) as unknown as Record<string, unknown>;
  delete old.reactions;
  assert.ok(renderCardHTML(old as never).includes("data-step"));
  assert.equal(normalizeCardData(old, defaultCardData({ recipientName: "A", address: "sie", occasion: "danke" })).reactions.enabled, true);
});

test("ratings from outside are validated", () => {
  assert.equal(normalizeRating({ id: "1", cardId: "c", value: 5 }), null);
  const r = normalizeRating({ id: "1", cardId: "c", value: -1, reasons: ["zu lang", 3], name: "Lena", notes: "geheim" });
  assert.ok(r && r.value === -1 && !("name" in r) && !("notes" in r));
});
