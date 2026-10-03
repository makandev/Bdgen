import { PRESETS, RELATION_GROUPS } from "./presets";
import { VARIANTS } from "./prompts";
import type { Address, CardData, Occasion, Rating } from "./types";

export const MAX_RETRIES = 2;

export const DISLIKE_REASONS = [
  "zu lang", "zu kurz", "zu kitschig", "zu förmlich", "zu locker", "nicht witzig genug", "zu albern",
  "passt nicht zur Person", "zu allgemein", "Design gefällt nicht",
];

export function relationGroup(relation: string): string {
  const r = relation.trim().toLowerCase();
  for (const g of RELATION_GROUPS) if (g.items.some(([n]) => n.toLowerCase() === r)) return g.group;
  if (/oma|opa|mama|papa|mutter|vater|tochter|sohn|enkel|schwester|bruder|tante|onkel|cousin|nichte|neffe|pate|ehe|partner/.test(r)) return "Familie";
  if (/freund|kumpel|nachbar/.test(r)) return "Freunde & Nachbarn";
  if (/kolleg|chef|team|azubi|kund/.test(r)) return "Arbeit";
  if (/lehrer|erzieh|trainer|klasse/.test(r)) return "Schule & Kita";
  return "Sonstige";
}

/** A short, name-free excerpt of the texts – used as a style example for future cards. */
export function excerpt(d: CardData, max = 500): string {
  const parts: string[] = [];
  for (const s of d.scenes) {
    if (s.type === "greeting") parts.push(s.day.text);
    if (s.type === "list") parts.push(s.items.slice(0, 3).join(" / "));
    if (s.type === "text" && s.paragraphs.length > 1) parts.push(...s.paragraphs.slice(0, 2));
    if (s.type === "finale" && s.quote) parts.push(s.quote);
  }
  const name = d.recipientName.trim();
  let text = parts.join(" · ").replace(/\*\*/g, "");
  if (name) text = text.split(name).join("{{name}}");
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

const rate = (likes: number, dislikes: number) => (likes + 1) / (likes + dislikes + 2);

/** Picks the writing style: alternate until both have some ratings, then mostly the better one. */
export function chooseVariant(ratings: Rating[], random = Math.random): string {
  const ids = Object.keys(VARIANTS);
  const score = ids.map((v) => {
    const rs = ratings.filter((r) => r.variant === v && r.attempt === 0);
    return { v, n: rs.length, p: rate(rs.filter((r) => r.value > 0).length, rs.filter((r) => r.value < 0).length) };
  });
  if (score.some((x) => x.n < 5)) return score.sort((a, b) => a.n - b.n)[0].v;
  score.sort((a, b) => b.p - a.p);
  return random() < 0.85 ? score[0].v : score[1].v;
}

/** Designs ordered by how well they were rated in a similar situation. */
export function rankPresets(ratings: Rating[], occasion: Occasion, group: string): string[] {
  const score = new Map<string, number>();
  for (const r of ratings) {
    if (!PRESETS[r.preset]) continue;
    const w = (r.occasion === occasion ? 1.5 : 1) * (r.relationGroup === group ? 2 : 1);
    score.set(r.preset, (score.get(r.preset) ?? 0) + w * r.value);
  }
  return [...score.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

const BY_RELATION: [RegExp, string][] = [
  [/oma|opa|uroma|uropa|großmutter|großvater/, "gold"],
  [/tochter|sohn|baby|enkel|nichte|neffe|patenkind|klassenkamerad|haustier|team/, "party"],
  [/partner|ehefrau|ehemann|schatz/, "rosegold"],
  [/papa|vater|chef|kolleg|mentor|kund|schwiegervater|onkel/, "schwarzgold"],
  [/mama|mutter|tante|patentante|schwiegermutter|stiefmama/, "rose"],
  [/bruder|cousin|kumpel/, "neon"],
  [/freund|schwester|cousine/, "holo"],
  [/lehrer|erzieh|trainer|babysitter/, "rose"],
  [/arzt|ärzt|pfleg|therapeut|hebamme|nachbar/, "salbei"],
];

/** Design suggestion: what worked best before, otherwise a sensible default for the relation. */
export function suggestPreset(relation: string, occasion: Occasion, ratings: Rating[] = []): string {
  const ranked = rankPresets(ratings, occasion, relationGroup(relation));
  if (ranked.length) return ranked[0];
  if (occasion === "besserung") return "salbei";
  const r = relation.toLowerCase();
  for (const [re, preset] of BY_RELATION) if (re.test(r)) return preset;
  return occasion === "jubilaeum" ? "schwarzgold" : "gold";
}

export function suggestMood(relation: string): string[] {
  const g = relationGroup(relation);
  const r = relation.toLowerCase();
  if (/tochter|sohn|baby|enkel|nichte|neffe|patenkind|klassenkamerad/.test(r)) return ["verspielt", "kindgerecht", "herzlich"];
  if (/partner|ehe|schatz/.test(r)) return ["herzlich", "berührend"];
  if (g === "Arbeit") return ["herzlich", "kurz & knapp"];
  if (g === "Freunde & Nachbarn") return ["witzig", "herzlich"];
  return ["herzlich", "witzig"];
}

/** Liked excerpts with the same du/Sie form, preferring the same occasion. */
export function pickSamples(ratings: Rating[], occasion: Occasion, address: Address, n = 2): string[] {
  return ratings
    .filter((r) => r.value > 0 && r.sample && r.address === address)
    .sort((a, b) => Number(b.occasion === occasion) - Number(a.occasion === occasion) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, n)
    .map((r) => r.sample!);
}

export interface LearningStats {
  total: number;
  likes: number;
  dislikes: number;
  presets: { preset: string; likes: number; dislikes: number }[];
  variants: { variant: string; likes: number; dislikes: number }[];
  reasons: [string, number][];
  retriesSaved: number;
}

export function learningStats(ratings: Rating[]): LearningStats {
  const count = <K extends string>(key: (r: Rating) => K) => {
    const m = new Map<K, { likes: number; dislikes: number }>();
    for (const r of ratings) {
      const e = m.get(key(r)) ?? { likes: 0, dislikes: 0 };
      if (r.value > 0) e.likes++;
      else e.dislikes++;
      m.set(key(r), e);
    }
    return [...m.entries()].sort((a, b) => rate(b[1].likes, b[1].dislikes) - rate(a[1].likes, a[1].dislikes));
  };
  const reasons = new Map<string, number>();
  for (const r of ratings) for (const x of r.reasons) reasons.set(x, (reasons.get(x) ?? 0) + 1);
  return {
    total: ratings.length,
    likes: ratings.filter((r) => r.value > 0).length,
    dislikes: ratings.filter((r) => r.value < 0).length,
    presets: count((r) => r.preset).map(([preset, v]) => ({ preset, ...v })),
    variants: count((r) => r.variant || "Vorlage").map(([variant, v]) => ({ variant, ...v })),
    reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    retriesSaved: ratings.filter((r) => r.value > 0 && r.attempt > 0).length,
  };
}
