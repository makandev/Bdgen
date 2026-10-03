import { presetEffects, presetTheme } from "./presets";
import type { Address, CardData, Cinema, GiftScene, Occasion, ReactionOption, Reactions, Scene, SceneType } from "./types";

/** Picks the form from `[[Sie-Form|du-Form]]` markers. */
export function addr(text: string, address: Address): string {
  return text.replace(/\[\[([^|\]]*)\|([^\]]*)\]\]/g, (_, sie: string, du: string) => (address === "sie" ? sie : du));
}

function deep<T>(value: T, address: Address): T {
  if (typeof value === "string") return addr(value, address) as T;
  if (Array.isArray(value)) return value.map((v) => deep(v, address)) as T;
  if (value && typeof value === "object") {
    // Plain loop instead of Object.fromEntries: this also runs in the card viewer on old iPhones.
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value)) out[k] = deep((value as Record<string, unknown>)[k], address);
    return out as T;
  }
  return value;
}

interface OccasionWords {
  dayGreet: string;
  eveningGreet: string;
  quizRight: string;
  checkTitle: string;
  checkText: string;
  status: string;
  cinemaTitle: string;
  wish: string;
  signature: string;
  emoji: string;
}

const WORDS: Record<Occasion, OccasionWords> = {
  geburtstag: {
    dayGreet: "Einen schönen Geburtstag",
    eveningGreet: "Einen schönen Geburtstagsabend",
    quizRight: "Für einen richtig guten Geburtstag",
    checkTitle: "Geburtstagsprotokoll erfolgreich abgeschlossen.",
    checkText: "Alles Gute zum Geburtstag, {{name}}. [[Genießen Sie Ihren|Genieß deinen]] Tag und [[lassen Sie sich|lass dich]] heute einfach einmal feiern.",
    status: "Status: Geburtstag läuft",
    cinemaTitle: "Alles Gute\nzum Geburtstag.",
    wish: "Und für [[Ihr|dein]] neues Lebensjahr wünsche ich [[Ihnen|dir]] Gesundheit, viele gute Momente, Ruhe an den richtigen Stellen – und Menschen, die [[Ihnen|dir]] etwas von dem zurückgeben, was [[Sie|du]] selbst in [[Ihren|deinen]] Alltag [[einbringen|einbringst]].",
    signature: "Alles Gute zum Geburtstag, {{name}}. 🎂",
    emoji: "🎂",
  },
  danke: {
    dayGreet: "Hallo",
    eveningGreet: "Einen schönen Abend",
    quizRight: "Für einen Moment ganz für [[sich|dich]]",
    checkTitle: "Dankeschön-Protokoll erfolgreich abgeschlossen.",
    checkText: "Danke, {{name}}. [[Nehmen Sie sich|Nimm dir]] heute einfach einmal einen Moment nur für [[sich|dich]].",
    status: "Status: Dankbarkeit aktiv",
    cinemaTitle: "Danke.\nFür alles.",
    wish: "Ich wünsche [[Ihnen|dir]], dass genau das, was [[Sie|du]] anderen [[geben|gibst]], öfter und spürbar zu [[Ihnen|dir]] zurückkommt.",
    signature: "Von Herzen danke, {{name}}. 💛",
    emoji: "💛",
  },
  besserung: {
    dayGreet: "Hallo",
    eveningGreet: "Einen ruhigen Abend",
    quizRight: "Fürs Gesundwerden – sonst nichts",
    checkTitle: "Erholungsprotokoll erfolgreich gestartet.",
    checkText: "Gute Besserung, {{name}}. [[Lassen Sie sich|Lass dir]] Zeit – alles andere kann warten.",
    status: "Status: Erholung läuft",
    cinemaTitle: "Gute\nBesserung.",
    wish: "Ich wünsche [[Ihnen|dir]] Kraft, Geduld mit [[sich|dir]] selbst, viel Ruhe – und dass es jeden Tag ein kleines Stück besser wird.",
    signature: "Gute Besserung, {{name}}. 🌿",
    emoji: "🌿",
  },
  jubilaeum: {
    dayGreet: "Herzlichen Glückwunsch",
    eveningGreet: "Einen schönen Jubiläumsabend",
    quizRight: "Fürs Feiern dieses besonderen Tages",
    checkTitle: "Jubiläumsprotokoll erfolgreich abgeschlossen.",
    checkText: "Herzlichen Glückwunsch, {{name}}. [[Feiern Sie|Feier]] heute, was [[Sie|du]] geschafft [[haben|hast]].",
    status: "Status: Jubiläum läuft",
    cinemaTitle: "Herzlichen\nGlückwunsch.",
    wish: "Ich wünsche [[Ihnen|dir]], dass die nächsten Jahre mindestens so gut werden wie die, auf die [[Sie|du]] heute [[zurückblicken|zurückblickst]].",
    signature: "Herzlichen Glückwunsch, {{name}}. 🥂",
    emoji: "🥂",
  },
  neujahr: {
    dayGreet: "Frohes neues Jahr",
    eveningGreet: "Einen funkelnden Silvesterabend",
    quizRight: "Fürs Anstoßen auf ein richtig gutes Jahr",
    checkTitle: "Jahreswechsel-Protokoll erfolgreich abgeschlossen.",
    checkText: "Frohes neues Jahr, {{name}}. [[Starten Sie|Starte]] mit Rückenwind – der Rest ergibt sich.",
    status: "Status: Neues Jahr geladen",
    cinemaTitle: "Frohes\nneues Jahr.",
    wish: "Ich wünsche [[Ihnen|dir]] ein Jahr voller Gesundheit, Mut für Neues und vieler Momente, an die [[Sie|du]] gern [[zurückdenken|zurückdenkst]].",
    signature: "Auf ein großartiges Jahr, {{name}}. 🎆",
    emoji: "🎆",
  },
  einfach: {
    dayGreet: "Hallo",
    eveningGreet: "Einen schönen Abend",
    quizRight: "Fürs Durchatmen und Genießen",
    checkTitle: "Gute-Laune-Protokoll erfolgreich abgeschlossen.",
    checkText: "Einfach so, {{name}}. Weil es [[Sie|dich]] gibt.",
    status: "Status: Gute Laune läuft",
    cinemaTitle: "Einfach so.\nFür [[Sie|dich]].",
    wish: "Ich wünsche [[Ihnen|dir]] viele gute Momente, Ruhe an den richtigen Stellen – und öfter mal so eine kleine Überraschung.",
    signature: "Alles Liebe, {{name}}. ✨",
    emoji: "✨",
  },
};

