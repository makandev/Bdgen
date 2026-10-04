"use client";

import { HOME } from "@/lib/base";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { SERVER } from "@/lib/repo";

const GEMINI: [string, string, string][] = [
  ["gemini-3.8-flash", "⭐ Standard in Funkelpost", "Aktuell das stärkste kostenlose Modell. Sehr gutes Deutsch, versteht Stimmungen gut – und im Bezahltarif günstiger als der Sammelname."],
  ["gemini-flash-latest", "Rückfall", "Sammelname, den Google auf ein Flash-Modell zeigen lässt (derzeit das ältere 3.5). Funkelpost nimmt ihn automatisch, falls 3.8 einmal abgeschaltet wird."],
  ["gemini-3.5-flash-lite", "⚡ Am schnellsten", "Antwortet am schnellsten und hat die großzügigsten Gratis-Limits, die Texte sind etwas einfacher."],
  ["gemini-2.5-pro", "Nur für Alt-Projekte", "Für neue Schlüssel nicht mehr freigeschaltet."],
];

const GEMINI_PAID: [string, string][] = [
  ["gemini-3.1-flash-image („Nano Banana 2“)", "Bilder erzeugen & bearbeiten"],
  ["gemini-3-pro-image („Nano Banana Pro“)", "Beste Bildqualität"],
  ["veo-3.1-generate-preview", "Kurze Videos"],
  ["lyria-3.5", "Musik"],
];

const OPENROUTER: [string, string, string][] = [
  ["openrouter/free", "Standard in Funkelpost", "Wählt automatisch ein gerade verfügbares Gratis-Modell. Am bequemsten."],
  ["google/gemma-4-31b-it:free", "⭐ Empfehlung für Deutsch", "Googles offenes Modell – schreibt natürliches Deutsch."],
  ["qwen/qwen3.8-27b:free", "Gute Alternative", "Stark und mehrsprachig."],
  ["nvidia/nemotron-3-super-120b-a12b:free", "Für längere Texte", "Großes Modell, gründlich, manchmal etwas langsamer."],
];

