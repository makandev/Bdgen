export type Address = "du" | "sie";

export type Occasion = "geburtstag" | "danke" | "besserung" | "jubilaeum" | "einfach";

export interface Contact {
  id: string;
  name: string;
  relation: string;
  address: Address;
  occasion: Occasion;
  date: string;
  mood: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayText {
  title: string;
  text: string;
}

export interface GreetingScene {
  type: "greeting";
  eyebrow: string;
  morning: DayText;
  day: DayText;
  evening: DayText;
  note: string;
  button: string;
}

export interface TextScene {
  type: "text";
  eyebrow: string;
  title: string;
  paragraphs: string[];
  muted: string;
  button: string;
}

export interface QuizOption {
  label: string;
  reply: string;
  correct: boolean;
}

export interface QuizScene {
  type: "quiz";
  eyebrow: string;
  title: string;
  text: string;
  options: QuizOption[];
  button: string;
}

export interface ListScene {
  type: "list";
  eyebrow: string;
  title: string;
  items: string[];
  highlightLabel: string;
  highlight: string;
  button: string;
}

export interface CheckScene {
  type: "check";
  eyebrow: string;
  title: string;
  text: string;
  status: string;
  tiny: string;
  button: string;
}

export interface FinaleScene {
  type: "finale";
  eyebrow: string;
  title: string;
  quote: string;
  paragraphs: string[];
  signature: string;
  status: string;
  tiny: string;
  cinemaButton: string;
}

/** Gift reveal: a wrapped box that opens on tap. */
export interface GiftScene {
  type: "gift";
  eyebrow: string;
  title: string;
  teaser: string;
  gift: string;
  detail: string;
  button: string;
}

export type Scene = GreetingScene | TextScene | QuizScene | ListScene | CheckScene | GiftScene | FinaleScene;
export type SceneType = Scene["type"];

export interface Cinema {
  kicker: string;
  forLabel: string;
  title: string;
  final: string;
  emoji: string;
}

export type HeadingFont = "serif" | "sans" | "script" | "mono" | "block";

/** Shape of the card itself: soft glass, gold luxury, iridescent, hacker terminal or chunky blocks. */
export type CardStyle = "glass" | "luxe" | "holo" | "terminal" | "pixel";

/** Animated background layer. */
export type Backdrop = "dots" | "sparkle" | "matrix" | "blocks" | "aurora";

export type ConfettiShape = "strip" | "square" | "heart" | "star" | "glyph";

export interface Theme {
  preset: string;
  bg: string;
  bg2: string;
  card: string;
  text: string;
  text2: string;
  muted: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  cinemaBg: string;
  confetti: string[];
  headingFont: HeadingFont;
  style: CardStyle;
  dark: boolean;
}

export interface Effects {
  ambient: number;
  confetti: number;
  ribbons: number;
  sparks: boolean;
  orbit: boolean;
  shine: boolean;
  cinema: boolean;
  progress: boolean;
  clock: boolean;
  speed: number;
  backdrop: Backdrop;
  confettiShape: ConfettiShape;
}

export interface ReactionOption {
  emoji: string;
  label: string;
}

/** Reaction buttons the recipient sees at the end of the card. */
export interface Reactions {
  enabled: boolean;
  question: string;
  options: ReactionOption[];
}

/** How the texts were produced – used to learn which prompt works best. */
export interface GenMeta {
  variant?: string;
  provider?: string;
}

export interface CardData {
  recipientName: string;
  address: Address;
  occasion: Occasion;
  topLine: string;
  theme: Theme;
  effects: Effects;
  scenes: Scene[];
  cinema: Cinema;
  iosHint: boolean;
  reactions: Reactions;
  meta?: GenMeta;
}

export interface Reaction {
  id: string;
  cardId: string;
  emoji: string;
  label: string;
  message: string;
  createdAt: string;
}

/** The sender's rating of a card – feeds the learning. Never contains names or notes. */
export interface Rating {
  id: string;
  cardId: string;
  value: 1 | -1;
  reasons: string[];
  attempt: number;
  variant: string;
  provider: string;
  preset: string;
  occasion: Occasion;
  address: Address;
  relationGroup: string;
  mood: string[];
  /** Short excerpt of liked texts (with {{name}} placeholder) – only kept for 👍 and if allowed. */
  sample?: string;
  createdAt: string;
}

export interface Card {
  id: string;
  contactId: string | null;
  title: string;
  data: CardData;
  /** Server version only: short public link and whether it is active. */
  slug?: string;
  shared?: boolean;
  createdAt: string;
  updatedAt: string;
}
