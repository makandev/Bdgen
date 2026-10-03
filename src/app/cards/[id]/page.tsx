"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, errText } from "@/components/client";
import { DesignPanel } from "@/components/DesignPanel";
import { Text } from "@/components/fields";
import { SCENE_LABELS, SceneAI, SceneFields, sceneSummary } from "@/components/SceneEditor";
import { TopBar } from "@/components/TopBar";
import { occasionLabel } from "@/lib/presets";
import { renderCardHTML } from "@/lib/render";
import { blankScene } from "@/lib/templates";
import type { Card, CardData, Cinema, Contact, Effects, Scene, SceneType, Theme } from "@/lib/types";

type Tab = "texts" | "design" | "ai" | "share";
type SaveState = "saved" | "dirty" | "saving" | "error";
type Msg = { kind: "ok" | "err" | ""; text: string } | null;

export default function CardEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);
  const [data, setData] = useState<CardData | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [tab, setTab] = useState<Tab>("texts");
  const [open, setOpen] = useState<number | null>(0);
  const [previewStart, setPreviewStart] = useState(1);
  const [previewKey, setPreviewKey] = useState(0);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [save, setSave] = useState<SaveState>("saved");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [history, setHistory] = useState<CardData[]>([]);
  const [aiReady, setAiReady] = useState(true);
  const [extra, setExtra] = useState("");
  const [addType, setAddType] = useState<SceneType>("text");
  const [canShare, setCanShare] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    api<{ card: Card; contact: Contact | null }>(`/api/cards/${id}`)
      .then((d) => {
        setCard(d.card);
        setData(d.card.data);
        setContact(d.contact);
        loaded.current = true;
      })
      .catch((e) => setMsg({ kind: "err", text: errText(e) }));
    api<{ providers: string[] }>("/api/status").then((d) => setAiReady(d.providers.length > 0)).catch(() => {});
    setCanShare("share" in navigator);
    const w = sessionStorage.getItem("bdgen-warning");
    if (w) {
      sessionStorage.removeItem("bdgen-warning");
      setMsg({ kind: "err", text: w });
    }
  }, [id]);

  // Autosave
  useEffect(() => {
    if (!loaded.current || !data || !card) return;
    setSave("dirty");
    const t = setTimeout(async () => {
      setSave("saving");
      try {
        await api(`/api/cards/${id}`, { method: "PUT", body: { data, title: card.title, shared: card.shared } });
        setSave("saved");
      } catch {
        setSave("error");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [data, card?.title, card?.shared]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced preview
  const [html, setHtml] = useState("");
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setHtml(renderCardHTML(data, { startScene: previewStart })), 250);
    return () => clearTimeout(t);
  }, [data, previewStart, previewKey]);

  const update = useCallback((fn: (d: CardData) => CardData) => setData((d) => (d ? fn(d) : d)), []);
  const remember = () => data && setHistory((h) => [...h.slice(-19), structuredClone(data)]);
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setData(prev);
    setMsg({ kind: "ok", text: "Rückgängig gemacht." });
  };

  const setScene = (i: number, s: Scene) => update((d) => ({ ...d, scenes: d.scenes.map((x, k) => (k === i ? s : x)) }));
  const moveScene = (i: number, dir: number) => {
    if (!data) return;
    const j = i + dir;
    if (j < 0 || j >= data.scenes.length) return;
    const scenes = [...data.scenes];
    [scenes[i], scenes[j]] = [scenes[j], scenes[i]];
    setData({ ...data, scenes });
    setOpen(j);
    setPreviewStart(j + 1);
  };
  const removeScene = (i: number) => {
    if (!data || data.scenes.length <= 1 || !confirm("Diese Seite entfernen?")) return;
    remember();
    update((d) => ({ ...d, scenes: d.scenes.filter((_, k) => k !== i) }));
    setOpen(null);
    setPreviewStart(1);
  };
  const duplicateScene = (i: number) =>
    update((d) => ({ ...d, scenes: [...d.scenes.slice(0, i + 1), structuredClone(d.scenes[i]), ...d.scenes.slice(i + 1)] }));
  const addScene = () => {
    if (!data) return;
    const s = blankScene(addType, data.address);
    // Insert before the finale so it stays last.
    const finaleIdx = data.scenes.findIndex((x) => x.type === "finale");
    const at = finaleIdx >= 0 && addType !== "finale" ? finaleIdx : data.scenes.length;
    update((d) => ({ ...d, scenes: [...d.scenes.slice(0, at), s, ...d.scenes.slice(at)] }));
    setOpen(at);
    setPreviewStart(at + 1);
  };

  function toggleScene(i: number) {
    const next = open === i ? null : i;
    setOpen(next);
    if (next !== null) setPreviewStart(next + 1);
  }

  async function rewrite(i: number, instruction: string) {
    if (!data) return;
    setBusy(`scene-${i}`);
    setMsg(null);
    try {
      const r = await api<{ scene: Scene }>("/api/ai/scene", { body: { cardId: id, scene: data.scenes[i], instruction } });
      remember();
      setScene(i, r.scene);
      setPreviewKey((k) => k + 1);
      setMsg({ kind: "ok", text: `Seite ${i + 1} wurde neu geschrieben.` });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    } finally {
      setBusy("");
    }
  }

  async function regenerateAll() {
    if (!data) return;
    setBusy("all");
    setMsg(null);
    try {
      const r = await api<{ scenes: Scene[]; cinema: Cinema; topLine: string }>(`/api/cards/${id}/generate`, { body: { extra } });
      remember();
      update((d) => ({ ...d, scenes: r.scenes, cinema: r.cinema, topLine: r.topLine }));
      setPreviewStart(1);
      setOpen(0);
      setTab("texts");
      setMsg({ kind: "ok", text: "Die ganze Karte wurde neu geschrieben. Mit „Rückgängig“ kommst du zur vorherigen Fassung." });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    } finally {
      setBusy("");
    }
  }

  async function restyle(instruction: string) {
    if (!data) return;
    setBusy("style");
    setMsg(null);
    try {
      const r = await api<{ theme: Theme; effects: Effects; summary: string }>("/api/ai/style", {
        body: { cardId: id, instruction, theme: data.theme, effects: data.effects },
      });
      remember();
      update((d) => ({ ...d, theme: r.theme, effects: r.effects }));
      setPreviewKey((k) => k + 1);
      setMsg({ kind: "ok", text: r.summary });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    } finally {
      setBusy("");
    }
  }

  async function deleteCard() {
    if (!confirm("Diese Karte wirklich löschen? Der Link funktioniert danach nicht mehr.")) return;
    await api(`/api/cards/${id}`, { method: "DELETE" }).catch(() => {});
    router.push(contact ? `/contacts/${contact.id}` : "/");
  }

  const link = useMemo(() => (card && typeof window !== "undefined" ? `${window.location.origin}/k/${card.slug}` : ""), [card]);

  if (!data || !card) {
    return (
      <div className="shell">
        <TopBar />
        {msg ? <div className="notice err">{msg.text}</div> : <p className="muted">Lädt …</p>}
      </div>
    );
  }

  const saveLabel = { saved: "✓ Gespeichert", dirty: "Ungespeichert …", saving: "Speichert …", error: "⚠ Speichern fehlgeschlagen" }[save];

  return (
    <div className="shell">
      <TopBar>
        <span className="save-state hide-sm">{saveLabel}</span>
        {history.length > 0 && (
          <button className="btn ghost sm" onClick={undo} title="Letzte KI-Änderung rückgängig machen">
            ↶ Rückgängig
          </button>
        )}
      </TopBar>

      <div className="spread" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">
            {contact ? <Link href={`/contacts/${contact.id}`}>{contact.name}</Link> : "Karte"} · {occasionLabel(data.occasion)}
          </div>
          <h1>{card.title}</h1>
        </div>
        <div className="row">
          <button className="btn ghost sm" onClick={() => { navigator.clipboard?.writeText(link); setMsg({ kind: "ok", text: "Link kopiert – einfach per WhatsApp, SMS oder Mail verschicken." }); }} disabled={!card.shared}>
            🔗 Link kopieren
          </button>
          <a className="btn sm" href={`/api/cards/${id}/export`}>
            ⬇ HTML-Datei
          </a>
        </div>
      </div>

      {msg && msg.text && (
        <div className={`notice ${msg.kind}`} style={{ marginBottom: 14 }} onClick={() => setMsg(null)}>
          {msg.text}
        </div>
      )}

      <div className="mobile-switch">
        <div className="seg">
          <button className={view === "edit" ? "on" : ""} onClick={() => setView("edit")}>Bearbeiten</button>
          <button className={view === "preview" ? "on" : ""} onClick={() => { setView("preview"); setPreviewKey((k) => k + 1); }}>Vorschau</button>
        </div>
      </div>

      <div className="editor" data-view={view}>
        <div className="editor-main panel">
          <nav className="tabs">
            {([["texts", "Texte"], ["design", "Design & Effekte"], ["ai", "✨ KI-Studio"], ["share", "Teilen"]] as [Tab, string][]).map(([k, l]) => (
              <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </nav>

          {tab === "texts" && (
            <div className="stack">
              <Text label="Zeile ganz oben" value={data.topLine} onChange={(v) => update((d) => ({ ...d, topLine: v }))} />
              <div>
                {data.scenes.map((s, i) => (
                  <div key={i} className={`scene${open === i ? " open" : ""}`}>
                    <div className="scene-head" onClick={() => toggleScene(i)}>
                      <span className="num">{i + 1}</span>
                      <div className="title">
                        <span className="tag" style={{ marginRight: 8 }}>{SCENE_LABELS[s.type]}</span>
                        <span className="small">{sceneSummary(s).replace(/\{\{\s*name\s*\}\}/g, data.recipientName).replace(/\*/g, "")}</span>
                      </div>
                      <span className="muted">{open === i ? "▴" : "▾"}</span>
                    </div>
                    {open === i && (
                      <div className="scene-body">
                        <SceneAI busy={busy === `scene-${i}`} disabled={!aiReady || (!!busy && busy !== `scene-${i}`)} onRun={(ins) => rewrite(i, ins)} />
                        <SceneFields scene={s} onChange={(ns) => setScene(i, ns)} />
                        <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                          <button className="btn ghost sm" onClick={() => moveScene(i, -1)} disabled={i === 0}>↑ Nach oben</button>
                          <button className="btn ghost sm" onClick={() => moveScene(i, 1)} disabled={i === data.scenes.length - 1}>↓ Nach unten</button>
                          <button className="btn ghost sm" onClick={() => duplicateScene(i)}>Duplizieren</button>
                          <button className="btn danger sm" onClick={() => removeScene(i)} disabled={data.scenes.length <= 1}>Entfernen</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="row">
                <select value={addType} onChange={(e) => setAddType(e.target.value as SceneType)} style={{ width: "auto" }}>
                  {(Object.keys(SCENE_LABELS) as SceneType[]).map((t) => (
                    <option key={t} value={t}>{SCENE_LABELS[t]}</option>
                  ))}
                </select>
                <button className="btn ghost sm" onClick={addScene}>+ Seite hinzufügen</button>
              </div>

              {data.effects.cinema && (
                <div className="sub" style={{ marginTop: 6 }}>
                  <h3>🎬 Kino-Finale</h3>
                  <Text label="1. Einblendung" value={data.cinema.kicker} onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, kicker: v } }))} />
                  <Text label="2. Über dem Namen" value={data.cinema.forLabel} onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, forLabel: v } }))} />
                  <Text label="3. Großer Titel" multiline value={data.cinema.title} onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, title: v } }))} />
                  <Text label="4. Schlusssatz" value={data.cinema.final} hint="*Wort* wird farbig hervorgehoben" onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, final: v } }))} />
                  <Text label="Emoji" value={data.cinema.emoji} onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, emoji: v } }))} />
                </div>
              )}
            </div>
          )}

          {tab === "design" && (
            <DesignPanel
              theme={data.theme}
              effects={data.effects}
              busy={busy === "style"}
              aiReady={aiReady}
              onChange={(theme, effects) => update((d) => ({ ...d, theme, effects }))}
              onPrompt={restyle}
            />
          )}

          {tab === "ai" && (
            <div className="stack">
              <div>
                <h2>Ganze Karte neu schreiben</h2>
                <p className="muted small" style={{ margin: "4px 0 0" }}>
                  Die KI nutzt die Stichpunkte des Kontakts. Design und Effekte bleiben, nur die Texte werden neu geschrieben. Der Name wird nicht an die KI geschickt.
                </p>
              </div>
              {contact && (
                <div className="sub">
                  <div className="small">
                    <strong>{contact.relation || "Kontakt"}</strong> · {contact.address === "sie" ? "Sie" : "du"} · {occasionLabel(contact.occasion)}
                    {contact.mood.length > 0 && <> · Stimmung: {contact.mood.join(", ")}</>}
                  </div>
                  <div className="small muted" style={{ whiteSpace: "pre-wrap" }}>{contact.notes || "Noch keine Stichpunkte hinterlegt."}</div>
                  <div>
                    <Link href={`/contacts/${contact.id}`} className="btn ghost sm">Stichpunkte bearbeiten</Link>
                  </div>
                </div>
              )}
              <Text
                label="Zusätzlicher Wunsch für diese Fassung"
                multiline
                value={extra}
                placeholder="z. B. „mehr Humor, weniger Pathos“, „Anspielung auf den Umzug“, „sehr kurz halten“"
                onChange={setExtra}
              />
              <div>
                <button className="btn" onClick={regenerateAll} disabled={!!busy || !aiReady}>
                  {busy === "all" ? <><span className="spinner" /> KI schreibt …</> : "✨ Alle Texte neu schreiben"}
                </button>
              </div>
              {!aiReady && <div className="notice">Kein KI-Schlüssel hinterlegt (GEMINI_API_KEY oder OPENROUTER_API_KEY).</div>}
              <p className="muted small" style={{ margin: 0 }}>
                Einzelne Seiten änderst du im Reiter „Texte“, Farben und Effekte im Reiter „Design & Effekte“ – jeweils per Wunsch an die KI.
              </p>
            </div>
          )}

          {tab === "share" && (
            <div className="stack">
              <Text label="Titel der Karte (nur für dich)" value={card.title} onChange={(v) => setCard({ ...card, title: v })} />
              <Text
                label="Name / Anrede in der Karte"
                value={data.recipientName}
                hint="Ersetzt überall {{name}} in den Texten."
                onChange={(v) => update((d) => ({ ...d, recipientName: v }))}
              />
              <div className="sub">
                <h3>Link zum Verschicken</h3>
                <input type="text" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
                <div className="row">
                  <button className="btn sm" onClick={() => { navigator.clipboard?.writeText(link); setMsg({ kind: "ok", text: "Link kopiert." }); }} disabled={!card.shared}>Kopieren</button>
                  <a className="btn ghost sm" href={link} target="_blank" rel="noreferrer">Öffnen</a>
                  {canShare && (
                    <button className="btn ghost sm" onClick={() => navigator.share({ url: link }).catch(() => {})} disabled={!card.shared}>Teilen …</button>
                  )}
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={card.shared} onChange={(e) => setCard({ ...card, shared: e.target.checked })} />
                  Link ist aktiv (ausschalten = Link funktioniert nicht mehr)
                </label>
              </div>
              <div className="sub">
                <h3>Als Datei</h3>
                <p className="muted small" style={{ margin: 0 }}>Eine einzelne HTML-Datei, die ohne Internet funktioniert – z. B. als Mail-Anhang.</p>
                <label className="toggle">
                  <input type="checkbox" checked={data.iosHint} onChange={(e) => update((d) => ({ ...d, iosHint: e.target.checked }))} />
                  iPhone-Hinweis unter der Karte anzeigen
                </label>
                <div>
                  <a className="btn sm" href={`/api/cards/${id}/export`}>⬇ HTML-Datei herunterladen</a>
                </div>
              </div>
              <div>
                <button className="btn danger sm" onClick={deleteCard}>Karte löschen</button>
              </div>
            </div>
          )}
        </div>

        <aside className="editor-side">
          <div className="phone">
            <iframe key={previewKey} className="preview-frame" title="Vorschau" srcDoc={html} sandbox="allow-scripts" />
          </div>
          <div className="preview-tools">
            {data.scenes.map((_, i) => (
              <button
                key={i}
                className={`btn ghost sm icon${previewStart === i + 1 ? " on" : ""}`}
                onClick={() => { setPreviewStart(i + 1); setPreviewKey((k) => k + 1); }}
                title={`Seite ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
            <button className="btn ghost sm" onClick={() => { setPreviewStart(1); setPreviewKey((k) => k + 1); }}>▶ Von vorn</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
