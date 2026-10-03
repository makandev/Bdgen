"use client";

import Link from "next/link";
import { api } from "./client";

export function TopBar({ children }: { children?: React.ReactNode }) {
  async function logout() {
    await api("/api/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark">✦</span> Bdgen
      </Link>
      <div className="row">
        {children}
        <button className="btn ghost sm" onClick={logout} title="Abmelden">
          Abmelden
        </button>
      </div>
    </header>
  );
}
