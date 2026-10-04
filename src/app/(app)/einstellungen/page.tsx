"use client";

import { normalizeBackup } from "@/lib/records";
import { BACKUP_MAX_BYTES, sizeLabel } from "@/lib/uploads";
import { BASE, HOME } from "@/lib/base";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { download, errText } from "@/components/client";
import { useApp } from "@/components/Gate";
import { InstallSection } from "@/components/Install";
import { TopBar } from "@/components/TopBar";
import type { Provider } from "@/lib/ai";
import { repo, SERVER, type AISource } from "@/lib/repo";
import { clearAI, getAI, hasDeviceLock, learnFromTexts, protectAI, removeProtection, saveAI, setLearnFromTexts, type StoredAI } from "@/lib/settings";
import { learningStats, type LearningStats } from "@/lib/learning";
import { PRESETS } from "@/lib/presets";

type Msg = { kind: "ok" | "err"; text: string } | null;

export default function SettingsPage() {
  const { showIntro, canLock, lock, refresh } = useApp();
  const [ai, setAiState] = useState<StoredAI | null>(null);
  const [source, setSource] = useState<AISource | null>(null);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [learnTexts, setLearnTexts] = useState(true);
  const [form, setForm] = useState({ gemini: "", openrouter: "", provider: "" as Provider | "", geminiModel: "", openrouterModel: "", openrouterBaseUrl: "" });
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [protectedKeys, setProtectedKeys] = useState(false);
  const [devicePw, setDevicePw] = useState("");
  const [newPw, setNewPw] = useState({ a: "", b: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    repo.aiSource().then(setSource).catch(() => setSource("none"));
    repo.listRatings().then((r) => setStats(learningStats(r))).catch(() => {});
    setLearnTexts(learnFromTexts());
    if (SERVER) return;
    const cur = getAI();
    setAiState(cur);
    setProtectedKeys(hasDeviceLock());
    if (cur) {
      setForm({
        gemini: cur.gemini ?? "",
        openrouter: cur.openrouter ?? "",
        provider: cur.provider ?? "",
        geminiModel: cur.geminiModel ?? "",
        openrouterModel: cur.openrouterModel ?? "",
        openrouterBaseUrl: cur.openrouterBaseUrl ?? "",
      });
    }
  }, []);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v.trim() }));

  async function pasteGemini() {
    try {
      const t = await navigator.clipboard.readText();
      if (t.trim()) set("gemini", t);
    } catch {
      setMsg({ kind: "err", text: "Einfügen ging nicht automatisch – tippe lange ins Feld und wähle „Einfügen“." });
    }
  }

  async function save() {
    if (!form.gemini && !form.openrouter) {
      if (!confirm("Alle KI-Schlüssel von diesem Gerät entfernen?")) return;
      clearAI();
      setAiState(null);
      setProtectedKeys(false);
      refresh();
      setSource("none");
      setMsg({ kind: "ok", text: "KI-Schlüssel entfernt." });
      return;
    }
    const v: StoredAI = { ...form, source: "manual" };
    try {
      await saveAI(v, devicePw);
      setDevicePw("");
      setAiState(v);
      setSource("manual");
      setMsg({ kind: "ok", text: "Gespeichert ✓ – tippe auf „KI testen“, um zu prüfen, ob alles klappt." });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    }
  }

  async function protect() {
    if (!ai) return;
    if (newPw.a !== newPw.b) return setMsg({ kind: "err", text: "Die beiden Passwörter sind verschieden." });
    try {
      await protectAI(ai, newPw.a);
      setNewPw({ a: "", b: "" });
      setProtectedKeys(true);
      refresh();
      setMsg({ kind: "ok", text: "Geschützt ✓ – ab jetzt fragt Funkelpost beim Öffnen nach diesem Passwort." });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    }
  }

  function unprotect() {
    if (!confirm("Passwortschutz entfernen? Die Schlüssel liegen dann wieder unverschlüsselt auf diesem Gerät.")) return;
    try {
      removeProtection();
      setProtectedKeys(false);
      refresh();
      setMsg({ kind: "ok", text: "Passwortschutz entfernt." });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ kind: "ok", text: await repo.testAI() });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    } finally {
      setBusy(false);
    }
  }

  async function backup() {
    try {
      const date = new Date().toISOString().slice(0, 10);
      download(`funkelpost-sicherung-${date}.json`, JSON.stringify(await repo.exportBackup(), null, 1), "application/json");
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    }
  }

  async function restore(file: File) {
    try {
      if (file.size > BACKUP_MAX_BYTES) throw new Error(`Die Datei ist zu groß für eine Sicherung (höchstens ${sizeLabel(BACKUP_MAX_BYTES)}).`);
      const raw = JSON.parse(await file.text());
      // Check first and ask: a restore overwrites people and cards with the same id.
      const n = normalizeBackup(raw);
      if (!window.confirm(`Sicherung einspielen: ${n.contacts.length} Personen und ${n.cards.length} Karten.\n\nGleiche Einträge auf diesem Gerät werden dabei überschrieben. Fortfahren?`)) return;
      const r = await repo.importBackup(raw);
      setMsg({ kind: "ok", text: `Wiederhergestellt: ${r.contacts} Personen und ${r.cards} Karten.` });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof SyntaxError ? "Die Datei ist keine gültige Sicherung." : errText(e) });
    }
  }

  return (
    <div className="shell" style={{ maxWidth: 760 }}>
      <TopBar>
        <Link href={HOME} className="btn ghost sm hide-sm">← Übersicht</Link>
      </TopBar>
      <div className="stack">
        <div>
          <div className="eyebrow">Einstellungen</div>
          <h1>Alles rund um die App</h1>
        </div>

        {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}

        {SERVER && (
          <section className="panel stack">
            <h2>🔐 Anmeldung</h2>
            <p className="muted small" style={{ margin: 0 }}>
              Handy verloren oder auf einem fremden Gerät angemeldet? Damit werden alle Geräte abgemeldet, auch dieses.
            </p>
            <div>
              <button
                className="btn ghost"
                onClick={() => {
                  if (!window.confirm("Wirklich auf allen Geräten abmelden?")) return;
                  fetch(`${BASE}/api/logout/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ all: true }) }).finally(
                    () => (window.location.href = `${BASE}/login/`),
                  );
                }}
              >
                Überall abmelden
              </button>
            </div>
          </section>
        )}

        <section className="panel stack">
          <h2>✨ KI</h2>
          {SERVER ? (
            source === "server" ? (
              <div className="notice ok">Die KI wird vom Server bereitgestellt – hier musst du nichts tun.</div>
            ) : (
              <div className="notice">
                Auf dem Server ist noch keine KI eingerichtet. Trage <code>GEMINI_API_KEY</code> oder <code>OPENROUTER_API_KEY</code> in die{" "}
                <code>.env</code> des Servers ein und starte ihn neu.
              </div>
            )
          ) : (
            <>
              <p className="muted small" style={{ margin: 0 }}>
                Damit die KI Texte schreiben kann, braucht sie einen <b>kostenlosen Schlüssel</b>. Das dauert etwa zwei Minuten.{" "}
                <b>Der Schlüssel bleibt nur auf diesem Gerät</b> und geht direkt an Google – nie an GitHub oder auf die Webseite.
              </p>
              <ol className="key-steps">
                <li>
                  <b>Schlüssel holen:</b> Tippe auf den Knopf und melde dich mit deinem Google-Konto an.
                  <div>
                    <a className="btn sm" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google-Seite öffnen ↗</a>
                  </div>
                </li>
                <li>
                  <b>Kopieren:</b> Dort auf <i>„Create API key“</i> (Schlüssel erstellen) tippen und den langen Text, der mit <code>AIza</code> beginnt, kopieren.
                </li>
                <li>
                  <b>Hier einfügen</b> und unten auf <i>Speichern</i> tippen:
                  <div className="row" style={{ flexWrap: "nowrap", marginTop: 6 }}>
                    <input type="password" autoComplete="off" aria-label="Google-Gemini-Schlüssel" value={form.gemini} placeholder="AIza…" onChange={(e) => set("gemini", e.target.value)} />
                    <button type="button" className="btn ghost sm" onClick={pasteGemini}>📋 Einfügen</button>
                  </div>
                </li>
              </ol>
              <button type="button" className="chip" style={{ justifySelf: "start" }} onClick={() => setAdvanced(!advanced)}>
                {advanced ? "▴" : "▾"} Erweitert (OpenRouter, Modelle)
              </button>
              {advanced && (
                <div className="sub">
                  <label className="field">
                    <span>OpenRouter-Schlüssel (Alternative zu Google)</span>
                    <input type="password" autoComplete="off" value={form.openrouter} placeholder="sk-or-…" onChange={(e) => set("openrouter", e.target.value)} />
                    <small><a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a> – nutzt automatisch kostenlose Modelle</small>
                  </label>
                  <label className="field">
                    <span>Zuerst probieren</span>
                    <select value={form.provider} onChange={(e) => set("provider", e.target.value)}>
                      <option value="">Gemini, dann OpenRouter</option>
                      <option value="openrouter">OpenRouter, dann Gemini</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Gemini-Modell</span>
                    <input type="text" list="gemini-models" value={form.geminiModel} placeholder="gemini-flash-latest" onChange={(e) => set("geminiModel", e.target.value)} />
                    <datalist id="gemini-models">
                      <option value="gemini-flash-latest" />
                      <option value="gemini-3.8-flash" />
                      <option value="gemini-3.5-flash-lite" />
                    </datalist>
                  </label>
                  <label className="field">
                    <span>OpenRouter-Modell</span>
                    <input type="text" list="openrouter-models" value={form.openrouterModel} placeholder="openrouter/free" onChange={(e) => set("openrouterModel", e.target.value)} />
                    <datalist id="openrouter-models">
                      <option value="openrouter/free" />
                      <option value="google/gemma-4-31b-it:free" />
                      <option value="qwen/qwen3.8-27b:free" />
                      <option value="nvidia/nemotron-3-super-120b-a12b:free" />
                    </datalist>
                    <small><Link href="/infos/#ki">Welches Modell ist gut? → KI-Leitfaden</Link></small>
                  </label>
                  <label className="field">
                    <span>OpenRouter-Adresse (für kompatible Dienste)</span>
                    <input type="text" value={form.openrouterBaseUrl} placeholder="https://openrouter.ai/api/v1" onChange={(e) => set("openrouterBaseUrl", e.target.value)} />
                    <small>Nur https. Eine eigene Adresse wird aus Sicherheitsgründen erst nach dem Speichern und einmal Neuladen der Seite freigeschaltet.</small>
                  </label>
                </div>
              )}
              {protectedKeys && (
                <label className="field">
                  <span>Geräte-Passwort (zum Speichern)</span>
                  <input type="password" autoComplete="current-password" value={devicePw} onChange={(e) => setDevicePw(e.target.value)} />
                </label>
              )}
              <div className="row">
                <button className="btn" onClick={save}>Speichern</button>
              </div>
              {ai && (
                <div className="sub">
                  <strong className="small">🔒 Schlüssel mit Passwort schützen (empfohlen)</strong>
                  {protectedKeys ? (
                    <>
                      <p className="small muted" style={{ margin: 0 }}>
                        Geschützt ✓ Die Schlüssel liegen nur verschlüsselt auf diesem Gerät. Nach dem Öffnen der App gibst du einmal das Passwort ein.
                      </p>
                      <div className="row">
                        <button className="btn ghost sm" onClick={lock}>Jetzt sperren</button>
                        <button className="btn ghost sm" onClick={unprotect}>Schutz entfernen</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="small muted" style={{ margin: 0 }}>
                        Dann liegen die Schlüssel nur verschlüsselt auf dem Gerät – wichtig, wenn mehrere Menschen dieses Gerät nutzen.
                      </p>
                      <input type="password" autoComplete="new-password" placeholder="Neues Geräte-Passwort (mind. 6 Zeichen)" value={newPw.a} onChange={(e) => setNewPw({ ...newPw, a: e.target.value })} />
                      <input type="password" autoComplete="new-password" placeholder="Passwort wiederholen" value={newPw.b} onChange={(e) => setNewPw({ ...newPw, b: e.target.value })} />
                      <div className="row">
                        <button className="btn ghost sm" onClick={protect} disabled={!newPw.a}>Schützen</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          {source && source !== "none" && (
            <div>
              <button className="btn ghost sm" onClick={test} disabled={busy}>
                {busy ? <span className="spinner" /> : "KI testen"}
              </button>
            </div>
          )}
        </section>

        <section className="panel stack">
          <h2>💾 Sicherung</h2>
          <p className="muted small" style={{ margin: 0 }}>
            {SERVER
              ? "Deine Personen und Karten liegen auf dem Server. Eine Sicherung als Datei schadet trotzdem nie – und damit kannst du auch Daten aus der Browser-Version übernehmen."
              : "Deine Personen und Karten sind nur in diesem Browser gespeichert. Lade ab und zu eine Sicherung herunter – damit kannst du alles auch auf ein anderes Gerät übertragen."}
          </p>
          <div className="row">
            <button className="btn" onClick={backup}>⬇ Sicherung herunterladen</button>
            <button className="btn ghost" onClick={() => fileRef.current?.click()}>⬆ Sicherung einspielen</button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) restore(f);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        <InstallSection />

        <section className="panel stack">
          <h2>🧠 Lernen aus Bewertungen</h2>
          <p className="muted small" style={{ margin: 0 }}>
            Mit 👍 und 👎 lernt Funkelpost, was gut ankommt: welche Designs, welcher Schreibstil und welche Formulierungen. Gespeichert werden nur
            Merkmale (Design, Anlass, Art der Beziehung, Bewertung) – nie Namen oder Stichworte. {SERVER ? "Die Bewertungen liegen auf deinem Server." : "Die Bewertungen bleiben auf diesem Gerät."}
          </p>
          {stats && stats.total > 0 ? (
            <div className="stack" style={{ gap: 6 }}>
              <div>
                <b>{stats.total}</b> Bewertungen · 👍 {stats.likes} · 👎 {stats.dislikes}
                {stats.retriesSaved > 0 && <> · <b>{stats.retriesSaved}×</b> hat die KI dich im zweiten Anlauf überzeugt</>}
              </div>
              {stats.presets.length > 0 && (
                <div className="small">
                  Beliebteste Designs:{" "}
                  {stats.presets.slice(0, 3).map((p, i) => (
                    <span key={p.preset}>{i > 0 && " · "}{PRESETS[p.preset]?.label ?? p.preset} ({p.likes}👍 {p.dislikes}👎)</span>
                  ))}
                </div>
              )}
              {stats.variants.length > 0 && (
                <div className="small">
                  Schreibstile:{" "}
                  {stats.variants.map((v, i) => (
                    <span key={v.variant}>{i > 0 && " · "}{v.variant === "A" ? "erzählerisch" : v.variant === "B" ? "pointiert" : v.variant} ({v.likes}👍 {v.dislikes}👎)</span>
                  ))}
                </div>
              )}
              {stats.reasons.length > 0 && <div className="small">Häufigste Kritik: {stats.reasons.map(([r, n]) => `${r} (${n})`).join(", ")}</div>}
            </div>
          ) : (
            <p className="small" style={{ margin: 0 }}>Noch keine Bewertungen. Bewerte deine nächste Karte mit 👍 oder 👎!</p>
          )}
          <label className="toggle">
            <input
              type="checkbox"
              checked={learnTexts}
              onChange={(e) => {
                setLearnTexts(e.target.checked);
                setLearnFromTexts(e.target.checked);
              }}
            />
            Gut bewertete Formulierungen (ohne Namen) als Vorbild für neue Karten nutzen
          </label>
          {stats && stats.total > 0 && (
            <div>
              <button
                className="btn ghost sm"
                onClick={async () => {
                  if (!confirm("Alle Bewertungen löschen? Funkelpost fängt dann wieder von vorn an zu lernen.")) return;
                  await repo.clearRatings();
                  setStats(learningStats([]));
                }}
              >
                Bewertungen löschen
              </button>
            </div>
          )}
        </section>

        <section className="panel stack">
          <h2>❓ Hilfe</h2>
          <div className="row">
            <button className="btn ghost" onClick={showIntro}>Einführung nochmal ansehen</button>
            {canLock && (
              <button className="btn ghost" onClick={lock}>{SERVER ? "🔒 Abmelden" : "🔒 Dieses Gerät sperren"}</button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
