"use client";

import Link from "next/link";
import { SERVER } from "@/lib/repo";
import { useApp } from "./Gate";

export function TopBar({ children }: { children?: React.ReactNode }) {
  const { hasVault, lock, showIntro } = useApp();
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark">✦</span> Bdgen
      </Link>
      <div className="row">
        {children}
        <button className="btn ghost sm icon" onClick={showIntro} title="Hilfe & Einführung" aria-label="Hilfe">?</button>
        <Link href="/einstellungen/" className="btn ghost sm icon" title="Einstellungen" aria-label="Einstellungen">⚙</Link>
        {hasVault && (
          <button className="btn ghost sm hide-sm" onClick={lock} title={SERVER ? "Abmelden" : "Gerät sperren"}>{SERVER ? "Abmelden" : "Sperren"}</button>
        )}
      </div>
    </header>
  );
}
