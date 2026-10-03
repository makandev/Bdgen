import type { Occasion } from "./types";

export interface Question {
  /** Use {name} for the person – it is replaced for display and removed before anything goes to the AI. */
  q: string;
  hints: string[];
}

const BANK: { test: RegExp; questions: [Question, Question] }[] = [
  {
    test: /tochter|sohn|baby|enkel|nichte|neffe|patenkind|klassenkamerad/,
    questions: [
      { q: "Was liebt {name} gerade total?", hints: ["Tanzen", "Fußball", "Videospiele", "Tiere", "Malen", "Musik", "Lesen"] },
      { q: "Worauf bist du bei {name} besonders stolz?", hints: ["ist so hilfsbereit", "hat viel Neues gelernt", "ist mutig", "bringt alle zum Lachen"] },
    ],
  },
  {
    test: /oma|opa|uroma|uropa|großmutter|großvater/,
    questions: [
      { q: "Was ist typisch {name}?", hints: ["backt den besten Kuchen", "erzählt Geschichten von früher", "hat immer Süßigkeiten", "werkelt im Garten"] },
      { q: "Was möchtest du {name} schon lange mal sagen?", hints: ["Danke für alles", "Du bist mein Vorbild", "Bei dir fühle ich mich zuhause"] },
    ],
  },
  {
    test: /mama|papa|mutter|vater|stief|schwieger/,
    questions: [
      { q: "Wofür bist du {name} dankbar?", hints: ["ist immer für mich da", "hat mir so viel beigebracht", "glaubt an mich", "hält die Familie zusammen"] },
      { q: "Was bringt {name} zum Lachen?", hints: ["schlechte Witze", "Familienchaos", "alte Fotos", "Tanzen in der Küche"] },
    ],
  },
  {
    test: /partner|ehefrau|ehemann|schatz/,
    questions: [
      { q: "Euer schönster gemeinsamer Moment?", hints: ["unser erster Urlaub", "der erste Kuss", "unsere Hochzeit", "ein ganz normaler Sonntag"] },
      { q: "Was liebst du an {name}?", hints: ["das Lachen", "die Ruhe", "wie wir uns ohne Worte verstehen", "die verrückten Ideen"] },
    ],
  },
  {
    test: /kolleg|chef|team|azubi|mentor|kund/,
    questions: [
      { q: "Was schätzt du an {name}?", hints: ["immer hilfsbereit", "behält den Überblick", "sorgt für gute Laune", "bleibt ruhig im Stress"] },
      { q: "Gibt es einen Moment, an den du gern denkst?", hints: ["das große Projekt", "die Weihnachtsfeier", "der Kaffee am Morgen", "als wir zusammen gelacht haben"] },
    ],
  },
  {
    test: /lehrer|erzieh|trainer|babysitter/,
    questions: [
      { q: "Wofür möchtest du {name} danken?", hints: ["viel Geduld", "hat an uns geglaubt", "tolle Ausflüge", "immer ein offenes Ohr"] },
      { q: "Was war das Schönste?", hints: ["die Klassenfahrt", "das Sommerfest", "jeden Tag Spaß", "die vielen Lieder"] },
    ],
  },
  {
    test: /freund|schwester|bruder|cousin|kumpel|mitbewohn|nachbar/,
    questions: [
      { q: "Worüber lacht ihr immer?", hints: ["alte Insider", "peinliche Geschichten", "Serien", "unser Chaos"] },
      { q: "Was macht {name} besonders?", hints: ["immer ehrlich", "da, wenn es drauf ankommt", "verrückt im besten Sinne", "hört gut zu"] },
    ],
  },
];

const FALLBACK: [Question, Question] = [
  { q: "Was zeichnet {name} aus?", hints: ["herzlich", "hilfsbereit", "lustig", "zuverlässig"] },
  { q: "Was möchtest du {name} sagen?", hints: ["Danke", "Schön, dass es dich gibt", "Alles Gute"] },
];

/** One or two friendly questions that fit the relation and the occasion. */
export function questionsFor(relation: string, occasion: Occasion): [Question, Question] {
  const r = relation.toLowerCase();
  const [q1, q2] = BANK.find((b) => b.test.test(r))?.questions ?? FALLBACK;
  if (occasion === "besserung") {
    return [q1, { q: "Was soll {name} bald wieder machen können?", hints: ["im Garten werkeln", "mit uns essen gehen", "Sport machen", "einfach ausschlafen"] }];
  }
  if (occasion === "danke") return [{ q: "Wofür möchtest du {name} danke sagen?", hints: ["für die Hilfe", "fürs Zuhören", "für die schöne Zeit", "einfach für alles"] }, q1];
  if (occasion === "jubilaeum") return [{ q: "Worauf blickst du gern zurück?", hints: ["die ersten Jahre", "gemeinsame Reisen", "was wir geschafft haben", "das viele Lachen"] }, q2];
  if (occasion === "neujahr") return [{ q: "Was wünschst du {name} fürs neue Jahr?", hints: ["mehr Zeit für sich", "Gesundheit", "ein großes Abenteuer", "dass Träume wahr werden"] }, q2];
  return [q1, q2];
}

export function showQuestion(q: string, name: string): string {
  return q.replace(/\{name\}/g, name.trim() || "die Person");
}

/** Notes for the AI: question + answer, with the name replaced so it never leaves the device. */
export function answersToNotes(pairs: { q: string; a: string }[]): string {
  return pairs
    .filter((p) => p.a.trim())
    .map((p) => `${showQuestion(p.q, "die Person")} ${p.a.trim()}`)
    .join("\n");
}
