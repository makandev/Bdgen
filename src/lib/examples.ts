import { defaultCardData, giftScene, withGift } from "./templates";
import type { Address, CardData, Occasion, Scene, Voucher } from "./types";

export interface Example {
  id: string;
  title: string;
  relation: string;
  preset: string;
  occasion: Occasion;
  address: Address;
  name: string;
  /** Short description of the kind of notes that led to this card. */
  notes: string;
  greeting: string;
  list: string[];
  highlight: string;
  heartfelt: string[];
  quote: string;
  /** Optional gift page, optionally with a voucher. */
  gift?: string;
  voucher?: Voucher;
}

/** Demo cards for the gallery – texts written the way the AI would turn notes into a card. */
export const EXAMPLES: Example[] = [
  {
    id: "oma", title: "Für Oma zum 80.", relation: "Oma", preset: "gold", occasion: "geburtstag", address: "du", name: "Oma Gisela",
    notes: "backt den besten Apfelkuchen · erzählt Geschichten von früher",
    greeting: "Bevor der erste Besuch klingelt und der Kuchen angeschnitten wird: Hier wartet noch etwas auf dich.",
    list: ["Den Kuchen selbst backen", "Allen Kaffee nachschenken", "Aufräumen, bevor jemand kommt", "Dir Sorgen um uns machen"],
    highlight: "Heute bekommst du das größte Stück.",
    heartfelt: ["Bei dir hat es immer nach Apfelkuchen und nach Zuhause gerochen.", "Deine Geschichten von früher kennen wir fast auswendig – und wollen sie trotzdem jedes Mal wieder hören."],
    quote: "Ich wünsche dir einen Tag voller Lieblingsmenschen, Kuchenduft und Geschichten, die du heute ausnahmsweise mal erzählt bekommst.",
  },
  {
    id: "papa", title: "Für Papa vom Sohn", relation: "Papa", preset: "blocks", occasion: "geburtstag", address: "du", name: "Papa",
    notes: "repariert alles mit Panzertape · spielt heimlich Videospiele",
    greeting: "Neues Level freigeschaltet! Drück den Knopf, um deinen Geburtstags-Bonus abzuholen.",
    list: ["Den Rasen mähen", "Den Drucker der Nachbarn reparieren", "Panzertape-Notfälle", "Früh ins Bett gehen"],
    highlight: "Heute gewinnst du jedes Spiel. Versprochen.",
    heartfelt: ["Du kannst einfach alles reparieren – zur Not mit Panzertape.", "Danke, dass du immer Zeit für eine Runde mit mir hast, auch wenn du müde bist."],
    quote: "Ich wünsche dir ein Jahr mit unendlich vielen Leben, keinen Bugs und ganz viel Zeit zum Zocken.",
  },
  {
    id: "tochter", title: "Für die Tochter zum 16.", relation: "Tochter", preset: "neon", occasion: "geburtstag", address: "du", name: "Lena",
    notes: "tanzt überall · hat dieses Jahr viel geschafft",
    greeting: "Sweet Sixteen! Mach die Musik laut – heute ist dein Tag.",
    list: ["Zimmer aufräumen", "Hausaufgaben", "Um zehn zu Hause sein (fast)", "Sich über Mama und Papa aufregen"],
    highlight: "Heute nur tanzen.",
    heartfelt: ["Dieses Jahr war nicht immer leicht – und du hast es trotzdem gerockt.", "Wir sind unfassbar stolz auf dich. Auch wenn wir das peinlich oft sagen."],
    quote: "Ich wünsche dir, dass du nie aufhörst zu tanzen – egal, wer zuschaut.",
  },
  {
    id: "kollegin", title: "Dankeschön an die Kollegin", relation: "Kollegin", preset: "schwarzgold", occasion: "danke", address: "sie", name: "Frau Muster",
    notes: "hat in der stressigsten Woche den Überblick behalten",
    greeting: "Für alle, die im größten Trubel ruhig bleiben: eine kleine Auszeichnung.",
    list: ["Die fünfte Rückfrage am Tag", "Telefonkonferenzen ohne Ende", "Alles gleichzeitig im Blick haben", "Überstunden"],
    highlight: "Heute nur: zurücklehnen.",
    heartfelt: ["In der stressigsten Woche des Jahres haben Sie den Überblick behalten – und dabei noch ein Lächeln für alle übrig gehabt.", "Das ist nicht selbstverständlich. Danke dafür."],
    quote: "Ich wünsche Ihnen, dass alles, was Sie für andere tun, doppelt zu Ihnen zurückkommt.",
  },
  {
    id: "bruder", title: "Für den Bruder (Gamer)", relation: "Bruder", preset: "matrix", occasion: "geburtstag", address: "du", name: "Max",
    notes: "programmiert nachts · trinkt zu viel Energy",
    greeting: "System-Update erkannt: {{name}}.exe wird heute ein Jahr älter. Installation starten?",
    list: ["Bugs fixen", "Updates installieren", "Vor 3 Uhr ins Bett", "Energydrinks zählen"],
    highlight: "Einzige Aufgabe: Spaß.exe ausführen",
    heartfelt: ["Du bist der Einzige, der mir jeden Computer-Unsinn erklärt, ohne genervt zu sein.", "Bester Bruder. Kein Bug, sondern Feature."],
    quote: "Ich wünsche dir ein Jahr ohne Abstürze, mit schnellem Internet und genug Schlaf zwischendurch.",
  },
  {
    id: "partnerin", title: "Jahrestag mit der Partnerin", relation: "Partnerin", preset: "rosegold", occasion: "jubilaeum", address: "du", name: "Schatz",
    notes: "5 Jahre zusammen · erster Urlaub am Meer",
    greeting: "Fünf Jahre. Und ich würde jeden Tag davon nochmal genauso wählen.",
    list: ["Streit um die Fernbedienung", "Wer den Müll rausbringt", "Pläne für morgen", "Das Handy"],
    highlight: "Heute gibt es nur uns zwei.",
    heartfelt: ["Weißt du noch, unser erster Urlaub am Meer? Der Sonnenbrand, das Lachen, das falsche Hotel?", "Mit dir wird selbst Chaos schön."],
    quote: "Ich wünsche uns noch ganz viele Jahre voller Meer, Lachen und falscher Hotels.",
  },
  {
    id: "freund", title: "Einfach so für den besten Freund", relation: "Bester Freund", preset: "holo", occasion: "einfach", address: "du", name: "Tim",
    notes: "war da, als es mir schlecht ging",
    greeting: "Kein Geburtstag, kein Anlass – nur eine Nachricht, weil du sie verdient hast.",
    list: ["Gründe für schlechte Laune", "Montagsblues", "Grübeln", "Absagen"],
    highlight: "Heute: einfach wissen, dass du toll bist.",
    heartfelt: ["Als es mir schlecht ging, warst du einfach da. Ohne viele Worte, ohne Fragen.", "So einen Freund hat nicht jeder. Ich schon."],
    quote: "Ich wünsche dir, dass du dich heute so gesehen fühlst, wie du es für andere tust.",
  },
  {
    id: "lehrerin", title: "Danke an die Lehrerin", relation: "Lehrerin", preset: "rose", occasion: "danke", address: "sie", name: "Frau Sonnenschein",
    notes: "Abschied nach der 4. Klasse · hat an alle geglaubt",
    greeting: "Vier Jahre, unzählige Fragen und ganz viel Geduld – hier kommt ein großes Dankeschön.",
    list: ["Hausaufgaben kontrollieren", "Zum dritten Mal erklären", "Streit schlichten", "Elternabende"],
    highlight: "Heute nur: sich feiern lassen.",
    heartfelt: ["Sie haben an jedes Kind geglaubt – auch an die, die selbst noch nicht an sich geglaubt haben.", "Das werden wir nie vergessen."],
    quote: "Ich wünsche Ihnen viele neue Klassen, die Sie so lieben wie wir Sie.",
  },
  {
    id: "tante", title: "Gute Besserung für die Tante", relation: "Tante", preset: "salbei", occasion: "besserung", address: "du", name: "Tante Ute",
    notes: "liegt nach der OP im Krankenhaus · liebt ihren Garten",
    greeting: "Eine kleine Portion frische Luft aus dem Garten – direkt ans Krankenbett.",
    list: ["Unkraut jäten", "Für alle kochen", "Sich Sorgen machen", "Zu früh wieder aufstehen"],
    highlight: "Einzige Aufgabe: gesund werden.",
    heartfelt: ["Dein Garten wartet auf dich – und wir auch.", "Lass dir Zeit. Die Tomaten wachsen auch ohne dich, versprochen."],
    quote: "Ich wünsche dir jeden Tag ein kleines Stück mehr Kraft – und bald wieder Erde an den Händen.",
  },
  {
    id: "mama", title: "Für Mama, einfach so", relation: "Mama", preset: "nacht", occasion: "einfach", address: "du", name: "Mama",
    notes: "ist immer für alle da · vergisst sich selbst",
    greeting: "Heute Abend, wenn alle schlafen, ist das hier nur für dich.",
    list: ["An alles denken", "Für alle da sein", "Als Letzte schlafen gehen", "Sich selbst vergessen"],
    highlight: "Heute denkt mal jemand an dich.",
    heartfelt: ["Du bist immer die, die an alle denkt.", "Heute möchte ich einfach mal sagen: Ich sehe das. Und ich hab dich lieb."],
    quote: "Ich wünsche dir einen Abend, an dem du nichts musst – und ganz viel darfst.",
  },
  {
    id: "team", title: "Für das ganze Team", relation: "Team", preset: "party", occasion: "danke", address: "du", name: "Team",
    notes: "großes Projekt geschafft",
    greeting: "Projekt abgeschlossen. Zeit für Konfetti!",
    list: ["Deadlines", "Nachtschichten", "Kaffee als Hauptmahlzeit", "Der Drucker"],
    highlight: "Heute: feiern.",
    heartfelt: ["Was ihr in den letzten Wochen gestemmt habt, war riesig.", "Ohne euch hätte das niemand geschafft."],
    quote: "Ich wünsche euch ein Wochenende ohne Mails und mit ganz viel Stolz auf euch selbst.",
  },
  {
    id: "silvester", title: "Silvester für die Clique", relation: "Freunde", preset: "silvester", occasion: "neujahr", address: "du", name: "ihr Lieben",
    notes: "feiern jedes Jahr zusammen · Brunch am Neujahrsmorgen ist Tradition",
    greeting: "Bevor um Mitternacht die Raketen steigen: Hier ist schon mal das erste Feuerwerk – nur für euch.",
    list: ["Vorsätze aufschreiben", "Bis zwölf wach bleiben", "Bleigießen deuten", "Am 1. Januar früh aufstehen"],
    highlight: "Einziger Vorsatz: mehr Zeit mit euch.",
    heartfelt: ["Mit euch war dieses Jahr laut, chaotisch und wunderschön.", "Egal was das neue bringt – wir stoßen gemeinsam darauf an."],
    quote: "Ich wünsche euch ein Jahr voller Lachen, Abenteuer und Abende wie diesen.",
    gift: "Neujahrs-Brunch für alle",
    voucher: { kind: "code", label: "Brunch am 1. Januar", code: "NEUJAHR-BRUNCH", image: "", pdf: "", note: "Einlösbar bei mir in der Küche · ab 11 Uhr 🥐", show: true },
  },
  {
    id: "nachbar", title: "Danke an den Nachbarn", relation: "Nachbar", preset: "minimal", occasion: "danke", address: "sie", name: "Herr Weber",
    notes: "hat im Urlaub die Blumen gegossen",
    greeting: "Ein kleines, schlichtes Dankeschön von nebenan.",
    list: ["Blumen gießen", "Pakete annehmen", "Den Briefkasten leeren", "Nach dem Rechten sehen"],
    highlight: "Heute: einfach genießen.",
    heartfelt: ["Dank Ihnen hat unser Balkon den Urlaub überlebt – die Geranien sind begeistert.", "Gute Nachbarn sind Gold wert."],
    quote: "Ich wünsche Ihnen einen ruhigen Tag – diesmal kümmern wir uns.",
  },
];

export function exampleCard(e: Example): CardData {
  const d = defaultCardData({ recipientName: e.name, address: e.address, occasion: e.occasion, preset: e.preset });
  d.scenes = d.scenes.map((s): Scene => {
    if (s.type === "greeting") return { ...s, day: { ...s.day, text: e.greeting }, morning: { ...s.morning, text: e.greeting }, evening: { ...s.evening, text: e.greeting } };
    if (s.type === "list") return { ...s, items: e.list, highlight: e.highlight };
    if (s.type === "text" && s.paragraphs.length > 1) return { ...s, paragraphs: e.heartfelt };
    if (s.type === "finale") return { ...s, quote: e.quote };
    return s;
  });
  if (e.gift) d.scenes = withGift(d.scenes, { ...giftScene(e.address, e.gift), voucher: e.voucher ?? null });
  return d;
}
