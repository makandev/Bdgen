import { DEFAULT_EFFECTS, OCCASIONS, PRESETS } from "./presets";
import { blankScene, defaultReactions } from "./templates";
import type {
  Address, Backdrop, CardData, ParticleMotion, Particles, Voucher, ReactionOption, Reactions, CardStyle, Cinema, ConfettiShape, DayText, Effects, HeadingFont, Occasion, QuizOption, Scene,
  SceneType, Theme,
} from "./types";

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

const FONTS: HeadingFont[] = ["serif", "sans", "script", "mono", "block"];
const STYLES: CardStyle[] = ["glass", "luxe", "holo", "terminal", "pixel"];
const BACKDROPS: Backdrop[] = ["dots", "sparkle", "matrix", "blocks", "aurora", "fireworks"];
const MOTIONS: ParticleMotion[] = ["rise", "fall", "float", "swirl", "pop"];

/** Size caps for pictures inside a card (data URLs). */
export const MAX_IMAGE_CHARS = 1_600_000;
export const MAX_PDF_CHARS = 4_000_000;
const SHAPES: ConfettiShape[] = ["strip", "square", "heart", "star", "glyph"];

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

export function str(v: unknown, fallback = "", max = 2000): string {
  if (typeof v === "number") v = String(v);
  if (typeof v !== "string") return fallback;
  return v.replace(/\r\n?/g, "\n").slice(0, max);
}

function strList(v: unknown, fallback: string[], maxItems = 12, max = 2000): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.map((x) => str(x, "", max)).filter((x) => x.trim() !== "");
  return out.slice(0, maxItems);
}

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function color(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const s = v.trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(s)) return ("#" + [...s.slice(1)].map((c) => c + c).join("")).toLowerCase();
  return fallback;
}

export function address(v: unknown, fallback: Address = "du"): Address {
  return v === "sie" || v === "du" ? v : fallback;
}

export function occasion(v: unknown, fallback: Occasion = "geburtstag"): Occasion {
  return OCCASIONS.some((o) => o.id === v) ? (v as Occasion) : fallback;
}

const SCENE_TYPES: SceneType[] = ["greeting", "text", "quiz", "list", "check", "gift", "finale"];

function dayText(v: unknown, fb: DayText): DayText {
  const o = isObj(v) ? v : {};
  return { title: str(o.title, fb.title, 200), text: str(o.text, fb.text) };
}

export function normalizeScene(raw: unknown, addr: Address, forceType?: SceneType): Scene | null {
  if (!isObj(raw)) return null;
  const type = (forceType ?? raw.type) as SceneType;
  if (!SCENE_TYPES.includes(type)) return null;
  const fb = blankScene(type, addr);
  const o = raw;
  switch (type) {
    case "greeting": {
      const f = fb as Extract<Scene, { type: "greeting" }>;
      return {
        type,
        eyebrow: str(o.eyebrow, f.eyebrow, 120),
        morning: dayText(o.morning, f.morning),
        day: dayText(o.day, f.day),
        evening: dayText(o.evening, f.evening),
        note: str(o.note, f.note),
        button: str(o.button, f.button, 80),
      };
    }
    case "text": {
      const f = fb as Extract<Scene, { type: "text" }>;
      return {
        type,
        eyebrow: str(o.eyebrow, f.eyebrow, 120),
        title: str(o.title, f.title, 200),
        paragraphs: strList(o.paragraphs, f.paragraphs),
        muted: str(o.muted, ""),
        button: str(o.button, f.button, 80),
      };
    }
    case "quiz": {
      const f = fb as Extract<Scene, { type: "quiz" }>;
      let options: QuizOption[] = Array.isArray(o.options)
        ? o.options.filter(isObj).slice(0, 4).map((x) => ({
            label: str(x.label, "", 160),
            reply: str(x.reply, "", 300),
            correct: bool(x.correct, false),
          })).filter((x) => x.label.trim() !== "")
        : f.options;
      if (options.length < 2) options = f.options;
      if (!options.some((x) => x.correct)) options[options.length - 1].correct = true;
      return {
        type,
        eyebrow: str(o.eyebrow, f.eyebrow, 120),
        title: str(o.title, f.title, 200),
        text: str(o.text, f.text),
        options,
        button: str(o.button, f.button, 80),
      };
    }
    case "list": {
      const f = fb as Extract<Scene, { type: "list" }>;
      return {
        type,
        eyebrow: str(o.eyebrow, f.eyebrow, 120),
        title: str(o.title, f.title, 200),
        items: strList(o.items, f.items, 7, 200),
        highlightLabel: str(o.highlightLabel, f.highlightLabel, 80),
        highlight: str(o.highlight, f.highlight, 200),
        button: str(o.button, f.button, 80),
      };
    }
    case "check": {
      const f = fb as Extract<Scene, { type: "check" }>;
      return {
        type,
        eyebrow: str(o.eyebrow, f.eyebrow, 120),
        title: str(o.title, f.title, 200),
        text: str(o.text, f.text),
        status: str(o.status, f.status, 120),
        tiny: str(o.tiny, f.tiny, 200),
        button: str(o.button, f.button, 80),
      };
    }
    case "gift": {
      const f = fb as Extract<Scene, { type: "gift" }>;
      return {
        type,
        eyebrow: str(o.eyebrow, f.eyebrow, 120),
        title: str(o.title, f.title, 200),
        teaser: str(o.teaser, f.teaser, 200),
        gift: str(o.gift, f.gift, 160),
        detail: str(o.detail, f.detail, 1000),
        button: str(o.button, f.button, 80),
        voucher: normalizeVoucher(o.voucher),
      };
    }
    case "finale": {
      const f = fb as Extract<Scene, { type: "finale" }>;
      return {
        type,
        eyebrow: str(o.eyebrow, f.eyebrow, 120),
        title: str(o.title, f.title, 200),
        quote: str(o.quote, f.quote),
        paragraphs: strList(o.paragraphs, f.paragraphs),
        signature: str(o.signature, f.signature, 1000),
        status: str(o.status, f.status, 120),
        tiny: str(o.tiny, f.tiny, 200),
        cinemaButton: str(o.cinemaButton, f.cinemaButton, 80),
      };
    }
  }
}

