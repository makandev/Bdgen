import type { Backdrop, CardStyle, ConfettiShape, Effects, HeadingFont, Occasion, Theme } from "./types";

export const APP_NAME = "Funkelpost";

export const OCCASIONS: { id: Occasion; label: string; emoji: string }[] = [
  { id: "geburtstag", label: "Geburtstag", emoji: "🎂" },
  { id: "danke", label: "Dankeschön", emoji: "💛" },
  { id: "besserung", label: "Gute Besserung", emoji: "🌿" },
  { id: "jubilaeum", label: "Jubiläum", emoji: "🥂" },
  { id: "neujahr", label: "Silvester & Neujahr", emoji: "🎆" },
  { id: "einfach", label: "Einfach so", emoji: "✨" },
];

export const RELATION_GROUPS: { group: string; items: [string, string][] }[] = [
  {
    group: "Familie",
    items: [
      ["Mama", "👩"], ["Papa", "👨"], ["Tochter", "👧"], ["Sohn", "👦"], ["Baby", "👶"],
      ["Schwester", "👭"], ["Bruder", "👬"], ["Oma", "👵"], ["Opa", "👴"], ["Enkelin", "🧒"], ["Enkel", "🧒"],
      ["Tante", "💐"], ["Onkel", "🧔"], ["Cousine", "👯"], ["Cousin", "🤙"], ["Nichte", "🎀"], ["Neffe", "⚽"],
      ["Patenkind", "🌱"], ["Patentante", "🕊️"], ["Patenonkel", "🕊️"], ["Schwiegermutter", "🌷"], ["Schwiegervater", "🎩"],
      ["Stiefmama", "💞"], ["Stiefpapa", "💞"], ["Ehefrau", "💍"], ["Ehemann", "💍"], ["Partnerin", "❤️"], ["Partner", "❤️"],
      ["Uroma", "🧶"], ["Uropa", "🪑"],
    ],
  },
  {
    group: "Freunde & Nachbarn",
    items: [
      ["Beste Freundin", "👯‍♀️"], ["Bester Freund", "🤜"], ["Freundin", "🌸"], ["Freund", "🤝"], ["Kumpel", "🍻"],
      ["Mitbewohnerin", "🏠"], ["Mitbewohner", "🏠"], ["Nachbarin", "🏡"], ["Nachbar", "🏡"], ["Haustier", "🐶"],
    ],
  },
  {
    group: "Schule & Kita",
    items: [
      ["Lehrerin", "📚"], ["Lehrer", "📚"], ["Erzieherin", "🧸"], ["Erzieher", "🧸"], ["Klassenkameradin", "🎒"],
      ["Klassenkamerad", "🎒"], ["Trainerin", "🏅"], ["Trainer", "🏅"], ["Babysitterin", "🍼"],
    ],
  },
  {
    group: "Arbeit",
    items: [
      ["Kollegin", "💼"], ["Kollege", "💼"], ["Chefin", "👩‍💼"], ["Chef", "👨‍💼"], ["Team", "👥"], ["Azubi", "🌱"],
      ["Mentorin", "🧭"], ["Mentor", "🧭"], ["Kundin", "🤝"], ["Kunde", "🤝"],
    ],
  },
  {
    group: "Gesundheit & Alltag",
    items: [
      ["Ärztin", "🩺"], ["Arzt", "🩺"], ["Pflegerin", "💗"], ["Pfleger", "💗"], ["Therapeutin", "🌿"], ["Hebamme", "👶"],
      ["Friseurin", "✂️"], ["Postbotin", "📮"], ["Hausmeister", "🔧"],
    ],
  },
];

const RELATION_KEYWORDS: [RegExp, string][] = [
  [/oma|großmutter/i, "👵"], [/opa|großvater/i, "👴"], [/mama|mutter|mami|mutti/i, "👩"], [/papa|vater|papi|vati/i, "👨"],
  [/tochter/i, "👧"], [/sohn/i, "👦"], [/baby/i, "👶"], [/enkel/i, "🧒"], [/schwester/i, "👭"], [/bruder/i, "👬"],
  [/pate|patin/i, "🕊️"], [/ehe|frau|mann|partner|schatz|liebe/i, "❤️"], [/freund/i, "🤝"], [/kolleg|team|arbeit/i, "💼"],
  [/chef/i, "💼"], [/lehrer/i, "📚"], [/erzieh|kita/i, "🧸"], [/nachbar/i, "🏡"], [/arzt|ärzt|pfleg/i, "🩺"],
  [/hund|katze|tier/i, "🐾"],
];