export function defaultScenes(occasion: Occasion, address: Address): Scene[] {
  const w = WORDS[occasion] ?? WORDS.geburtstag;
  const scenes: Scene[] = [
    {
      type: "greeting",
      eyebrow: "",
      morning: {
        title: "Guten Morgen, {{name}}.",
        text: "Falls [[Sie|du]] das hier gerade beim ersten Kaffee [[öffnen|öffnest]]: Ja – jemand hat sich tatsächlich etwas mehr Mühe gegeben als „Alles Gute“.",
      },
      day: {
        title: `${w.dayGreet}, {{name}}.`,
        text: "[[Sie haben|Du hast]] die kleine Überraschung gefunden. Sie wartet tatsächlich schon seit Mitternacht auf [[Sie|dich]].",
      },
      evening: {
        title: `${w.eveningGreet}, {{name}}.`,
        text: "Bevor der Tag langsam zu Ende geht, wartet hier noch eine kleine Überraschung auf [[Sie|dich]].",
      },
      note: "Die Nachricht dazu wartet übrigens schon seit **00:00 Uhr** auf [[Sie|dich]]. 🙂",
      button: "Mal sehen, was das soll →",
    },
    {
      type: "text",
      eyebrow: "Kurzer Hinweis vorab",
      title: "Keine Sorge.",
      paragraphs: ["Das hier wird weder ein zehnseitiger Roman noch irgendeine peinliche Internet-Grußkarte."],
      muted: "Ein bisschen Mühe durfte es dann aber doch sein. 🙂",
      button: "Das beruhigt mich nur bedingt →",
    },
    {
      type: "quiz",
      eyebrow: "Kleine Sonderregelung · heute",
      title: "Wofür [[sind Sie|bist du]] heute zuständig?",
      text: "Eine kurze fachliche Prüfung. Bitte sorgfältig wählen.",
      options: [
        {
          label: "Probleme, Organisation & alles gleichzeitig",
          reply: "Das wäre die normale Antwort. Heute gilt allerdings eine Sonderregelung. 🙂",
          correct: false,
        },
        { label: w.quizRight, reply: "Richtig. Erstaunlich – direkt beim ersten Versuch. 🙂", correct: true },
      ],
      button: "Weiter →",
    },
    {
      type: "list",
      eyebrow: "Ergebnis der Prüfung",
      title: "Für heute offiziell gestrichen:",
      items: ["Die Probleme anderer Menschen", "„Ich brauche nur ganz kurz …“", "Unnötiger Stress", "Alles gleichzeitig im Blick haben"],
      highlightLabel: "Einzige Zuständigkeit",
      highlight: "[[Sich|Dich]] selbst nicht vergessen.",
      button: "Genehmigt →",
    },
    {
      type: "text",
      eyebrow: "Jetzt einmal ohne Spaß",
      title: "Manche Dinge sagt man im Alltag zu selten.",
      paragraphs: [
        "Ich schätze [[Ihre|deine]] Art und unseren Umgang miteinander wirklich sehr.",
        "Gerade wenn im Leben nicht alles selbstverständlich oder einfach ist, macht es einen Unterschied, Menschen zu begegnen, die einem mit **Respekt, Verständnis und Menschlichkeit** begegnen.",
        "Das ist etwas, das ich mit [[Ihnen|dir]] verbinde – und wofür ich [[Ihnen|dir]] heute einfach einmal **Danke** sagen möchte.",
      ],
      muted: "",
      button: "Noch eine Seite →",
    },
    {
      type: "check",
      eyebrow: "Fast geschafft",
      title: w.checkTitle,
      text: w.checkText,
      status: w.status,
      tiny: "Eigentlich wäre das jetzt ein völlig vernünftiges Ende.",
      button: "Fertig 🙂",
    },
    {
      type: "finale",
      eyebrow: "… eine Sache noch.",
      title: "Eine Sache wollte ich [[Ihnen|dir]] noch sagen.",
      quote: "Ich wünsche [[Ihnen|dir]] einen Tag, an dem möglichst wenig von [[Ihnen|dir]] verlangt und dafür umso mehr an [[Sie|dich]] gedacht wird.",
      paragraphs: [w.wish, "Und [[behalten Sie sich|behalte dir]] bitte genau diese besondere Art, mit Menschen umzugehen."],
      signature: `${w.signature}\n\n**Mit den besten Wünschen\nvon mir**`,
      status: "Jetzt aber wirklich fertig. 🙂",
      tiny: "Und nein: Diese Seite zerstört sich nicht selbst. [[Sie dürfen|Du darfst]] sie behalten. 🙂",
      cinemaButton: "Okay … eine allerletzte Sache ✨",
    },
  ];
  return deep(scenes, address);
}

