"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { BASE } from "@/lib/base";
import { SERVER } from "@/lib/repo";
import { clearAI, hasDeviceLock, introSeen, isLocked, lockAI, markIntroSeen, unlockAI } from "@/lib/settings";
import { requestPersistence } from "@/lib/store";
import { Intro } from "./Intro";
import { Sparkles } from "./Sparkles";

interface AppCtx {
  /** A lock button makes sense: server login, or a device password for the AI keys. */
  canLock: boolean;
  lock: () => void;
  showIntro: () => void;
  /** Settings call this after turning the device password on or off. */
  refresh: () => void;
}

const Ctx = createContext<AppCtx>({ canLock: false, lock: () => {}, showIntro: () => {}, refresh: () => {} });
export const useApp = () => useContext(Ctx);

/**
 * Browser version: asks for the device password if the AI keys on this device are protected.
 * Server version: the proxy already checked the login before this page was served.
 */
export function Gate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");
  const [canLock, setCanLock] = useState(SERVER);
  const [intro, setIntro] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const open = useCallback(() => {
    setState("open");
    // Only greet on the start page – someone following a link straight into the organizer wants to get going.
    const atStart = window.location.pathname.slice(BASE.length).replace(/\/(index\.html)?$/, "") === "";
    if (atStart && !introSeen()) setIntro(true);
  }, []);

  useEffect(() => {
    if (SERVER) return open();
    requestPersistence();
    setCanLock(hasDeviceLock());
    if (isLocked()) setState("locked");
    else open();
  }, [open]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await unlockAI(pw);
      setPw("");
      open();
    } catch (ex) {
      await new Promise((r) => setTimeout(r, 600));
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  function forgot() {
    if (!confirm("Die KI-Schlüssel auf diesem Gerät löschen? Personen und Karten bleiben erhalten – den Schlüssel trägst du danach in den Einstellungen neu ein.")) return;
    clearAI();
    setCanLock(false);
    open();
  }

  const lock = useCallback(() => {
    if (SERVER) {
      fetch(`${BASE}/api/logout/`, { method: "POST" }).finally(() => (window.location.href = `${BASE}/login/`));
      return;
    }
    lockAI();
    setPw("");
    setState(hasDeviceLock() ? "locked" : "open");
  }, []);

  const refresh = useCallback(() => setCanLock(SERVER || hasDeviceLock()), []);

  const closeIntro = () => {
    markIntroSeen();
    setIntro(false);
  };

  if (state === "checking") return <main className="login"><span className="spinner" /></main>;

  if (state === "locked") {
    return (
      <main className="login">
        <Sparkles />
        <form className="panel stack" onSubmit={unlock}>
          <div style={{ fontSize: "1.25rem", letterSpacing: ".55em", color: "var(--accent)" }}>✦ ✧ ✦</div>
          <div className="eyebrow">Geschützt</div>
          <h1>Funkelpost</h1>
          <p className="muted" style={{ margin: 0 }}>Deine KI-Schlüssel sind auf diesem Gerät mit deinem Passwort verschlüsselt.</p>
          <input type="password" placeholder="Geräte-Passwort" autoFocus autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          {err && <div className="notice err">{err}</div>}
          <button className="btn" disabled={busy || !pw}>{busy ? <span className="spinner" /> : "Entsperren →"}</button>
          <button type="button" className="linklike small" onClick={forgot}>Passwort vergessen?</button>
        </form>
      </main>
    );
  }

  return (
    <Ctx.Provider value={{ canLock, lock, showIntro: () => setIntro(true), refresh }}>
      {children}
      {intro && <Intro onClose={closeIntro} />}
    </Ctx.Provider>
  );
}
