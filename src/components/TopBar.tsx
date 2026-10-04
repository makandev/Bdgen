"use client";

import { HOME } from "@/lib/base";
import Link from "next/link";
import { SERVER } from "@/lib/repo";
import { useApp } from "./Gate";

export function TopBar({ children }: { children?: React.ReactNode }) {
  const { canLock, lock, showIntro } = useApp();
  return (
    <header className="topbar">
      <Link href={HOME} className="brand">
        <span className="brand-mark">✦</span> Funkelpost
      </Link>
      <div className="row">
        {children}
        <nav className="mainnav" aria-label="Hauptmenü">
          <Link href={HOME} className="btn ghost sm icon nav-home" title="Start"><span aria-hidden="true">🏠</span><span className="lbl">Start</span></Link>
          <Link href="/kalender/" className="btn ghost sm icon" title="Geburtstags-Organizer"><span aria-hidden="true">📅</span><span className="lbl">Kalender</span></Link>
          <Link href="/beispiele/" className="btn ghost sm icon" title="Beispiele"><span aria-hidden="true">👀</span><span className="lbl">Beispiele</span></Link>
          <Link href="/infos/" className="btn ghost sm icon" title="Infos & KI-Leitfaden"><span aria-hidden="true">ℹ️</span><span className="lbl">Infos</span></Link>
          <button className="btn ghost sm icon" onClick={showIntro} title="Hilfe & Einführung"><span aria-hidden="true">?</span><span className="lbl">Hilfe</span></button>
          <Link href="/einstellungen/" className="btn ghost sm icon" title="Einstellungen"><span aria-hidden="true">⚙</span><span className="lbl">Einstellungen</span></Link>
        </nav>
        {canLock && (
          <button className="btn ghost sm hide-sm" onClick={lock} title={SERVER ? "Abmelden" : "Gerät sperren"}>{SERVER ? "Abmelden" : "Sperren"}</button>
        )}
      </div>
    </header>
  );
}