export function defaultCinema(occasion: Occasion, address: Address): Cinema {
  const w = WORDS[occasion] ?? WORDS.geburtstag;
  return deep(
    {
      kicker: "Ein kleiner Nachtrag",
      forLabel: "Für",
      title: w.cinemaTitle,
      final: "Heute [[sind *Sie*|bist *du*]] mal dran.",
      emoji: w.emoji,
    },
    address,
  );
}

export function giftScene(address: Address, gift = ""): GiftScene {
  return deep(
    {
      type: "gift" as const,
      eyebrow: "Psst … da ist noch was",
      title: "Ganz ohne Geschenk geht es natürlich nicht.",
      teaser: "Tipp auf das Päckchen, um es auszupacken.",
      gift: gift.trim() || "Eine kleine Überraschung",
      detail: "[[Ich hoffe, Sie freuen sich|Ich hoffe, du freust dich]] – ausgesucht mit viel Liebe. 🎁",
      button: "Weiter →",
    },
    address,
  );
}

/** Puts a gift scene right before the finale (or replaces an existing one). */
export function withGift(scenes: Scene[], gift: GiftScene): Scene[] {
  const rest = scenes.filter((s) => s.type !== "gift");
  const at = rest.findIndex((s) => s.type === "finale");
  return at < 0 ? [...rest, gift] : [...rest.slice(0, at), gift, ...rest.slice(at)];
}

