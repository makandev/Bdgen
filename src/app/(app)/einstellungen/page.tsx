"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { download, errText } from "@/components/client";
import { useApp } from "@/components/Gate";
import { TopBar } from "@/components/TopBar";
import type { Provider } from "@/lib/ai";
import { repo, SERVER, type AISource } from "@/lib/repo";
import { clearAI, getAI, setAI, type StoredAI } from "@/lib/settings";

type Msg = { kind: "ok" | "err"; text: string } | null;

export default function SettingsPage() {
  const { showIntro, hasVault, lock } = useApp();
  const [ai, setAiState] = useState<StoredAI | null>(null);
  const [source, setSource] = useState<AISource | null>(null);
  const [form, setForm] = useState({ gemini: "", openrouter: "", provider: "" as Provider | "", geminiModel: "", openrouterModel: "", openrouterBaseUrl: "" });
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    repo.aiSource().then(setSource).catch(() => setSource("none"));
    if (SERVER) return;
    const cur = getAI();
    setAiState(cur);
    if (cur?.source === "manual") {
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

  function save() {
    if (!form.gemini && !form.openrouter) {
      clearAI();
      setAiState(null);
      setSource("none");
      setMsg({ kind: "ok", text: "KI-Schlüssel entfernt." });
      return;
    }
    const v: StoredAI = { ...form, source: "manual" };
    setAI(v);
    setAiState(v);
    setSource("manual");
    setMsg({ kind: "ok", text: "Gespeichert ✓ – tippe auf „Testen“, um zu prüfen, ob alles klappt." });
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
      download(`bdgen-sicherung-${date}.json`, JSON.stringify(await repo.exportBackup(), null, 1), "application/json");
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    }
  }

  async function restore(file: File) {
    try {
      const r = await repo.importBackup(JSON.parse(await file.text()));
      setMsg({ kind: "ok", text: `Wiederhergestellt: ${r.contacts} Personen und ${r.cards} Karten.` });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof SyntaxError ? "Die Datei ist keine gültige Sicherung." : errText(e) });
    }
  }

  return (
    <div className="shell" style={{ maxWidth: 760 }}>
      <TopBar>
        <Link href="/" className="btn ghost sm hide-sm">← Übersicht</Link>
      </TopBar>
      <div className="stack">
        <div>
          <div className="eyebrow">Einstellungen</div>
          <h1>Alles rund um die App</h1>
        </div>

        {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}

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
          ) : ai?.source === "vault" ? (
            <div className="notice ok">Die KI ist über das Passwort freigeschaltet – hier musst du nichts tun.</div>
          ) : (
            <>
              <p className="muted small" style={{ margin: 0 }}>
                Damit die KI Texte schreiben kann, braucht sie einen kostenlosen Schlüssel – einer von beiden reicht. Der Schlüssel bleibt nur auf diesem Gerät.
              </p>
              <label className="field">
                <span>Google-Gemini-Schlüssel</span>
                <input type="password" autoComplete="off" value={form.gemini} placeholder="AIza…" onChange={(e) => set("gemini", e.target.value)} />
                <small>Kostenlos: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a></small>
              </label>
              <label className="field">
                <span>OpenRouter-Schlüssel</span>
                <input type="password" autoComplete="off" value={form.openrouter} placeholder="sk-or-…" onChange={(e) => set("openrouter", e.target.value)} />
                <small><a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys</a> – nutzt automatisch kostenlose Modelle</small>
              </label>
              <button type="button" className="chip" style={{ justifySelf: "start" }} onClick={() => setAdvanced(!advanced)}>
                {advanced ? "▴" : "▾"} Erweitert
              </button>
              {advanced && (
                <div className="sub">
                  <label className="field">
                    <span>Zuerst probieren</span>
                    <select value={form.provider} onChange={(e) => set("provider", e.target.value)}>
                      <option value="">Gemini, dann OpenRouter</option>
                      <option value="openrouter">OpenRouter, dann Gemini</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Gemini-Modell</span>
                    <input type="text" value={form.geminiModel} placeholder="gemini-flash-latest" onChange={(e) => set("geminiModel", e.target.value)} />
                  </label>
                  <label className="field">
                    <span>OpenRouter-Modell</span>
                    <input type="text" value={form.openrouterModel} placeholder="openrouter/free" onChange={(e) => set("openrouterModel", e.target.value)} />
                  </label>
                  <label className="field">
                    <span>OpenRouter-Adresse (für kompatible Dienste)</span>
                    <input type="text" value={form.openrouterBaseUrl} placeholder="https://openrouter.ai/api/v1" onChange={(e) => set("openrouterBaseUrl", e.target.value)} />
                  </label>
                </div>
              )}
              <div className="row">
                <button className="btn" onClick={save}>Speichern</button>
              </div>
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
          <div className="tip">
            <span aria-hidden="true">📱</span>
            <span>
              <b>Tipp fürs iPhone:</b> Öffne die App in Safari, tippe auf „Teilen“ → „Zum Home-Bildschirm“. Dann startet sie wie eine echte App – und iOS löscht deine Daten nicht nach längerer Pause.
            </span>
          </div>
        </section>

        <section className="panel stack">
          <h2>❓ Hilfe</h2>
          <div className="row">
            <button className="btn ghost" onClick={showIntro}>Einführung nochmal ansehen</button>
            {hasVault && (
              <button className="btn ghost" onClick={lock}>{SERVER ? "🔒 Abmelden" : "🔒 Dieses Gerät sperren"}</button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