export function relationEmoji(relation: string): string {
  const r = relation.trim().toLowerCase();
  if (!r) return "💛";
  for (const g of RELATION_GROUPS) for (const [name, emoji] of g.items) if (name.toLowerCase() === r) return emoji;
  for (const [re, emoji] of RELATION_KEYWORDS) if (re.test(r)) return emoji;
  return "💛";
}

export const MOODS = [
  "herzlich", "witzig", "frech", "feierlich", "berührend", "kurz & knapp", "verspielt", "dankbar", "cool", "kindgerecht",
];

export const NOTE_STARTERS = [
  "Gemeinsame Erinnerung: ",
  "Wofür ich dankbar bin: ",
  "Running Gag zwischen uns: ",
  "Was die Person ausmacht: ",
  "Was gerade nicht leicht ist: ",
  "Was ich ihr/ihm wünsche: ",
  "Kleine Macke, die ich mag: ",
  "Hobby / Lieblingsding: ",
];

export const STYLE_LABELS: Record<CardStyle, string> = {
  glass: "Glas",
  luxe: "Gold-Rahmen",
  holo: "Holo-Schimmer",
  terminal: "Terminal",
  pixel: "Blöcke",
};

export const BACKDROP_LABELS: Record<Backdrop, string> = {
  dots: "Lichtpunkte",
  sparkle: "Funkelsterne",
  matrix: "Zeichenregen",
  blocks: "Schwebende Blöcke",
  aurora: "Polarlicht",
  fireworks: "Feuerwerk",
};

export const CONFETTI_LABELS: Record<ConfettiShape, string> = {
  strip: "Streifen",
  square: "Quadrate",
  heart: "Herzen",
  star: "Sterne",
  glyph: "Zeichen",
};

export const FONT_LABELS: Record<HeadingFont, string> = {
  serif: "Klassisch",
  sans: "Modern",
  script: "Handschrift",
  mono: "Computer",
  block: "Kräftig",
};

type PresetDef = { label: string; hint: string; theme: Omit<Theme, "preset">; effects: Partial<Effects> };

export const DEFAULT_EFFECTS: Effects = {
  ambient: 1,
  confetti: 1,
  ribbons: 1,
  sparks: true,
  orbit: true,
  shine: true,
  cinema: true,
  progress: true,
  clock: true,
  speed: 1,
  backdrop: "dots",
  confettiShape: "strip",
  particles: null,
};