const REACTIONS: Record<Occasion, ReactionOption[]> = {
  geburtstag: [
    { emoji: "❤️", label: "Hab mich riesig gefreut" },
    { emoji: "🥹", label: "Bin ganz gerührt" },
    { emoji: "😂", label: "Musste so lachen" },
    { emoji: "🎉", label: "Lass uns feiern!" },
  ],
  danke: [
    { emoji: "❤️", label: "Von Herzen gern" },
    { emoji: "🥹", label: "Das rührt mich" },
    { emoji: "🙏", label: "Danke zurück" },
    { emoji: "😊", label: "Hat meinen Tag gemacht" },
  ],
  besserung: [
    { emoji: "❤️", label: "Danke, das tut gut" },
    { emoji: "💪", label: "Es geht bergauf" },
    { emoji: "🥹", label: "Bin gerührt" },
    { emoji: "🫶", label: "Fühl dich gedrückt" },
  ],
  jubilaeum: [
    { emoji: "❤️", label: "Wunderschön" },
    { emoji: "🥂", label: "Darauf stoßen wir an" },
    { emoji: "🥹", label: "Ganz gerührt" },
    { emoji: "😂", label: "Hab gelacht" },
  ],
  neujahr: [
    { emoji: "❤️", label: "Hab mich riesig gefreut" },
    { emoji: "🥂", label: "Prost aufs neue Jahr" },
    { emoji: "🎆", label: "Wow, das Feuerwerk!" },
    { emoji: "🥹", label: "Bin gerührt" },
  ],
  einfach: [
    { emoji: "❤️", label: "Hab mich so gefreut" },
    { emoji: "☀️", label: "Hat meinen Tag gerettet" },
    { emoji: "🥹", label: "Bin gerührt" },
    { emoji: "😂", label: "Musste lachen" },
  ],
};

/** Reaction buttons that fit the situation; a funny mood puts the laughing one first. */
export function defaultReactions(occasion: Occasion, address: Address, mood: string[] = []): Reactions {
  let options = [...(REACTIONS[occasion] ?? REACTIONS.geburtstag)];
  if (mood.some((m) => /witzig|frech|verspielt|cool/.test(m))) {
    const fun = options.find((o) => o.emoji === "😂");
    if (fun) options = [fun, ...options.filter((o) => o !== fun)];
  }
  return {
    enabled: true,
    question: address === "sie" ? "Wie gefällt Ihnen die Überraschung?" : "Wie gefällt dir die Überraschung?",
    options,
  };
}

export function blankScene(type: SceneType, address: Address): Scene {
  if (type === "gift") return giftScene(address);
  const base = defaultScenes("geburtstag", address);
  const found = base.find((s) => s.type === type);
  if (found) return JSON.parse(JSON.stringify(found)) as Scene;
  return base[1];
}

export function defaultCardData(opts: {
  recipientName: string;
  address: Address;
  occasion: Occasion;
  preset?: string;
}): CardData {
  const preset = opts.preset ?? "gold";
  return {
    recipientName: opts.recipientName,
    address: opts.address,
    occasion: opts.occasion,
    topLine: "Eine kleine Überraschung",
    theme: presetTheme(preset),
    effects: presetEffects(preset),
    scenes: defaultScenes(opts.occasion, opts.address),
    cinema: defaultCinema(opts.occasion, opts.address),
    iosHint: true,
    reactions: defaultReactions(opts.occasion, opts.address),
  };
}