function dataUrl(v: unknown, kind: RegExp, max: number): string {
  return typeof v === "string" && v.length <= max && kind.test(v) && /^[^,]+,[A-Za-z0-9+/=]+$/.test(v) ? v : "";
}

/**
 * PDFs can carry scripts, launch actions or attached files. Those never pass: only a plain PDF
 * (starts with %PDF, no active content) may be handed to the recipient as original.
 */
function plainPdf(url: string): string {
  return url && pdfIsPlain(url) ? url : "";
}

export function pdfIsPlain(dataUrl: string): boolean {
  try {
    const bin = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
    if (!bin.startsWith("%PDF-")) return false;
    // Names may be hex-escaped (#4A = J) – undo that before looking.
    const text = bin.replace(/#([0-9a-fA-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
    return !/\/(JavaScript|JS|Launch|EmbeddedFile|EmbeddedFiles|OpenAction|AA|RichMedia|XFA|SubmitForm|ImportData|GoToR|GoToE)\b/.test(text);
  } catch {
    return false;
  }
}

/** Voucher on a gift scene. Pictures must be real base64 data URLs – nothing that could load from elsewhere. */
export function normalizeVoucher(raw: unknown): Voucher | null {
  if (!isObj(raw)) return null;
  const image = dataUrl(raw.image, /^data:image\/(jpeg|png|webp);base64,/, MAX_IMAGE_CHARS);
  const code = str(raw.code, "", 120).trim();
  const kind = raw.kind === "image" && image ? "image" : code ? "code" : image ? "image" : null;
  if (!kind) return null;
  return {
    kind,
    label: str(raw.label, "", 120),
    code: kind === "code" ? code : "",
    image: kind === "image" ? image : "",
    pdf: kind === "image" ? plainPdf(dataUrl(raw.pdf, /^data:application\/pdf;base64,/, MAX_PDF_CHARS)) : "",
    note: str(raw.note, "", 240),
    show: bool(raw.show, true),
  };
}

/** AI effect recipe: only short symbol strings (no letters/markup), a known motion and bounded numbers. */
export function normalizeParticles(raw: unknown): Particles | null {
  if (!isObj(raw)) return null;
  const emoji = (Array.isArray(raw.emoji) ? raw.emoji : [])
    .map((e) => (typeof e === "string" ? e.trim() : ""))
    .filter((e) => e && e.length <= 8 && !/[A-Za-z0-9<>&"'\\]/.test(e))
    .slice(0, 5);
  if (!emoji.length) return null;
  return { emoji, motion: oneOf(raw.motion, MOTIONS, "float"), amount: num(raw.amount, 1, 0.2, 2), size: num(raw.size, 1, 0.5, 2) };
}

export const MAX_SCENES = 20;

export function normalizeScenes(raw: unknown, addr: Address, fallback: Scene[]): Scene[] {
  if (!Array.isArray(raw)) return fallback;
  let out = raw.map((s) => normalizeScene(s, addr)).filter((s): s is Scene => s !== null);
  // Too many pages: drop from the middle, never the finale at the end.
  if (out.length > MAX_SCENES) out = [...out.slice(0, MAX_SCENES - 1), out[out.length - 1]];
  return out.length ? out : fallback;
}

export function normalizeTheme(raw: unknown, fb: Theme): Theme {
  const o = isObj(raw) ? raw : {};
  const confetti = Array.isArray(o.confetti)
    ? o.confetti.map((c) => color(c, "")).filter(Boolean).slice(0, 8)
    : fb.confetti;
  return {
    preset: typeof o.preset === "string" && (PRESETS[o.preset] || o.preset === "custom") ? o.preset : fb.preset,
    bg: color(o.bg, fb.bg),
    bg2: color(o.bg2, fb.bg2),
    card: color(o.card, fb.card),
    text: color(o.text, fb.text),
    text2: color(o.text2, fb.text2),
    muted: color(o.muted, fb.muted),
    accent: color(o.accent, fb.accent),
    accentLight: color(o.accentLight, fb.accentLight),
    accentDark: color(o.accentDark, fb.accentDark),
    cinemaBg: color(o.cinemaBg, fb.cinemaBg),
    confetti: confetti.length ? confetti : fb.confetti,
    headingFont: oneOf(o.headingFont, FONTS, oneOf(fb.headingFont, FONTS, "serif")),
    style: oneOf(o.style, STYLES, oneOf(fb.style, STYLES, "glass")),
    dark: bool(o.dark, fb.dark),
  };
}

export function normalizeEffects(raw: unknown, fb: Effects = DEFAULT_EFFECTS): Effects {
  const o = isObj(raw) ? raw : {};
  return {
    ambient: num(o.ambient, fb.ambient, 0, 2),
    confetti: num(o.confetti, fb.confetti, 0, 2),
    ribbons: num(o.ribbons, fb.ribbons, 0, 2),
    sparks: bool(o.sparks, fb.sparks),
    orbit: bool(o.orbit, fb.orbit),
    shine: bool(o.shine, fb.shine),
    cinema: bool(o.cinema, fb.cinema),
    progress: bool(o.progress, fb.progress),
    clock: bool(o.clock, fb.clock),
    speed: num(o.speed, fb.speed, 0.5, 1.6),
    backdrop: oneOf(o.backdrop, BACKDROPS, oneOf(fb.backdrop, BACKDROPS, "dots")),
    confettiShape: oneOf(o.confettiShape, SHAPES, oneOf(fb.confettiShape, SHAPES, "strip")),
    particles: "particles" in o ? normalizeParticles(o.particles) : (fb.particles ?? null),
  };
}

export function normalizeCinema(raw: unknown, fb: Cinema): Cinema {
  const o = isObj(raw) ? raw : {};
  return {
    kicker: str(o.kicker, fb.kicker, 80),
    forLabel: str(o.forLabel, fb.forLabel, 40),
    title: str(o.title, fb.title, 120),
    final: str(o.final, fb.final, 160),
    emoji: str(o.emoji, fb.emoji, 16),
  };
}

export function normalizeReactions(raw: unknown, fb: Reactions): Reactions {
  const o = isObj(raw) ? raw : {};
  let options: ReactionOption[] = Array.isArray(o.options)
    ? o.options
        .filter(isObj)
        .map((x) => ({ emoji: str(x.emoji, "", 16).trim(), label: str(x.label, "", 40).trim() }))
        .filter((x) => x.emoji && x.label)
        .slice(0, 5)
    : fb.options;
  if (!options.length) options = fb.options;
  return { enabled: bool(o.enabled, fb.enabled), question: str(o.question, fb.question, 120), options };
}

export function normalizeCardData(raw: unknown, fb: CardData): CardData {
  const o = isObj(raw) ? raw : {};
  const a = address(o.address, fb.address);
  return {
    recipientName: str(o.recipientName, fb.recipientName, 80),
    address: a,
    occasion: occasion(o.occasion, fb.occasion),
    topLine: str(o.topLine, fb.topLine, 120),
    theme: normalizeTheme(o.theme, fb.theme),
    effects: normalizeEffects(o.effects, fb.effects),
    scenes: normalizeScenes(o.scenes, a, fb.scenes),
    cinema: normalizeCinema(o.cinema, fb.cinema),
    iosHint: bool(o.iosHint, fb.iosHint),
    reactions: normalizeReactions(o.reactions, fb.reactions ?? defaultReactions(occasion(o.occasion, fb.occasion), a)),
    ...(isObj(o.meta) ? { meta: { variant: str(o.meta.variant, "", 8), provider: str(o.meta.provider, "", 20) } } : fb.meta ? { meta: fb.meta } : {}),
  };
}

/** Ratings come from the client (or a backup) – keep only known, harmless fields. */
export function normalizeRating(raw: unknown): import("./types").Rating | null {
  if (!isObj(raw) || typeof raw.id !== "string" || typeof raw.cardId !== "string") return null;
  const value = raw.value === 1 ? 1 : raw.value === -1 ? -1 : null;
  if (!value) return null;
  return {
    id: str(raw.id, "", 64),
    cardId: str(raw.cardId, "", 64),
    value,
    reasons: Array.isArray(raw.reasons) ? raw.reasons.map((x) => str(x, "", 40)).filter(Boolean).slice(0, 8) : [],
    attempt: num(raw.attempt, 0, 0, 10),
    variant: str(raw.variant, "", 8),
    provider: str(raw.provider, "", 20),
    preset: str(raw.preset, "", 30),
    occasion: occasion(raw.occasion),
    address: address(raw.address),
    relationGroup: str(raw.relationGroup, "", 40),
    mood: Array.isArray(raw.mood) ? raw.mood.map((x) => str(x, "", 30)).filter(Boolean).slice(0, 8) : [],
    ...(typeof raw.sample === "string" && raw.sample.trim() ? { sample: str(raw.sample, "", 600) } : {}),
    createdAt: str(raw.createdAt, new Date().toISOString(), 40),
  };
}
