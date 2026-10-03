"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { download, errText } from "@/components/client";
import { DesignPanel } from "@/components/DesignPanel";
import { Text } from "@/components/fields";
import { SCENE_LABELS, SceneAI, SceneFields, sceneSummary } from "@/components/SceneEditor";
import { TopBar } from "@/components/TopBar";
import { briefFor } from "@/lib/actions";
import { aiEnabled } from "@/lib/ai";
import { BASE } from "@/lib/base";
import { occasionLabel } from "@/lib/presets";
import { generateCard, restyle, restyleOffline, rewriteScene } from "@/lib/prompts";
import { renderCardHTML } from "@/lib/render";
import { encodeCard } from "@/lib/share";
import { cards, contacts } from "@/lib/store";
import { blankScene } from "@/lib/templates";
import type { Card, CardData, Contact, Scene, SceneType } from "@/lib/types";

type Tab = "texts" | "design" | "ai" | "share";
type Msg = { kind: "ok" | "err" | ""; text: string } | null;

function fileName(name: string) {
  const base = name.normalize("NFKD").replace(/ß/g, "ss").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "Karte";
  return `Fuer_${base}.html`;
}

export default function CardPage() {
  return (
    <Suspense>
      <CardEditor />
    </Suspense>
  );
}

function CardEditor() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);
  const [data, setData] = useState<CardData | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [tab, setTab] = useState<Tab>("texts");
  const [open, setOpen] = useState<number | null>(0);
  const [previewStart, setPreviewStart] = useState(1);
  const [previewKey, setPreviewKey] = useState(0);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [saved, setSaved] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [history, setHistory] = useState<CardData[]>([]);
  const [aiReady, setAiReady] = useState(true);
  const [extra, setExtra] = useState("");
  const [addType, setAddType] = useState<SceneType>("text");
  const [canShare, setCanShare] = useState(false);
  const [link, setLink] = useState("");
  const [html, setHtml] = useState("");
  const loadedId = useRef("");

  useEffect(() => {
    const c = cards.get(id);
    if (!c) {
      setMsg({ kind: "err", text: "Diese Karte gibt es (auf diesem Gerät) nicht." });
      return;
    }
    loadedId.current = id;
    setCard(c);
    setData(c.data);
    setContact(c.contactId ? contacts.get(c.contactId) : null);
    setHistory([]);
    setAiReady(aiEnabled());
    setCanShare(typeof navigator.share === "function");
    const w = sessionStorage.getItem("bdgen-warning");
    if (w) {
      sessionStorage.removeItem("bdgen-warning");
      setMsg({ kind: "err", text: w });
    }
  }, [id]);

  // Autosave (local, so it is cheap) and refresh the share link.
  useEffect(() => {
    if (!data || !card || loadedId.current !== card.id) return;
    setSaved(false);
    const t = setTimeout(() => {
      try {
        cards.update(card.id, { data, title: card.title });
        setSaved(true);
      } catch (e) {
        setMsg({ kind: "err", text: errText(e) });
      }
      encodeCard(data).then((s) => setLink(`${window.location.origin}${BASE}/k/#${s}`));
    }, 400);
    return () => clearTimeout(t);
  }, [data, card]);

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
    setPreviewKey((k) => k + 1);
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
  const duplicateScene = (i: number) => {
    remember();
    update((d) => ({ ...d, scenes: [...d.scenes.slice(0, i + 1), structuredClone(d.scenes[i]), ...d.scenes.slice(i + 1)] }));
  };
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
    if (!data || !card) return;
    setBusy(`scene-${i}`);
    setMsg(null);
    try {
      const r = await rewriteScene(briefFor(card), data.scenes[i], instruction);
      remember();
      setScene(i, r.scene);
      setPreviewStart(i + 1);
      setPreviewKey((k) => k + 1);
      setMsg({ kind: "ok", text: `Seite ${i + 1} wurde neu geschrieben. Gefällt’s nicht? „↶ Rückgängig“ oben.` });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    } finally {
      setBusy("");
    }
  }

  async function regenerateAll() {
    if (!data || !card) return;
    setBusy("all");
    setMsg(null);
    try {
      const r = await generateCard(briefFor(card), extra);
      remember();
      update((d) => ({ ...d, scenes: r.scenes, cinema: r.cinema, topLine: r.topLine }));
      setPreviewStart(1);
      setPreviewKey((k) => k + 1);
      setOpen(0);
      setTab("texts");
      setMsg({ kind: "ok", text: "Die ganze Karte wurde neu geschrieben. Mit „↶ Rückgängig“ kommst du zur vorherigen Fassung." });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    } finally {
      setBusy("");
    }
  }

  async function changeStyle(instruction: string) {
    if (!data) return;
    setBusy("style");
    setMsg(null);
    try {
      const r = aiEnabled() ? await restyle(data.theme, data.effects, instruction) : restyleOffline(data, instruction);
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

  function deleteCard() {
    if (!card || !confirm("Diese Karte wirklich löschen? Bereits verschickte Links funktionieren weiter.")) return;
    cards.remove(card.id);
    router.push(contact ? `/kontakt/?id=${contact.id}` : "/");
  }

  async function shareLink() {
    if (!link) return;
    if (canShare) {
      try {
        await navigator.share({ title: occasionLabel(data!.occasion), url: link });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    await navigator.clipboard?.writeText(link).catch(() => {});
    setMsg({ kind: "ok", text: "Link kopiert – jetzt einfach in WhatsApp, SMS oder eine Mail einfügen." });
  }

  function exportFile() {
    if (!data) return;
    download(fileName(data.recipientName), renderCardHTML(data, { exportFile: true }), "text/html");
  }

  async function shareFile() {
    if (!data) return;
    const file = new File([renderCardHTML(data, { exportFile: true })], fileName(data.recipientName), { type: "text/html" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => {});
    } else {
      exportFile();
    }
  }

  if (!data || !card) {
    return (
      <div className="shell">
        <TopBar />
        {msg ? (
          <div className="stack">
            <div className="notice err">{msg.text}</div>
            <div><Link href="/" className="btn ghost">← Zur Übersicht</Link></div>
          </div>
        ) : (
          <p className="muted">Lädt …</p>
        )}
      </div>
    );
  }

  return (
    <div className="shell">
      <TopBar>
        <span className="save-state hide-sm">{saved ? "✓ Gespeichert" : "Speichert …"}</span>
        {history.length > 0 && (
          <button className="btn ghost sm" onClick={undo} title="Letzte Änderung rückgängig machen">
            ↶ Rückgängig
          </button>
        )}
      </TopBar>

      <div className="spread" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">
            {contact ? <Link href={`/kontakt/?id=${contact.id}`}>{contact.name}</Link> : "Karte"} · {occasionLabel(data.occasion)}
          </div>
          <h1>{card.title}</h1>
        </div>
        <div className="row">
          <button className="btn sm" onClick={shareLink} disabled={!link}>
            📨 Link teilen
          </button>
          <button className="btn ghost sm" onClick={exportFile}>
            ⬇ Datei
          </button>
        </div>
      </div>

      {msg && msg.text && (
        <div className={`notice ${msg.kind}`} style={{ marginBottom: 14 }} onClick={() => setMsg(null)}>
          {msg.text}
        </div>
      )}

      <div className="mobile-switch">
        <div className="seg">
          <button className={view === "edit" ? "on" : ""} onClick={() => setView("edit")}>✏️ Bearbeiten</button>
          <button className={view === "preview" ? "on" : ""} onClick={() => { setView("preview"); setPreviewKey((k) => k + 1); }}>👀 Vorschau</button>
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
              <div className="tip">
                <span aria-hidden="true">💡</span>
                <span>Tippe auf eine Seite, um sie zu öffnen. Mit den ✨-Knöpfen schreibt die KI sie um – oder du änderst den Text einfach selbst.</span>
              </div>
              <Text label="Zeile ganz oben" value={data.topLine} onChange={(v) => update((d) => ({ ...d, topLine: v }))} />
              <div>
                {data.scenes.map((s, i) => (
                  <div key={i} className={`scene${open === i ? " open" : ""}`}>
                    <div className="scene-head" onClick={() => toggleScene(i)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggleScene(i)}>
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
              onPrompt={changeStyle}
            />
          )}

          {tab === "ai" && (
            <div className="stack">
              <div>
                <h2>Ganze Karte neu schreiben</h2>
                <p className="muted small" style={{ margin: "4px 0 0" }}>
                  Die KI nutzt die Stichworte der Person. Design und Effekte bleiben, nur die Texte werden neu geschrieben. Der Name wird nicht an die KI geschickt.
                </p>
              </div>
              {contact && (
                <div className="sub">
                  <div className="small">
                    <strong>{contact.relation || "Person"}</strong> · {contact.address === "sie" ? "Sie" : "du"} · {occasionLabel(contact.occasion)}
                    {contact.mood.length > 0 && <> · Stimmung: {contact.mood.join(", ")}</>}
                  </div>
                  <div className="small muted" style={{ whiteSpace: "pre-wrap" }}>{contact.notes || "Noch keine Stichworte hinterlegt."}</div>
                  <div>
                    <Link href={`/kontakt/?id=${contact.id}`} className="btn ghost sm">Stichworte bearbeiten</Link>
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
              {!aiReady && (
                <div className="notice">
                  Die KI ist noch nicht eingerichtet. <Link href="/einstellungen/">Jetzt einrichten →</Link>
                </div>
              )}
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
                <h3>📨 Als Link verschicken</h3>
                <p className="muted small" style={{ margin: 0 }}>
                  Die ganze Karte steckt im Link selbst – sie wird nirgends hochgeladen. Wenn du danach noch etwas änderst, schick einfach den neuen Link.
                </p>
                <input type="text" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
                <div className="row">
                  <button className="btn sm" onClick={shareLink} disabled={!link}>{canShare ? "Teilen …" : "Link kopieren"}</button>
                  <a className="btn ghost sm" href={link} target="_blank" rel="noreferrer">Ansehen</a>
                </div>
              </div>
              <div className="sub">
                <h3>📎 Als Datei</h3>
                <p className="muted small" style={{ margin: 0 }}>Eine einzelne HTML-Datei, die auch ohne Internet funktioniert – z. B. als Mail-Anhang.</p>
                <label className="toggle">
                  <input type="checkbox" checked={data.iosHint} onChange={(e) => update((d) => ({ ...d, iosHint: e.target.checked }))} />
                  iPhone-Hinweis unter der Karte anzeigen
                </label>
                <div className="row">
                  <button className="btn sm" onClick={exportFile}>⬇ Herunterladen</button>
                  {canShare && <button className="btn ghost sm" onClick={shareFile}>Datei teilen …</button>}
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
