"use client";

import { withGenerated } from "@/lib/cardbase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { download, errText } from "@/components/client";
import { DesignPanel } from "@/components/DesignPanel";
import { Text } from "@/components/fields";
import { SCENE_LABELS, SceneAI, SceneFields, sceneSummary } from "@/components/SceneEditor";
import { VoucherFields } from "@/components/VoucherFields";
import { TopBar } from "@/components/TopBar";
import { occasionLabel } from "@/lib/presets";
import { renderCardHTML } from "@/lib/render";
import { buildRating, repo, SERVER } from "@/lib/repo";
import { RatingBar } from "@/components/RatingBar";
import { defaultCardData, giftScene, withGift } from "@/lib/templates";
import { normalizeCardData } from "@/lib/validate";
import type { Generated } from "@/lib/prompts";
import { blankScene } from "@/lib/templates";
import type { Card, CardData, Contact, Reaction, Scene, SceneType } from "@/lib/types";

type Tab = "texts" | "design" | "share";
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
  const [attempt, setAttempt] = useState(0);
  const [ratingKey, setRatingKey] = useState(0);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [link, setLink] = useState("");
  const [html, setHtml] = useState("");
  const loadedId = useRef("");
  const firstSave = useRef(true);

  useEffect(() => {
    let alive = true;
    repo.getCard(id).then((r) => {
      if (!alive) return;
      if (!r) {
        setMsg({ kind: "err", text: "Diese Karte gibt es nicht (mehr)." });
        return;
      }
      loadedId.current = id;
      firstSave.current = true;
      // Cards saved by older versions may lack newer fields – fill them with defaults.
      const fresh = normalizeCardData(
        r.card.data,
        defaultCardData({ recipientName: r.card.data.recipientName, address: r.card.data.address, occasion: r.card.data.occasion, preset: r.card.data.theme?.preset }),
      );
      r.card = { ...r.card, data: fresh };
      setCard(r.card);
      if (SERVER) repo.reactions(r.card.id).then(setReactions).catch(() => {});
      setData(r.card.data);
      setContact(r.contact);
      setHistory([]);
    });
    repo.aiSource().then((s) => setAiReady(s !== "none")).catch(() => setAiReady(false));
    setCanShare(typeof navigator.share === "function");
    const w = sessionStorage.getItem("bdgen-warning");
    if (w) {
      sessionStorage.removeItem("bdgen-warning");
      setMsg({ kind: "err", text: w });
    }
    return () => {
      alive = false;
    };
  }, [id]);

  // Autosave and refresh the share link.
  useEffect(() => {
    if (!data || !card || loadedId.current !== card.id) return;
    if (firstSave.current) {
      firstSave.current = false;
      repo.shareLink(card, data).then(setLink);
      return;
    }
    setSaved(false);
    const t = setTimeout(() => {
      repo
        .saveCard(card.id, { data, title: card.title, shared: card.shared })
        .then(() => setSaved(true))
        .catch((e) => setMsg({ kind: "err", text: `Speichern fehlgeschlagen: ${errText(e)}` }));
      repo.shareLink(card, data).then(setLink);
    }, SERVER ? 700 : 400);
    return () => clearTimeout(t);
  }, [data, card]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setHtml(renderCardHTML(data, { startScene: previewStart, preview: true })), 250);
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
      const r = await repo.rewrite(card, data.scenes[i], instruction);
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

  function applyGen(d: CardData, r: Generated): CardData {
    return withGenerated(d, r);
  }

  function rate(value: 1 | -1, reasons: string[]) {
    if (!card || !data) return;
    repo.addRating(buildRating(card, data, contact, { value, reasons, attempt })).catch(() => {});
  }

  async function retry(reasons: string[], text: string) {
    if (!data || !card) return;
    setBusy("all");
    setMsg(null);
    try {
      const r = await repo.generate(card, extra, { reasons, text, previous: data });
      remember();
      update((d) => applyGen(d, r));
      setAttempt((a) => a + 1);
      setRatingKey((k) => k + 1);
      setPreviewStart(1);
      setPreviewKey((k) => k + 1);
      setView("preview");
      setMsg({ kind: "ok", text: "Neue Fassung ist da – schau sie dir in der Vorschau an. Die alte holst du mit „↶ Rückgängig“ zurück." });
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    } finally {
      setBusy("");
    }
  }

  function addGift() {
    if (!data) return;
    const gift = giftScene(data.address);
    const scenes = withGift(data.scenes, gift);
    setData({ ...data, scenes });
    const i = scenes.findIndex((x) => x.type === "gift");
    setOpen(i);
    setPreviewStart(i + 1);
  }

  async function regenerateAll() {
    if (!data || !card) return;
    setBusy("all");
    setMsg(null);
    try {
      const r = await repo.generate(card, extra);
      remember();
      update((d) => applyGen(d, r));
      setAttempt(0);
      setRatingKey((k) => k + 1);
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
    if (!data || !card) return;
    setBusy("style");
    setMsg(null);
    try {
      const r = await repo.restyle(card, data, instruction);
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
    const note = SERVER ? "Der Link funktioniert danach nicht mehr." : "Bereits verschickte Links funktionieren weiter.";
    if (!card || !confirm(`Diese Karte wirklich löschen? ${note}`)) return;
    try {
      await repo.deleteCard(card.id);
      router.push(contact ? `/kontakt/?id=${contact.id}` : "/");
    } catch (e) {
      setMsg({ kind: "err", text: errText(e) });
    }
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
            <div><Link href="/start/" className="btn ghost">← Zur Übersicht</Link></div>
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
          <h1>{card.title} {reactions.length > 0 && <button type="button" className="badge" style={{ border: 0, cursor: "pointer", verticalAlign: "middle" }} onClick={() => setTab("share")}>💌 {reactions.length}</button>}</h1>
        </div>
        <div className="row">
          <button className="btn sm" onClick={shareLink} disabled={!link || card.shared === false}>
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
          <RatingBar key={ratingKey} attempt={attempt} aiReady={aiReady} busy={busy === "all"} onRate={rate} onRetry={retry} />
          <nav className="tabs">
            {([["texts", "✨ Texte"], ["design", "🎨 Design"], ["share", "📨 Teilen"]] as [Tab, string][]).map(([k, l]) => (
              <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </nav>

          {tab === "texts" && (
            <div className="stack">
              <div className="ai-hero">
                <h2>✨ Ganze Karte von der KI schreiben lassen</h2>
                <p className="muted small" style={{ margin: 0 }}>
                  Die KI nutzt die Stichworte {contact ? <>zu <b>{contact.relation || contact.name}</b></> : "der Person"}. Design und Effekte bleiben gleich. Der Name wird nie an die KI geschickt.
                </p>
                <input
                  type="text"
                  value={extra}
                  placeholder="Wunsch (optional): „mehr Humor“, „kürzer“, „Anspielung auf den Umzug“ …"
                  onChange={(e) => setExtra(e.target.value)}
                />
                <div className="row">
                  <button className="btn" onClick={regenerateAll} disabled={!!busy || !aiReady}>
                    {busy === "all" ? <><span className="spinner" /> KI schreibt …</> : "✨ Alle Texte neu schreiben"}
                  </button>
                  {contact && (
                    <Link href={`/kontakt/?id=${contact.id}`} className="btn ghost sm">Stichworte ändern</Link>
                  )}
                  {!data.scenes.some((x) => x.type === "gift") && (
                    <button type="button" className="btn ghost sm" onClick={addGift}>🎁 Geschenk-Seite</button>
                  )}
                </div>
                {!aiReady && (
                  <div className="notice">
                    Die KI ist noch nicht eingerichtet. <Link href="/einstellungen/">Mehr dazu →</Link>
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ margin: "4px 0 10px" }}>Einzelne Seiten</h3>
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
                        {s.type === "gift" && (
                          <label className="gift-quick">
                            <span aria-hidden="true">🎁</span>
                            <input type="text" value={s.gift} placeholder="Was schenkst du? z. B. Konzertkarten" onChange={(e) => setScene(i, { ...s, gift: e.target.value })} />
                          </label>
                        )}
                        {s.type === "gift" && <VoucherFields value={s.voucher} onChange={(voucher) => setScene(i, { ...s, voucher })} />}
                        <SceneAI busy={busy === `scene-${i}`} disabled={!aiReady || (!!busy && busy !== `scene-${i}`)} onRun={(ins) => rewrite(i, ins)} />
                        <details className="optional">
                          <summary>✏️ Selbst ändern (optional)</summary>
                          <div className="inner">
                            <SceneFields scene={s} onChange={(ns) => setScene(i, ns)} />
                            <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                              <button className="btn ghost sm" onClick={() => moveScene(i, -1)} disabled={i === 0}>↑ Nach oben</button>
                              <button className="btn ghost sm" onClick={() => moveScene(i, 1)} disabled={i === data.scenes.length - 1}>↓ Nach unten</button>
                              <button className="btn ghost sm" onClick={() => duplicateScene(i)}>Duplizieren</button>
                              <button className="btn danger sm" onClick={() => removeScene(i)} disabled={data.scenes.length <= 1}>Entfernen</button>
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <details className="optional">
                <summary>🧩 Seiten hinzufügen, Kopfzeile & Kino-Finale (optional)</summary>
                <div className="inner">
                  <div className="row">
                    <select value={addType} onChange={(e) => setAddType(e.target.value as SceneType)} style={{ width: "auto" }}>
                      {(Object.keys(SCENE_LABELS) as SceneType[]).map((t) => (
                        <option key={t} value={t}>{SCENE_LABELS[t]}</option>
                      ))}
                    </select>
                    <button className="btn ghost sm" onClick={addScene}>+ Seite hinzufügen</button>
                  </div>
                  <Text label="Zeile ganz oben" value={data.topLine} onChange={(v) => update((d) => ({ ...d, topLine: v }))} />
                  {data.effects.cinema && (
                    <div className="sub">
                      <h3>🎬 Kino-Finale</h3>
                      <Text label="1. Einblendung" value={data.cinema.kicker} onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, kicker: v } }))} />
                      <Text label="2. Über dem Namen" value={data.cinema.forLabel} onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, forLabel: v } }))} />
                      <Text label="3. Großer Titel" multiline value={data.cinema.title} onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, title: v } }))} />
                      <Text label="4. Schlusssatz" value={data.cinema.final} hint="*Wort* wird farbig hervorgehoben" onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, final: v } }))} />
                      <Text label="Emoji" value={data.cinema.emoji} onChange={(v) => update((d) => ({ ...d, cinema: { ...d.cinema, emoji: v } }))} />
                    </div>
                  )}
                </div>
              </details>
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

          {tab === "share" && (
            <div className="stack">
              {SERVER && (
                <div className="sub">
                  <h3>💌 Reaktionen {reactions.length > 0 && <span className="badge">{reactions.length}</span>}</h3>
                  {reactions.length === 0 ? (
                    <p className="muted small" style={{ margin: 0 }}>Noch keine Reaktion – sobald die Person auf einen Knopf am Ende der Karte tippt, siehst du es hier.</p>
                  ) : (
                    <div className="reaction-list">
                      {reactions.map((r) => (
                        <div key={r.id} className="reaction-item">
                          <span className="em">{r.emoji}</span>
                          <div>
                            <strong>{r.label}</strong>
                            <div className="muted small">{new Date(r.createdAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</div>
                            {r.message && <div style={{ marginTop: 4 }}>„{r.message}“</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                  {SERVER
                    ? "Der Link bleibt immer gleich – Änderungen sieht die Person sofort. Du kannst ihn jederzeit abschalten."
                    : "Die ganze Karte steckt im Link selbst – sie wird nirgends hochgeladen. Wenn du danach noch etwas änderst, schick einfach den neuen Link."}
                </p>
                <input type="text" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
                <div className="row">
                  <button className="btn sm" onClick={shareLink} disabled={!link || card.shared === false}>{canShare ? "Teilen …" : "Link kopieren"}</button>
                  <a className="btn ghost sm" href={link} target="_blank" rel="noreferrer">Ansehen</a>
                </div>
                {!SERVER && link.length > 60_000 && (
                  <p className="small install-note">
                    ⚠️ Der Link ist sehr lang ({Math.round(link.length / 1000)}.000 Zeichen) – meist wegen des Gutschein-Fotos. WhatsApp schneidet so lange
                    Nachrichten ab. Besser: den Gutschein als <b>Code</b> eintragen, ein kleineres Foto nehmen oder die Karte unten <b>als Datei</b> schicken.
                  </p>
                )}
                {SERVER && (
                  <label className="toggle">
                    <input type="checkbox" checked={card.shared !== false} onChange={(e) => setCard({ ...card, shared: e.target.checked })} />
                    Link ist aktiv (aus = Link funktioniert nicht mehr)
                  </label>
                )}
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
              <details className="optional">
                <summary>💬 Reaktions-Knöpfe am Ende der Karte (optional)</summary>
                <div className="inner">
                  <p className="muted small" style={{ margin: 0 }}>
                    {SERVER
                      ? "Die Person tippt eine Reaktion an – sie kommt direkt hier bei dir an."
                      : "Die Person tippt eine Reaktion an und schickt sie dir per WhatsApp oder Nachricht zurück."}{" "}
                    Die KI wählt die Knöpfe passend zur Karte aus.
                  </p>
                  <label className="toggle">
                    <input type="checkbox" checked={data.reactions?.enabled ?? false} onChange={(e) => update((d) => ({ ...d, reactions: { ...d.reactions, enabled: e.target.checked } }))} />
                    Reaktions-Knöpfe anzeigen
                  </label>
                  {data.reactions?.enabled && (
                    <>
                      <Text label="Frage" value={data.reactions.question} onChange={(v) => update((d) => ({ ...d, reactions: { ...d.reactions, question: v } }))} />
                      {data.reactions.options.map((o, k) => (
                        <div className="row" key={k} style={{ flexWrap: "nowrap" }}>
                          <input type="text" value={o.emoji} style={{ width: 64, textAlign: "center" }} aria-label="Emoji"
                            onChange={(e) => update((d) => ({ ...d, reactions: { ...d.reactions, options: d.reactions.options.map((x, j) => (j === k ? { ...x, emoji: e.target.value } : x)) } }))} />
                          <input type="text" value={o.label} aria-label="Text"
                            onChange={(e) => update((d) => ({ ...d, reactions: { ...d.reactions, options: d.reactions.options.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)) } }))} />
                          <button type="button" className="btn ghost sm icon" disabled={data.reactions.options.length <= 1}
                            onClick={() => update((d) => ({ ...d, reactions: { ...d.reactions, options: d.reactions.options.filter((_, j) => j !== k) } }))}>✕</button>
                        </div>
                      ))}
                      {data.reactions.options.length < 5 && (
                        <div>
                          <button type="button" className="btn ghost sm" onClick={() => update((d) => ({ ...d, reactions: { ...d.reactions, options: [...d.reactions.options, { emoji: "✨", label: "" }] } }))}>+ Knopf</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </details>
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