export const PRESETS: Record<string, PresetDef> = {
  gold: {
    label: "Gold-Eleganz",
    hint: "Das Original: warm, edel, golden",
    theme: {
      bg: "#fbf7ed", bg2: "#f1e4c8", card: "#fffdf6", text: "#342813", text2: "#4a3b22", muted: "#786b54",
      accent: "#b88a2d", accentLight: "#f4d98c", accentDark: "#8f681f", cinemaBg: "#49381b",
      confetti: ["#e8c56c", "#d6a842", "#f4d98c", "#fff1b5", "#b8892e"],
      headingFont: "serif", style: "glass", dark: false,
    },
    effects: {},
  },
  schwarzgold: {
    label: "Schwarz & Gold",
    hint: "Luxus pur: tiefschwarz mit Goldrahmen",
    theme: {
      bg: "#0b0906", bg2: "#1d170c", card: "#15110a", text: "#f8edd2", text2: "#e9dcbc", muted: "#b3a27c",
      accent: "#d8aa45", accentLight: "#ffe7a3", accentDark: "#8c6519", cinemaBg: "#3a2a0e",
      confetti: ["#ffe7a3", "#d8aa45", "#f5d27a", "#fff6d8", "#b8892e"],
      headingFont: "serif", style: "luxe", dark: true,
    },
    effects: { backdrop: "sparkle", confettiShape: "star", ribbons: 0.8 },
  },
  rosegold: {
    label: "Rosé-Gold",
    hint: "Zart glänzend mit Herzen",
    theme: {
      bg: "#fcf2ef", bg2: "#f0d8d0", card: "#fffaf8", text: "#3a2420", text2: "#55352f", muted: "#8e6e66",
      accent: "#c4826f", accentLight: "#f8d5c8", accentDark: "#93503f", cinemaBg: "#4a2620",
      confetti: ["#f8d5c8", "#e6a693", "#ffffff", "#f3d39a", "#c4826f"],
      headingFont: "script", style: "luxe", dark: false,
    },
    effects: { confettiShape: "heart", backdrop: "sparkle" },
  },
  holo: {
    label: "Holo-Glanz",
    hint: "Schillernd wie eine Seifenblase",
    theme: {
      bg: "#f5f3ff", bg2: "#e2f3ff", card: "#ffffff", text: "#24204a", text2: "#3b3668", muted: "#7a76a3",
      accent: "#8b7cff", accentLight: "#ffd3f4", accentDark: "#4f46c8", cinemaBg: "#2a1f63",
      confetti: ["#ff9ff3", "#7df9ff", "#a29bfe", "#ffeaa7", "#ffffff"],
      headingFont: "sans", style: "holo", dark: false,
    },
    effects: { backdrop: "aurora", confettiShape: "star" },
  },
  nacht: {
    label: "Sternennacht",
    hint: "Ruhig und magisch",
    theme: {
      bg: "#0e1430", bg2: "#1f2850", card: "#1a2246", text: "#f2f4ff", text2: "#d6dbf5", muted: "#9aa4cc",
      accent: "#9fb4ff", accentLight: "#e3e9ff", accentDark: "#5b70d6", cinemaBg: "#1d2a66",
      confetti: ["#c9d5ff", "#9fb4ff", "#ffffff", "#ffe7a3", "#7f95f0"],
      headingFont: "serif", style: "glass", dark: true,
    },
    effects: { ambient: 1.6, ribbons: 0.5, backdrop: "sparkle", confettiShape: "star" },
  },
  silvester: {
    label: "Silvester",
    hint: "Nachthimmel voller Feuerwerk",
    theme: {
      bg: "#070a1f", bg2: "#1a1240", card: "#121436", text: "#fff8ec", text2: "#e9e3f5", muted: "#a9a3c9",
      accent: "#ffcf5a", accentLight: "#fff0b8", accentDark: "#d88a1c", cinemaBg: "#1b1550",
      confetti: ["#ff4f8b", "#ffcf5a", "#4fd8ff", "#9b6bff", "#5dff9e", "#ffffff"],
      headingFont: "serif", style: "luxe", dark: true,
    },
    effects: { backdrop: "fireworks", confettiShape: "star", confetti: 1.4, ribbons: 1.1, ambient: 1.2 },
  },
  matrix: {
    label: "Matrix",
    hint: "Hacker-Look mit grünem Zeichenregen",
    theme: {
      bg: "#000a04", bg2: "#00180a", card: "#001108", text: "#c4ffd8", text2: "#9af5b9", muted: "#56b87c",
      accent: "#00ff66", accentLight: "#b6ffd2", accentDark: "#00a845", cinemaBg: "#002612",
      confetti: ["#00ff66", "#7dffaf", "#b6ffd2", "#00c853"],
      headingFont: "mono", style: "terminal", dark: true,
    },
    effects: { backdrop: "matrix", confettiShape: "glyph", ribbons: 0, orbit: false, ambient: 1.2 },
  },
  blocks: {
    label: "Block-Welt",
    hint: "Bunt und kantig – im Roblox-Stil",
    theme: {
      bg: "#dff0ff", bg2: "#b9dcff", card: "#ffffff", text: "#17171c", text2: "#2b2b33", muted: "#5d6070",
      accent: "#ffd23f", accentLight: "#fff3b8", accentDark: "#17171c", cinemaBg: "#13306b",
      confetti: ["#e2231a", "#ffd23f", "#2ecc71", "#2f80ed", "#ff8a00", "#9b51e0"],
      headingFont: "block", style: "pixel", dark: false,
    },
    effects: { backdrop: "blocks", confettiShape: "square", orbit: false, shine: false, ribbons: 0.6 },
  },
  neon: {
    label: "Neon-Party",
    hint: "Leuchtend wie im Club",
    theme: {
      bg: "#12042a", bg2: "#2c0b4d", card: "#1c0838", text: "#fbefff", text2: "#e8d6f5", muted: "#b39ccc",
      accent: "#ff3fd4", accentLight: "#8ff7ff", accentDark: "#7b22d9", cinemaBg: "#2b0a52",
      confetti: ["#ff3fd4", "#8ff7ff", "#fff35c", "#7dff8a", "#b67dff"],
      headingFont: "sans", style: "holo", dark: true,
    },
    effects: { backdrop: "aurora", confetti: 1.6, ribbons: 1.2 },
  },
  rose: {
    label: "Rosé-Pastell",
    hint: "Sanft und verspielt",
    theme: {
      bg: "#fdf4f5", bg2: "#f2dde5", card: "#fffafb", text: "#3b2530", text2: "#503641", muted: "#8b6e7a",
      accent: "#c47591", accentLight: "#f6cad8", accentDark: "#984766", cinemaBg: "#4d2234",
      confetti: ["#f6cad8", "#e79ab4", "#ffffff", "#f3d9a8", "#c47591"],
      headingFont: "script", style: "glass", dark: false,
    },
    effects: { ribbons: 0.8, confettiShape: "heart" },
  },
  party: {
    label: "Bunte Party",
    hint: "Fröhlich und laut",
    theme: {
      bg: "#fff8e8", bg2: "#ffe1ef", card: "#ffffff", text: "#2a2140", text2: "#3c3157", muted: "#7a6f94",
      accent: "#ff4f87", accentLight: "#ffd166", accentDark: "#6c4cf0", cinemaBg: "#3a1d6e",
      confetti: ["#ff4f87", "#ffd166", "#06d6a0", "#4cc9f0", "#7b5cff", "#ff9f1c"],
      headingFont: "sans", style: "glass", dark: false,
    },
    effects: { confetti: 1.8, ribbons: 1.6 },
  },
  salbei: {
    label: "Salbei & Natur",
    hint: "Ruhig, grün, erholsam",
    theme: {
      bg: "#f4f6ef", bg2: "#dde7d4", card: "#fbfcf8", text: "#253224", text2: "#364533", muted: "#6b7a67",
      accent: "#5d8a58", accentLight: "#cfe3c3", accentDark: "#3d6238", cinemaBg: "#1f3a22",
      confetti: ["#cfe3c3", "#9cc28f", "#f5e7b5", "#ffffff", "#5d8a58"],
      headingFont: "serif", style: "glass", dark: false,
    },
    effects: { confetti: 0.6, ribbons: 0.5 },
  },
  minimal: {
    label: "Schlicht",
    hint: "Klar und zurückhaltend",
    theme: {
      bg: "#f7f7f5", bg2: "#e9e9e6", card: "#ffffff", text: "#1d1d1f", text2: "#3a3a3d", muted: "#76767c",
      accent: "#4a4a50", accentLight: "#85858d", accentDark: "#1d1d1f", cinemaBg: "#202024",
      confetti: ["#d8d8dc", "#a9a9b0", "#ffffff", "#5b5b62"],
      headingFont: "sans", style: "glass", dark: false,
    },
    effects: { ambient: 0.4, confetti: 0.4, ribbons: 0, orbit: false, shine: false },
  },
};

export function presetTheme(id: string): Theme {
  const p = PRESETS[id] ?? PRESETS.gold;
  return { preset: PRESETS[id] ? id : "gold", ...p.theme, confetti: [...p.theme.confetti] };
}

export function presetEffects(id: string): Effects {
  const p = PRESETS[id] ?? PRESETS.gold;
  return { ...DEFAULT_EFFECTS, ...p.effects };
}

export function occasionLabel(o: Occasion): string {
  return OCCASIONS.find((x) => x.id === o)?.label ?? "Überraschung";
}
