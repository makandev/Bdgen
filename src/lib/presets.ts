import type { Effects, Occasion, Theme } from "./types";

export const OCCASIONS: { id: Occasion; label: string; emoji: string }[] = [
  { id: "geburtstag", label: "Geburtstag", emoji: "🎂" },
  { id: "danke", label: "Dankeschön", emoji: "💛" },
  { id: "besserung", label: "Gute Besserung", emoji: "🌿" },
  { id: "jubilaeum", label: "Jubiläum", emoji: "🥂" },
  { id: "einfach", label: "Einfach so", emoji: "✨" },
];

export const RELATIONS = [
  "Mutter", "Vater", "Schwester", "Bruder", "Oma", "Opa", "Tante", "Onkel",
  "Cousine", "Cousin", "Partner/in", "Freundin", "Freund", "Kollegin", "Kollege",
  "Chefin", "Chef", "Nachbarin", "Nachbar", "Lehrerin", "Lehrer",
];

export const MOODS = [
  "herzlich", "witzig", "frech", "feierlich", "berührend", "kurz & knapp", "verspielt", "dankbar",
];

export const NOTE_STARTERS = [
  "Gemeinsame Erinnerung: ",
  "Wofür ich dankbar bin: ",
  "Running Gag zwischen uns: ",
  "Was die Person ausmacht: ",
  "Was gerade nicht leicht ist: ",
  "Was ich ihr/ihm wünsche: ",
  "Kleine Macke, die ich mag: ",
];

type PresetDef = { label: string; theme: Omit<Theme, "preset">; effects: Partial<Effects> };

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
};

export const PRESETS: Record<string, PresetDef> = {
  gold: {
    label: "Gold-Eleganz",
    theme: {
      bg: "#fbf7ed", bg2: "#f1e4c8", card: "#fffdf6", text: "#342813", text2: "#4a3b22", muted: "#786b54",
      accent: "#b88a2d", accentLight: "#f4d98c", accentDark: "#8f681f", cinemaBg: "#49381b",
      confetti: ["#e8c56c", "#d6a842", "#f4d98c", "#fff1b5", "#b8892e"],
      headingFont: "serif", dark: false,
    },
    effects: {},
  },
  nacht: {
    label: "Sternennacht",
    theme: {
      bg: "#0e1430", bg2: "#1f2850", card: "#1a2246", text: "#f2f4ff", text2: "#d6dbf5", muted: "#9aa4cc",
      accent: "#9fb4ff", accentLight: "#e3e9ff", accentDark: "#5b70d6", cinemaBg: "#1d2a66",
      confetti: ["#c9d5ff", "#9fb4ff", "#ffffff", "#ffe7a3", "#7f95f0"],
      headingFont: "serif", dark: true,
    },
    effects: { ambient: 1.6, ribbons: 0.5 },
  },
  rose: {
    label: "Rosé-Pastell",
    theme: {
      bg: "#fdf4f5", bg2: "#f2dde5", card: "#fffafb", text: "#3b2530", text2: "#503641", muted: "#8b6e7a",
      accent: "#c47591", accentLight: "#f6cad8", accentDark: "#984766", cinemaBg: "#4d2234",
      confetti: ["#f6cad8", "#e79ab4", "#ffffff", "#f3d9a8", "#c47591"],
      headingFont: "script", dark: false,
    },
    effects: { ribbons: 0.8 },
  },
  party: {
    label: "Bunte Party",
    theme: {
      bg: "#fff8e8", bg2: "#ffe1ef", card: "#ffffff", text: "#2a2140", text2: "#3c3157", muted: "#7a6f94",
      accent: "#ff4f87", accentLight: "#ffd166", accentDark: "#6c4cf0", cinemaBg: "#3a1d6e",
      confetti: ["#ff4f87", "#ffd166", "#06d6a0", "#4cc9f0", "#7b5cff", "#ff9f1c"],
      headingFont: "sans", dark: false,
    },
    effects: { confetti: 1.8, ribbons: 1.6 },
  },
  salbei: {
    label: "Salbei & Natur",
    theme: {
      bg: "#f4f6ef", bg2: "#dde7d4", card: "#fbfcf8", text: "#253224", text2: "#364533", muted: "#6b7a67",
      accent: "#5d8a58", accentLight: "#cfe3c3", accentDark: "#3d6238", cinemaBg: "#1f3a22",
      confetti: ["#cfe3c3", "#9cc28f", "#f5e7b5", "#ffffff", "#5d8a58"],
      headingFont: "serif", dark: false,
    },
    effects: { confetti: 0.6, ribbons: 0.5 },
  },
  minimal: {
    label: "Schlicht",
    theme: {
      bg: "#f7f7f5", bg2: "#e9e9e6", card: "#ffffff", text: "#1d1d1f", text2: "#3a3a3d", muted: "#76767c",
      accent: "#4a4a50", accentLight: "#85858d", accentDark: "#1d1d1f", cinemaBg: "#202024",
      confetti: ["#d8d8dc", "#a9a9b0", "#ffffff", "#5b5b62"],
      headingFont: "sans", dark: false,
    },
    effects: { ambient: 0.4, confetti: 0.4, ribbons: 0, orbit: false, shine: false },
  },
};

export function presetTheme(id: string): Theme {
  const p = PRESETS[id] ?? PRESETS.gold;
  return { preset: PRESETS[id] ? id : "gold", ...structuredClone(p.theme) };
}

export function presetEffects(id: string): Effects {
  const p = PRESETS[id] ?? PRESETS.gold;
  return { ...DEFAULT_EFFECTS, ...p.effects };
}

export function occasionLabel(o: Occasion): string {
  return OCCASIONS.find((x) => x.id === o)?.label ?? "Überraschung";
}