export default function InfoPage() {
  return (
    <div className="shell" style={{ maxWidth: 860 }}>
      <TopBar>
        <Link href={HOME} className="btn ghost sm hide-sm">← Übersicht</Link>
      </TopBar>
      <div className="stack">
        <div>
          <div className="eyebrow">Infos</div>
          <h1>Neuigkeiten, Pläne & KI-Leitfaden</h1>
        </div>

        <nav className="chips">
          <a className="chip" href="#neu">🆕 Neu</a>
          <a className="chip" href="#geplant">🗺️ Geplant</a>
          <a className="chip" href="#ki">🤖 KI-Leitfaden</a>
          <a className="chip" href="#bilder">🎨 Bilder oder Code?</a>
          <a className="chip" href="#server">🖥️ Server-Version</a>
        </nav>

        <section className="panel stack" id="neu">
          <h2>🆕 Neu in Version 0.9</h2>
          <ul className="info-list">
            <li><b>👣 Person anlegen in drei Schritten:</b> Wer? · Erzählen · Design – mit einer Live-Vorschau daneben, die sich bei jeder Auswahl sofort ändert.</li>
            <li><b>📱 Menü unten auf dem Handy:</b> Start, Kalender, Beispiele, Infos, Hilfe und Einstellungen – mit Beschriftung statt nur Symbolen.</li>
            <li><b>🔑 KI einrichten in drei Schritten:</b> Schlüssel holen, kopieren, mit „📋 Einfügen“ übernehmen.</li>
            <li><b>🤖 Neueres KI-Modell:</b> Standard ist jetzt fest <code>gemini-3.8-flash</code>; wird es einmal abgeschaltet, springt Funkelpost automatisch auf den Sammelnamen <code>gemini-flash-latest</code>.</li>
            <li><b>⚡ Schnellere Vorschauen:</b> Beispielkarten zeigen sofort ein Standbild; die Einführung erscheint nur noch auf der Startseite.</li>
          </ul>
        </section>

        <section className="panel stack">
          <h2>Neu in Version 0.8</h2>
          <ul className="info-list">
            <li><b>🎵 Hintergrundmusik:</b> eine kleine Melodie passend zum Anlass – Spieluhr, festlich oder ruhig. Sie wird im Browser erzeugt (keine Dateien), startet beim ersten Antippen und lässt sich über 🔇/🔊 in der Ecke ausschalten. Wählbar im Design-Tab; die KI schlägt auf Wunsch eine passende vor.</li>
            <li><b>✍️ Handschrift-Unterschrift:</b> im Finale mit Finger oder Maus unterschreiben. In der Karte wird sie wie mit Tinte Strich für Strich nachgezeichnet. Gespeichert als kleine Zahlenliste – der Link bleibt kurz.</li>
          </ul>
        </section>

        <section className="panel stack">
          <h2>Neu in Version 0.7</h2>
          <ul className="info-list">
            <li><b>📅 Geburtstags-Organizer:</b> alle Geburtstage, Hochzeitstage und besonderen Tage auf einen Blick – nach Monaten, mit Countdown und Alter („wird 70“). Mit „Datum vormerken“ in Sekunden eingetragen, auch ohne Geburtsjahr.</li>
            <li><b>📲 Erinnerung im Handy-Kalender:</b> ein Tipp lädt alle Termine in deinen Kalender – jedes Jahr wiederkehrend, mit Erinnerung am Tag und auf Wunsch schon Tage vorher.</li>
            <li><b>💍 Mehrere Termine pro Person:</b> neben dem Geburtstag z. B. Hochzeitstag oder Namenstag.</li>
            <li><b>🛡️ Sicherheits-Überholung:</b> strengere Regeln im Browser, geprüfte Uploads, Schutz vor manipulierten Links und KI-Antworten; auf dem eigenen Server neu: „Überall abmelden“ unter ⚙ Einstellungen.</li>
          </ul>
        </section>

        <section className="panel stack">
          <h2>Neu in Version 0.6</h2>
          <ul className="info-list">
            <li><b>🔔 Erinnerung:</b> Steht in den nächsten 7 Tagen ein Geburtstag oder Anlass an, zeigt die Startseite ein Kärtchen mit „Karte erstellen“.</li>
            <li><b>🖼️ Bild + Link teilen:</b> Im Teilen-Tab entsteht ein Vorschaubild in den Farben der Karte – zusammen mit dem Link verschickt, ohne Warnungen wie bei HTML-Dateien.</li>
            <li><b>✨ Neue Startseite:</b> sanft funkelnd, mit Vorschauen fertiger Karten.</li>
            <li><b>🔒 KI-Schlüssel nur auf deinem Gerät:</b> Nichts mehr über GitHub. Auf Wunsch schützt ein Geräte-Passwort die Schlüssel (verschlüsselt gespeichert).</li>
            <li><b>👀 Sieben neue Beispiele</b> – mit Ballons, Schneefall, Schmetterlingen, Fußbällen und Gutscheinen.</li>
            <li><b>🎆 Silvester:</b> eigene Texte – Rückblick, Vorsatz-Quiz und „im alten Jahr gelassen“.</li>
            <li><b>📱 iPhone:</b> läuft jetzt ab iOS 15, Karten ab iOS 11; viele kleine Verbesserungen aus einer Experten-Prüfung.</li>
          </ul>
        </section>

        <section className="panel stack">
          <h2>Version 0.5</h2>
          <ul className="info-list">
            <li><b>🎟️ Gutschein mit Feuerwerk:</b> Auf der Geschenk-Seite kannst du einen Gutschein anhängen – als <b>Code</b> (mit Kopieren-Knopf), <b>Foto</b> oder <b>PDF</b>. Beim Auspacken startet ein Countdown 3-2-1, buntes Feuerwerk – und dann fliegt der Gutschein herein.</li>
            <li><b>🎆 Silvester & Neujahr:</b> neuer Anlass, neues Design „Silvester“ und der Hintergrund-Effekt <b>Feuerwerk</b>.</li>
            <li><b>✨ KI-Effekt-Rezepte:</b> Die KI kann jetzt eigene Effekte erfinden – z. B. „Ballons, die aufsteigen“, „leiser Schneefall“ oder „Fußbälle“. Einfach im Design-Tab beschreiben.</li>
            <li><b>📲 Als App installieren:</b> unten rechts – mit passender Anleitung für iPhone, Android, iPad und Computer.</li>
            <li><b>📱 Ältere iPhones:</b> Verschickte Karten öffnen sich jetzt auch auf älteren Geräten (ab iOS 11).</li>
          </ul>
        </section>

        <section className="panel stack">
          <h2>Version 0.4</h2>
          <ul className="info-list">
            <li><b>⚡ Schnell-Karte:</b> Name, Beziehung, ein bis zwei Fragen – den Rest macht die KI.</li>
            <li><b>👍 / 👎 bewerten:</b> Bei 👎 sagst du, was nicht passt, und die KI bekommt bis zu zwei Versuche, dich zu überzeugen.</li>
            <li><b>🧠 Funkelpost lernt:</b> Gut bewertete Designs werden zuerst vorgeschlagen, der besser bewertete Schreibstil setzt sich durch, gelungene Formulierungen dienen als Vorbild.</li>
            <li><b>🎁 Geschenk-Seite:</b> Ein Päckchen zum Auspacken – mit Konfetti und deinem Geschenk.</li>
            <li><b>💌 Reaktionen:</b> Am Ende der Karte antwortet die Person mit passenden Knöpfen (❤️, 😂, 🥂, 💪 …) – in der Server-Version kommt die Reaktion direkt bei dir an, sonst per WhatsApp oder Nachricht.</li>
            <li><b>Vorlagen aus der Galerie</b> werden komplett übernommen – Design, Effekte und Texte.</li>
          </ul>
        </section>

        <section className="panel stack">
          <h2>Version 0.3 <span className="muted small">(Oktober 2026)</span></h2>
          <ul className="info-list">
            <li><b>Neuer Name:</b> aus „Bdgen“ wird <b>Funkelpost</b>.</li>
            <li><b>6 neue Designs:</b> Schwarz & Gold, Rosé-Gold, Holo-Glanz, Matrix (mit Zeichenregen), Block-Welt (Roblox-Stil) und Neon-Party.</li>
            <li><b>Neue Effekte:</b> Funkelsterne, Polarlicht, schwebende Blöcke – und Konfetti als Herzen, Sterne, Quadrate oder Zeichen.</li>
            <li><b>Beispiel-Galerie:</b> <Link href="/beispiele/">zwölf fertige Karten</Link> zum Anschauen.</li>
            <li><b>Über 70 Personen</b> zur Auswahl – von Tochter und Enkel bis Erzieherin und Haustier, jeweils mit Emoji.</li>
            <li><b>KI zuerst:</b> Texte schreibt die KI, selbst ändern geht weiterhin, ist aber eingeklappt.</li>
            <li><b>Server-Version</b> mit Installationsskript für den eigenen Server.</li>
          </ul>
        </section>

        <section className="panel stack" id="geplant">
          <h2>🗺️ Geplant & noch offen</h2>
          <p className="muted small" style={{ margin: 0 }}>Ideen für die nächsten Versionen – noch nicht umgesetzt.</p>
          <ul className="info-list">
            <li>📷 <b>Eigene Fotos</b> auch auf anderen Seiten der Karte (z. B. ein Kinderfoto im Finale) – für Gutscheine geht das schon</li>
            <li>🎨 <b>KI-Bilder</b> passend zur Karte – optional, da die Bildmodelle Geld kosten</li>
            <li>🎙️ <b>Sprachnachricht</b>, die in der Karte abgespielt wird</li>
            <li>🔔 <b>Erinnerung</b> ein paar Tage vor Geburtstagen – und eine Benachrichtigung, wenn eine Reaktion kommt (Server-Version)</li>
            <li>👨‍👩‍👧 <b>Mehrere Benutzer</b> mit eigenem Login (Server-Version)</li>
            <li>🧩 <b>Neue Seitentypen:</b> Rätsel, Zeitstrahl mit gemeinsamen Erinnerungen</li>
            <li>📊 <b>Gemeinsames Lernen:</b> Bewertungen der ganzen Familie zusammenführen (Server-Version)</li>
            <li>🌍 Karten auch auf <b>Englisch, Türkisch & Co.</b></li>
            <li>🖨️ <b>Druckversion</b> als PDF</li>
          </ul>
        </section>

        <section className="panel stack" id="ki">
          <h2>🤖 KI-Leitfaden <span className="muted small">(Stand: Oktober 2026)</span></h2>
          <p style={{ margin: 0 }}>
            Funkelpost nutzt die KI für zwei Dinge: <b>Texte schreiben</b> aus deinen Stichworten und <b>Design & Effekte einstellen</b> nach deinem Wunsch.
            Dafür reicht ein kostenloser Schlüssel von Google Gemini oder OpenRouter.
          </p>

          <h3>Google Gemini – kostenlos über Google AI Studio</h3>
          <div className="model-table">
            {GEMINI.map(([id, tag, text]) => (
              <div key={id} className="model-row">
                <code>{id}</code>
                <span className="tag">{tag}</span>
                <span className="small muted">{text}</span>
              </div>
            ))}
          </div>
          <div className="tip">
            <span aria-hidden="true">💶</span>
            <span>
              <b>Bilder, Videos und Musik sind bei Gemini kostenpflichtig</b> – im Gratis-Kontingent gibt es dafür keine Freimenge:{" "}
              {GEMINI_PAID.map(([m, what], i) => (
                <span key={m}>{i > 0 && " · "}<code>{m}</code> ({what})</span>
              ))}
            </span>
          </div>

          <h3>OpenRouter – kostenlose Modelle (alle nur Text)</h3>
          <div className="model-table">
            {OPENROUTER.map(([id, tag, text]) => (
              <div key={id} className="model-row">
                <code>{id}</code>
                <span className="tag">{tag}</span>
                <span className="small muted">{text}</span>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            Weniger geeignet: reine Code-Modelle (z. B. <code>cohere/north-mini-code:free</code>), Filter-Modelle (<code>…content-safety</code>) und sehr kleine
            Modelle (z. B. <code>liquid/lfm-2.5-2.6b:free</code>) – die schreiben deutlich schwächeres Deutsch. Bei OpenRouter gibt es derzeit
            <b> kein kostenloses Modell, das Bilder erzeugen kann</b>.
          </p>

          <div className="tip">
            <span aria-hidden="true">💡</span>
            <span>
              <b>So stellst du das Modell um:</b>{" "}
              {SERVER ? (
                <>in der <code>.env</code> des Servers mit <code>GEMINI_MODEL=…</code> bzw. <code>OPENROUTER_MODEL=…</code>, danach neu starten.</>
              ) : (
                <>unter <Link href="/einstellungen/">⚙ Einstellungen → Erweitert</Link>. Mit „KI testen“ siehst du sofort, ob es klappt.</>
              )}
            </span>
          </div>
          <div className="tip">
            <span aria-hidden="true">🔞</span>
            <span>
              <b>Ab 18:</b> Google verlangt für die Gemini-API, dass du volljährig bist, und erlaubt sie nicht für Apps, die sich an Kinder richten.
              Funkelpost ist deshalb eine App für Erwachsene: Du richtest sie ein und hast den Schlüssel – Kinder gestalten am besten gemeinsam mit dir.
              Wer eine Karte bekommt, nutzt dabei keine KI.
            </span>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            Gut zu wissen: Gratis-Modelle wechseln häufig und haben Tageslimits. Bei kostenlosen Angeboten können Anbieter die Eingaben zur
            Verbesserung ihrer Modelle nutzen – Funkelpost schickt deshalb <b>nie den Namen</b> der Person mit, nur deine Stichworte. Die Empfehlungen
            beruhen auf den Angaben der Anbieter; probier ruhig aus, welches Modell dir am besten gefällt.
          </p>
        </section>

        <section className="panel stack" id="bilder">
          <h2>🎨 Bilder oder Code?</h2>
          <p style={{ margin: 0 }}>
            Richtig erkannt: Fast jedes KI-Modell kann programmieren. Und tatsächlich besteht <b>jede Funkelpost-Karte nur aus Code</b> – Konfetti, Glitzer,
            Matrix-Regen, Uhr und Kino-Finale werden live im Browser gezeichnet. <b>Bilder braucht es dafür nicht.</b> Deshalb sind die Karten so klein,
            dass sie sogar in einen Link passen, und laufen auf jedem Handy.
          </p>
          <p style={{ margin: 0 }}>
            Die KI schreibt den Animations-Code aber bewusst <b>nicht selbst</b>, sondern steuert die fertig eingebauten Effekte über Einstellungen –
            und kann mit <b>Effekt-Rezepten</b> trotzdem Neues erfinden: Sie wählt Emoji oder Symbole und eine Bewegung (aufsteigen, fallen, schweben,
            wirbeln, ploppen). Funkelpost prüft das Rezept und zeichnet es mit eigenem, geprüftem Code. So entstehen z. B. Ballons, Schneefall oder
            Schmetterlinge, ohne dass fremder Code in die Karte kommt.
          </p>
          <ul className="info-list">
            <li><b>Zuverlässig:</b> Gratis-Modelle machen bei längerem Code oft Fehler – die Karte wäre dann kaputt.</li>
            <li><b>Sicher:</b> Fremder Code in einer Karte, die du an andere verschickst, wäre ein Risiko. Die eingebauten Effekte sind geprüft.</li>
            <li><b>Schnell & kostenlos:</b> Texte und ein paar Einstellungen brauchen viel weniger KI-Leistung als ganzer Code.</li>
          </ul>
          <p style={{ margin: 0 }}>
            <b>Bilder lohnen sich nur, wenn du etwas Eigenes zeigen willst</b> – zum Beispiel einen Gutschein als Foto oder PDF (geht schon) oder ein
            eigenes Foto in der Karte (steht unter „Geplant“).
          </p>
        </section>

        <section className="panel stack" id="server">
          <h2>🖥️ Server-Version</h2>
          <p style={{ margin: 0 }}>
            Funkelpost gibt es in zwei Varianten: als <b>Browser-App</b> (Daten bleiben auf dem Gerät) und als <b>Server-Version</b> für den eigenen Server
            – dann sehen alle Geräte dieselben Personen und Karten, die KI-Schlüssel bleiben auf dem Server, und Links sind kurz und abschaltbar.
          </p>
          <p style={{ margin: 0 }}>
            Installation in wenigen Minuten mit Docker: siehe{" "}
            <a href="https://github.com/makandev/Bdgen/blob/main/docs/SERVER.md" target="_blank" rel="noreferrer">Anleitung „Server-Installation“</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
