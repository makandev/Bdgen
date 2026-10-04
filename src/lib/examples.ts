import { defaultCardData, giftScene, withGift } from "./templates";
import type { Address, CardData, Occasion, Particles, Scene, Voucher } from "./types";

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
  /** Optional effect recipe (what the AI can invent), e.g. rising balloons. */
  particles?: Particles;
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
    id: "silvester", title: "Silvester mit der besten Freundin", relation: "Beste Freundin", preset: "silvester", occasion: "neujahr", address: "du", name: "Jana",
    notes: "feiern jedes Jahr zusammen · Brunch am Neujahrsmorgen ist unsere Tradition",
    greeting: "Bevor um Mitternacht die Raketen steigen: Hier ist schon mal das erste Feuerwerk – nur für dich.",
    list: ["Vorsätze, die bis zum 3. Januar halten", "Bleigießen-Diskussionen", "Wunderkerzen-Panik", "Am 1. Januar früh aufstehen"],
    highlight: "Einziger Vorsatz: noch mehr Zeit mit dir.",
    heartfelt: ["Mit dir war dieses Jahr laut, chaotisch und wunderschön.", "Egal, was das neue bringt – wir stoßen gemeinsam darauf an."],
    quote: "Ich wünsche dir ein Jahr voller Lachen, Abenteuer und Abende wie unsere Silvesternächte.",
    gift: "Neujahrs-Brunch zu zweit",
    voucher: { kind: "code", label: "Brunch am 1. Januar", code: "NEUJAHR-BRUNCH", image: "", pdf: "", note: "Einlösbar bei mir in der Küche · ab 11 Uhr 🥐", show: true },
  },
  {
    id: "enkel", title: "Für den Enkel zum 10.", relation: "Enkel", preset: "party", occasion: "geburtstag", address: "du", name: "Paul",
    notes: "liebt Dinosaurier · baut die höchsten Lego-Türme",
    greeting: "Zehn Jahre! Das ist so alt wie … na ja, nicht ganz so alt wie ein Dinosaurier. Aber fast!",
    list: ["Zähne putzen (nur heute!)", "Aufräumen", "Gemüse essen", "Früh ins Bett"],
    highlight: "Heute: der höchste Lego-Turm aller Zeiten.",
    heartfelt: ["Wenn du mir von Dinosauriern erzählst, lerne ich jedes Mal etwas Neues.", "Opa und ich sind so stolz auf dich – und ein bisschen neidisch auf deine Lego-Türme."],
    quote: "Ich wünsche dir ein Jahr voller Abenteuer, mutiger Ideen und Türme, die bis zum Himmel reichen.",
    particles: { emoji: ["🎈", "🎈", "🦕"], motion: "rise", amount: 1.2, size: 1.2 },
  },
  {
    id: "schwiegermutter", title: "Danke an die Schwiegermutter", relation: "Schwiegermutter", preset: "salbei", occasion: "danke", address: "sie", name: "Frau Berger",
    notes: "hat während des Umzugs die Kinder genommen · bester Rhabarberkuchen",
    greeting: "Ein Dankeschön, so leicht wie ein Schmetterling – aber mit ganz viel Gewicht.",
    list: ["Kartons schleppen", "Kinder trösten", "Für alle kochen", "Nein sagen"],
    highlight: "Heute: Füße hochlegen.",
    heartfelt: ["Während des Umzugs hatten Sie die Kinder – und die Kinder hatten die schönste Woche des Jahres.", "Ohne Sie hätten wir das nie so entspannt geschafft."],
    quote: "Ich wünsche Ihnen ganz viele ruhige Nachmittage – mit Kaffee, Rhabarberkuchen und ohne einen einzigen Karton.",
    particles: { emoji: ["🦋"], motion: "float", amount: 1, size: 1 },
  },
  {
    id: "kumpel", title: "Gute Besserung für den Kumpel", relation: "Kumpel", preset: "neon", occasion: "besserung", address: "du", name: "Jonas",
    notes: "Bänderriss beim Fußball · kann nicht stillsitzen",
    greeting: "Abpfiff für ein paar Wochen – aber das Rückspiel gewinnen wir.",
    list: ["Elfmeter schießen", "Treppen steigen", "Auf dem Sofa ungeduldig werden", "Krücken-Rennen"],
    highlight: "Einzige Aufgabe: Fuß hoch.",
    heartfelt: ["Ohne dich ist das Training nur halb so laut – und halb so lustig.", "Nimm dir die Zeit. Wir halten deinen Platz im Sturm frei."],
    quote: "Ich wünsche dir schnelle Heilung, gute Serien und ganz bald wieder Rasen unter den Füßen.",
    particles: { emoji: ["⚽"], motion: "pop", amount: 1, size: 1 },
  },
  {
    id: "schwester", title: "Winterpost für die Schwester", relation: "Schwester", preset: "nacht", occasion: "einfach", address: "du", name: "Sophie",
    notes: "wohnt jetzt weit weg · wir telefonieren jeden Sonntag",
    greeting: "Draußen ist es kalt – hier kommt etwas Warmes aus der Ferne.",
    list: ["Die Entfernung", "Funklöcher beim Telefonieren", "Zu wenig Zeit", "Heimweh"],
    highlight: "Heute: Tee, Decke und an uns denken.",
    heartfelt: ["Seit du weggezogen bist, sind unsere Sonntagstelefonate mein Lieblingstermin der Woche.", "Egal, wie weit weg: Du bist immer die Erste, der ich alles erzähle."],
    quote: "Ich wünsche dir warme Socken, gute Nachbarn und das Gefühl, dass Zuhause nie weit weg ist.",
    particles: { emoji: ["❄️", "❅", "✦"], motion: "fall", amount: 1.5, size: 0.9 },
  },
  {
    id: "patenkind", title: "Für das Patenkind zum 6.", relation: "Patenkind", preset: "rose", occasion: "geburtstag", address: "du", name: "Mia",
    notes: "liebt Tiere · will Tierärztin werden",
    greeting: "Sechs Jahre alt! Weißt du, wer sich darüber am meisten freut? Ich – und alle Tiere im Zoo.",
    list: ["Schuhe zubinden üben", "Aufräumen", "Leise sein", "Warten"],
    highlight: "Heute: Geburtstagskrone tragen.",
    heartfelt: ["Wie du dich um jedes kleine Tier kümmerst, finde ich ganz besonders.", "Ich bin so froh, deine Patentante zu sein."],
    quote: "Ich wünsche dir ein Jahr voller Tiere, Lachen und kleiner Wunder.",
    gift: "Ein Tag im Zoo – nur wir zwei",
    voucher: { kind: "code", label: "Zoo-Tag mit mir", code: "ZOO-MIA-6", image: "", pdf: "", note: "Du suchst den Tag aus 🦒", show: true },
    particles: { emoji: ["🌸", "🌷", "💮"], motion: "swirl", amount: 1.2, size: 1 },
  },
  {
    id: "chef", title: "25 Jahre im Betrieb", relation: "Chef", preset: "gold", occasion: "jubilaeum", address: "sie", name: "Herr Albers",
    notes: "25-jähriges Firmenjubiläum · kennt jede Maschine beim Namen",
    greeting: "Ein Vierteljahrhundert – das verdient mehr als einen Händedruck.",
    list: ["Spätschichten", "Die Kaffeemaschine reparieren", "Monatsabschlüsse", "Immer als Letzter gehen"],
    highlight: "Heute: sich ehren lassen.",
    heartfelt: ["Sie kennen jede Maschine beim Namen – und jeden Menschen im Betrieb auch.", "Fünfundzwanzig Jahre Verlässlichkeit, Humor und offene Türen: Danke."],
    quote: "Ich wünsche Ihnen viele weitere gute Jahre – und heute einen Tag, an dem einmal nichts repariert werden muss.",
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
  if (e.particles) d.effects = { ...d.effects, particles: e.particles };
  if (e.gift) d.scenes = withGift(d.scenes, { ...giftScene(e.address, e.gift), voucher: e.voucher ?? null });
  return d;
}
