"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { BASE } from "@/lib/base";
import { SERVER } from "@/lib/repo";
import { clearAI, getAI, introSeen, markIntroSeen, setAI, UNLOCK_DAYS } from "@/lib/settings";
import { requestPersistence } from "@/lib/store";
import { fetchVault, openVault, type Vault } from "@/lib/vault";
import { Intro } from "./Intro";

interface AppCtx {
  locked: boolean;
  hasVault: boolean;
  lock: () => void;
  showIntro: () => void;
}

const Ctx = createContext<AppCtx>({ locked: false, hasVault: false, lock: () => {}, showIntro: () => {} });
export const useApp = () => useContext(Ctx);

export function Gate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "open">("checking");
  const [vault, setVault] = useState<Vault | null>(null);
  const [intro, setIntro] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (SERVER) {
      // The server already checked the session cookie before serving this page.
      setState("open");
      if (!introSeen()) setIntro(true);
      return;
    }
    requestPersistence();
    fetchVault().then((v) => {
      setVault(v);
      const ai = getAI();
      const unlocked = !v || (ai?.source === "vault" && ai.vaultId === v.id);
      setState(unlocked ? "open" : "locked");
      if (unlocked && !introSeen()) setIntro(true);
    });
  }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!vault) return;
    setBusy(true);
    setErr("");
    try {
      const cfg = await openVault(vault, pw);
      setAI({ ...cfg, source: "vault", vaultId: vault.id, expires: Date.now() + UNLOCK_DAYS * 864e5 });
      setState("open");
      if (!introSeen()) setIntro(true);
    } catch (ex) {
      await new Promise((r) => setTimeout(r, 600));
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  const lock = useCallback(() => {
    if (SERVER) {
      fetch(`${BASE}/api/logout/`, { method: "POST" }).finally(() => (window.location.href = `${BASE}/login/`));
      return;
    }
    if (getAI()?.source === "vault") clearAI();
    setPw("");
    setState(vault ? "locked" : "open");
  }, [vault]);

  const closeIntro = () => {
    markIntroSeen();
    setIntro(false);
  };

  if (state === "checking") return <main className="login"><span className="spinner" /></main>;

  if (state === "locked") {
    return (
      <main className="login">
        <form className="panel stack" onSubmit={unlock}>
          <div style={{ fontSize: "1.25rem", letterSpacing: ".55em", color: "var(--accent)" }}>✦ ✧ ✦</div>
          <div className="eyebrow">Privater Bereich</div>
          <h1>Bdgen</h1>
          <p className="muted" style={{ margin: 0 }}>Persönliche Überraschungen für die Menschen, die dir wichtig sind.</p>
          <input type="password" placeholder="Passwort" autoFocus autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          {err && <div className="notice err">{err}</div>}
          <button className="btn" disabled={busy || !pw}>{busy ? <span className="spinner" /> : "Entsperren →"}</button>
          <p className="muted small" style={{ margin: 0 }}>Dieses Gerät bleibt {UNLOCK_DAYS} Tage entsperrt.</p>
        </form>
      </main>
    );
  }

  return (
    <Ctx.Provider value={{ locked: false, hasVault: SERVER || !!vault, lock, showIntro: () => setIntro(true) }}>
      {children}
      {intro && <Intro onClose={closeIntro} />}
    </Ctx.Provider>
  );
}
